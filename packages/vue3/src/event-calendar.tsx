import { useKjunMessageScope } from "./runtime/messages";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import { addDays, calendarDays, moveDate, orderWeekdays, parseDate, todayIso, type CalendarDay, type WeekStart } from "../../../shared/package-runtime/calendar";
import {
  dayTone, eventDayLabel, holidayOf, isPast, resolveMonth, resolveWeek, spanSegment, stepMonth, swipeStep, visibleDots, weekDays,
  type DayMarks, type HolidayTest,
} from "../../../shared/package-runtime/event-calendar";
import { onBeforeUnmount, onMounted, onUpdated, ref, useId, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { useReducedMotion } from "./runtime/presence";
import { useSlide } from "./runtime/slide";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";

export type { DayMarks, DaySpan, HolidayTest } from "../../../shared/package-runtime/event-calendar";

// Mirrors packages/react/src/event-calendar.tsx: same DOM, classes, data-* and aria-*. v-model:month, v-model:week and
// v-model (the picked day) stand for month/onMonthChange, week/onWeekChange and value; @select is onSelect.
// @day-long-press arrives as the onDayLongPress prop, so the long press (and its aria) is on only when the app listens.
const kjunEventCalendarProps = {
  /** A whole month (default) or one week. */
  view: { type: String as PropType<"month" | "week">, default: "month" },
  /** v-model:month. The month shown, "YYYY-MM" (this month when missing or malformed). Without a listener the month does not change. */
  month: { type: String, default: undefined },
  /** v-model:week. Week view: any day of the week shown, "YYYY-MM-DD" (this week when missing); changes ask with the week's first day. */
  week: { type: String, default: undefined },
  /** v-model. The picked day, "YYYY-MM-DD"; null picks nothing. Clearing it is up to the app. */
  modelValue: { type: String as PropType<string | null>, default: null },
  /**
   * Declared as props so the calendar knows whether the app listens: without a listener, arrow keys stop at the edge of the shown month (week).
   * emit("update:month") and v-model:month still reach them.
   */
  "onUpdate:month": { type: Function as PropType<(month: string) => void>, default: undefined },
  "onUpdate:week": { type: Function as PropType<(week: string) => void>, default: undefined },
  /** @day-long-press: touch hold, right click or Shift+Enter on a day; without it these are left to the browser. */
  onDayLongPress: { type: Function as PropType<(iso: string) => void>, default: undefined },
  /** Describes the long press to screen readers, e.g. "이날 약속 추가". */
  dayLongPressLabel: { type: String, default: undefined },
  /** What a day shows under its number: the first span, an icon and up to three dots; count is spoken only. */
  marks: { type: Function as PropType<(iso: string) => DayMarks | undefined>, default: undefined },
  /** Holidays draw a danger number; a string also names the day for screen readers. */
  isHoliday: { type: Function as PropType<HolidayTest>, default: undefined },
  /** Fades the numbers and marks of days before today (default true); span bars keep their colour. */
  dimPast: { type: Boolean, default: true },
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart: { type: Number as PropType<WeekStart>, default: 0 },
  /** Paints Sundays with the danger role (default true). */
  markSunday: { type: Boolean, default: true },
  /** Paints Saturdays with the info role (default true). */
  markSaturday: { type: Boolean, default: true },
  /** A horizontal touch swipe asks for the next or previous month or week (default true). Mouse drags never do. */
  swipeable: { type: Boolean, default: true },
} as const;
export type KjunEventCalendarProps = ExtractPublicPropTypes<typeof kjunEventCalendarProps>;

const calendar = tokens.extensions.calendar;
// A month key is "YYYY-MM"; a week key is the week's first day.
const within = (iso: string, key: string) => key.length === 7 ? iso.startsWith(key + "-") : iso >= key && iso <= addDays(key, 6);
function daysOf(key: string, today: string, weekStart: WeekStart): CalendarDay[] {
  if (key.length !== 7) return weekDays(key, today);
  const [year, month] = key.split("-").map(Number);
  return calendarDays(year, month - 1, { today, weekStart, fixedWeeks: true });
}
const isoOf = (target: EventTarget | null) => (target as Element | null)?.closest?.<HTMLElement>("[data-iso]")?.dataset.iso;
interface TouchTrack { id: number; x: number; y: number; timer?: ReturnType<typeof setTimeout>; swiped: boolean; held: boolean }

/** A month or week of days that show events as dots, an icon and a span bar. It draws no card or heading. */
export const KjunEventCalendar = defineComponent({
  name: "KjunEventCalendar",
  props: kjunEventCalendarProps,
  emits: {
    "update:month": (_month: string) => true,
    "update:week": (_week: string) => true,
    "update:modelValue": (_iso: string) => true,
    select: (_iso: string) => true,
  },
  setup(props, { emit }) {
    const scope = useKjunMessageScope();
    const reduced = useReducedMotion();
    const key = () => props.view === "week" ? resolveWeek(props.week, props.weekStart, todayIso()) : resolveMonth(props.month, todayIso());
    // The grid draws the shown month, so the old one stays while it slides out.
    const slide = useSlide(key, () => reduced.value);
    const uid = "kjun-event-calendar-" + useId().replace(/[^\w-]/g, "");
    const grid = ref<HTMLElement | null>(null);
    const focus = ref<string>();
    // The day a navigation key moved to: focus follows it once it is drawn in the shown period, however late the app applies the change.
    // The next pointer press or other key drops it.
    let focusWanted: string | null = null;
    let touch: TouchTrack | null = null;
    // Set when a touch hold has fired, until the next press; a context menu from the same hold is then ignored.
    let held = false;
    // A hold or a swipe is not a pick: the click that follows is dropped once, and only shortly after the finger lifts.
    let swallow = false, swallowTimer: ReturnType<typeof setTimeout> | undefined;

    // React runs this after every render; here it runs after mount and every update of this component.
    const followFocus = () => {
      const wanted = focusWanted;
      if (!wanted) return;
      // Focus went somewhere else on the page: never pull it back.
      const active = document.activeElement;
      if (active && active !== document.body && !grid.value?.contains(active)) { focusWanted = null; return; }
      const target = grid.value?.querySelector<HTMLButtonElement>(`[data-iso="${wanted}"]`);
      if (!target) return;
      if (active !== target) target.focus({ preventScroll: true });
      // An outside copy in the old month holds focus until the new period is drawn.
      if (within(wanted, slide.value.shown)) focusWanted = null;
    };
    onMounted(followFocus);
    onUpdated(followFocus);
    const endTouch = () => { clearTimeout(touch?.timer); touch = null; };
    onBeforeUnmount(() => { endTouch(); clearTimeout(swallowTimer); });

    const canChange = () => !!(props.view === "week" ? props["onUpdate:week"] : props["onUpdate:month"]);
    // Asks the app for the month (week) holding iso.
    const change = (iso: string) => props.view === "week" ? emit("update:week", resolveWeek(iso, props.weekStart)) : emit("update:month", iso.slice(0, 7));
    const step = (delta: -1 | 1) => change(props.view === "week" ? addDays(key(), 7 * delta) : stepMonth(key(), delta) + "-01");

    const onKeydown = (event: KeyboardEvent) => {
      swallow = held = false;
      // Any key drops a pending focus; a navigation key below sets a new one.
      focusWanted = null;
      const iso = isoOf(event.target);
      if (!iso) return;
      // Enter picks; Shift+Enter is the keyboard long press.
      if (event.key === "Enter" && event.shiftKey) {
        if (props.onDayLongPress) { event.preventDefault(); props.onDayLongPress(iso); }
        return;
      }
      const next = moveDate(iso, event.key, event.shiftKey, props.weekStart);
      if (!next) return;
      event.preventDefault();
      if (!within(next, key())) { if (!canChange()) return; change(next); }
      focusWanted = next;
      focus.value = next;
    };
    const onPointerdown = (event: PointerEvent) => {
      swallow = false;
      held = false;
      focusWanted = null;
      endTouch();
      if (event.pointerType !== "touch") return;
      const iso = isoOf(event.target), track: TouchTrack = { id: event.pointerId, x: event.clientX, y: event.clientY, swiped: false, held: false };
      const press = props.onDayLongPress;
      if (iso && press) track.timer = setTimeout(() => { track.held = held = swallow = true; press(iso); }, calendar.longPressDelay);
      touch = track;
    };
    const onPointermove = (event: PointerEvent) => {
      const track = touch;
      if (!track || track.id !== event.pointerId || track.swiped || track.held) return;
      const dx = event.clientX - track.x, dy = event.clientY - track.y;
      if (Math.hypot(dx, dy) > calendar.longPressSlop) clearTimeout(track.timer);
      const delta = props.swipeable ? swipeStep(dx, dy) : 0;
      if (!delta) return;
      // One swipe asks for one month (week); the rest of the gesture is ignored.
      track.swiped = true;
      swallow = true;
      step(delta);
    };
    // The finger lifted: a click due to the gesture comes right after, so the swallow flag lasts only that long.
    const onPointerEnd = () => {
      endTouch();
      clearTimeout(swallowTimer);
      if (swallow) swallowTimer = setTimeout(() => { swallow = false; }, calendar.pressGuard);
    };
    const onContextmenu = (event: MouseEvent) => {
      const iso = isoOf(event.target);
      if (!props.onDayLongPress || !iso) return;
      event.preventDefault();
      // A touch hold may raise the context menu as well as the timer (even after pointercancel); whichever comes first counts.
      if (held) return;
      const track = touch;
      if (track) {
        if (track.swiped) return;
        clearTimeout(track.timer); track.held = held = swallow = true;
      }
      props.onDayLongPress(iso);
    };
    const pick = (day: CalendarDay) => {
      if (swallow) { swallow = false; return; }
      focus.value = day.iso;
      emit("update:modelValue", day.iso);
      emit("select", day.iso);
      // An outside day picks first, then brings its month.
      if (day.outside) emit("update:month", day.iso.slice(0, 7));
    };

    return () => {
      const today = todayIso(), weekStart = props.weekStart, value = props.modelValue;
      const shown = slide.value.shown, phase = slide.value.phase;
      const days = daysOf(shown, today, weekStart);
      const first = parseDate(shown.length === 7 ? shown + "-01" : shown)!;
      const labels = calendarLabels(first.year, first.month, scope.value);
      // A week across two months names both.
      const last = shown.length === 7 ? first : parseDate(addDays(shown, 6))!;
      const title = last.month === first.month ? labels.title : labels.title + " – " + calendarLabels(last.year, last.month, scope.value).title;
      const tabStop = [focus.value, value, today].find(iso => !!iso && within(iso, shown)) ?? days.find(day => within(day.iso, shown))!.iso;
      const longPress = !!props.onDayLongPress;
      const describe = longPress && props.dayLongPressLabel ? uid + "-long-press" : undefined;
      const { markSunday, markSaturday } = props;
      return (
        <div class="kjun-event-calendar" data-view={props.view} data-swipeable={props.swipeable || undefined}>
          <div class="kjun-event-calendar-weekdays">
            {orderWeekdays(labels.weekdays, weekStart).map((name, index) => {
              const tone = dayTone((index + weekStart) % 7, { markSunday, markSaturday, holiday: false });
              return <span key={index} class="kjun-calendar-weekday" data-tone={tone === "text" ? undefined : tone} aria-hidden="true">{name}</span>;
            })}
          </div>
          <div ref={grid} class="kjun-event-calendar-grid" role="group" aria-label={title}
            data-slide={phase === "idle" ? undefined : phase} data-direction={phase === "idle" ? undefined : slide.value.direction}
            onKeydown={onKeydown} onPointerdown={onPointerdown} onPointermove={onPointermove} onPointerup={onPointerEnd} onPointercancel={onPointerEnd}
            onContextmenu={onContextmenu}>
            {days.map((day, index) => {
              const holiday = holidayOf(props.isHoliday, day.iso, scope.value);
              const tone = dayTone(day.weekday, { markSunday, markSaturday, holiday: holiday.holiday });
              const mark = props.marks?.(day.iso);
              const dots = visibleDots(mark?.dots), icon = mark?.icon;
              const span = mark?.spans?.[0], segment = span ? spanSegment(span, day.iso, index % 7) : null;
              const selected = day.iso === value;
              return (
                <button key={day.iso} type="button" class="kjun-calendar-day" data-density="comfortable" data-iso={day.iso}
                  tabindex={day.iso === tabStop ? 0 : -1} aria-label={eventDayLabel(day.iso, { holiday: holiday.name, count: mark?.count }, scope.value)}
                  aria-pressed={selected} aria-current={day.today ? "date" : undefined}
                  aria-keyshortcuts={longPress ? "Shift+Enter" : undefined} aria-describedby={describe}
                  data-today={day.today || undefined} data-selected={selected || undefined} data-outside={day.outside || undefined}
                  data-past={(props.dimPast && isPast(day.iso, today)) || undefined} data-tone={tone === "text" ? undefined : tone}
                  onClick={() => pick(day)}>
                  <span class="kjun-calendar-day-number">{day.day}</span>
                  {(icon || dots.length > 0) && (
                    <span class="kjun-event-calendar-marks" aria-hidden="true">
                      {icon && <KjunIcon name={icon.name} filled size={calendar.eventIconSize} class="kjun-event-calendar-icon" style={{ color: icon.color }} />}
                      {dots.map((color, dot) => <i key={dot} class="kjun-event-calendar-dot" style={{ background: color }} />)}
                    </span>
                  )}
                  {span && segment && <i class="kjun-event-calendar-span" aria-hidden="true" style={{ background: span.color }}
                    data-start={segment.start || undefined} data-end={segment.end || undefined} />}
                </button>
              );
            })}
          </div>
          {describe && <span id={describe} hidden>{props.dayLongPressLabel}</span>}
        </div>
      );
    };
  },
});
