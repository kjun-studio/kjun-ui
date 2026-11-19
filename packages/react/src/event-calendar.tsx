import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import { addDays, moveDate, orderWeekdays, parseDate, todayIso, type CalendarDay, type WeekStart } from "../../../shared/package-runtime/calendar";
import {
  dayTone, eventDayLabel, holidayOf, isPast, periodDays, periodTitle, resolveMonth, resolveWeek, spanSegment, stepMonth, swipeStep, visibleDots, withinPeriod as within,
  type DayMarks, type HolidayTest,
} from "../../../shared/package-runtime/event-calendar";
import { useSlide } from "../../../shared/package-runtime/use-slide";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { KjunIcon } from "./button";
import { useReducedMotion } from "./use-reduced-motion";

export type { DayMarks, DaySpan, HolidayTest } from "../../../shared/package-runtime/event-calendar";

export interface KjunEventCalendarProps {
  /** A whole month (default) or one week. */
  view?: "month" | "week";
  /** The month shown, "YYYY-MM" (controlled; this month when missing or malformed). */
  month?: string;
  /** Asked for another month by a swipe, the keyboard or an outside day; without it the month does not change. */
  onMonthChange?: (month: string) => void;
  /** Week view: any day of the week shown, "YYYY-MM-DD" (controlled; this week when missing). */
  week?: string;
  /** Asked for another week with that week's first day; without it the week does not change. */
  onWeekChange?: (week: string) => void;
  /** The picked day, "YYYY-MM-DD"; null picks nothing. Clearing it is up to the app. */
  value?: string | null;
  /** A day was pressed; the app decides whether it becomes the value. */
  onSelect?: (iso: string) => void;
  /** Touch hold, right click or Shift+Enter on a day; without it these are left to the browser. */
  onDayLongPress?: (iso: string) => void;
  /** Describes the long press to screen readers, e.g. "이날 약속 추가". */
  dayLongPressLabel?: string;
  /** What a day shows under its number: the first span, an icon and up to three dots; count is spoken only. */
  marks?: (iso: string) => DayMarks | undefined;
  /** Holidays draw a danger number; a string also names the day for screen readers. */
  isHoliday?: HolidayTest;
  /** Fades the numbers and marks of days before today (default true); span bars keep their colour. */
  dimPast?: boolean;
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart?: WeekStart;
  /** Paints Sundays with the danger role (default true). */
  markSunday?: boolean;
  /** Paints Saturdays with the info role (default true). */
  markSaturday?: boolean;
  /** A horizontal touch swipe asks for the next or previous month or week (default true). Mouse drags never do. */
  swipeable?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const calendar = tokens.extensions.calendar;
const isoOf = (target: EventTarget) => (target as Element).closest?.<HTMLElement>("[data-iso]")?.dataset.iso;
interface TouchTrack { id: number; x: number; y: number; timer?: ReturnType<typeof setTimeout>; swiped: boolean; held: boolean }

/** A month or week of days that show events as dots, an icon and a span bar. It draws no card or heading. */
export function KjunEventCalendar({ view = "month", month, onMonthChange, week, onWeekChange, value = null, onSelect, onDayLongPress,
  dayLongPressLabel, marks, isHoliday, dimPast = true, weekStart = 0, markSunday = true, markSaturday = true, swipeable = true, className, style, id }: KjunEventCalendarProps) {
  const scope = useKjunMessageScope();
  const reduced = useReducedMotion();
  const today = todayIso();
  const key = view === "week" ? resolveWeek(week, weekStart, today) : resolveMonth(month, today);
  // The grid draws the shown month, so the old one stays while it slides out.
  const slide = useSlide(key, reduced), shown = slide.shown;
  const days = periodDays(shown, today, weekStart);
  const first = parseDate(shown.length === 7 ? shown + "-01" : shown)!;
  const labels = calendarLabels(first.year, first.month, scope);
  // The month, or the week's first and last day.
  const title = periodTitle(shown, scope);
  const uid = "kjun-event-calendar-" + useId().replace(/:/g, "");
  const grid = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<string>();
  // The day a navigation key moved to: focus follows it once it is drawn in the shown period, however late the app applies the change.
  // The next pointer press or other key drops it.
  const focusWanted = useRef<string | null>(null);
  const touch = useRef<TouchTrack | null>(null);
  // Set when a touch hold has fired, until the next press; a context menu from the same hold is then ignored.
  const held = useRef(false);
  // A hold or a swipe is not a pick: the click that follows is dropped once, and only shortly after the finger lifts.
  const swallow = useRef(false), swallowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tabStop = [focus, value, today].find(iso => !!iso && within(iso, shown)) ?? days.find(day => within(day.iso, shown))!.iso;
  const describe = onDayLongPress && dayLongPressLabel ? uid + "-long-press" : undefined;

  useEffect(() => {
    const wanted = focusWanted.current;
    if (!wanted) return;
    // Focus went somewhere else on the page: never pull it back.
    const active = document.activeElement;
    if (active && active !== document.body && !grid.current?.contains(active)) { focusWanted.current = null; return; }
    const target = grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${wanted}"]`);
    if (!target) return;
    if (active !== target) target.focus({ preventScroll: true });
    // An outside copy in the old month holds focus until the new period is drawn.
    if (within(wanted, shown)) focusWanted.current = null;
  });
  const endTouch = () => { clearTimeout(touch.current?.timer); touch.current = null; };
  useEffect(() => () => { endTouch(); clearTimeout(swallowTimer.current); }, []);

  const canChange = view === "week" ? !!onWeekChange : !!onMonthChange;
  // Asks the app for the month (week) holding iso.
  const change = (iso: string) => view === "week" ? onWeekChange?.(resolveWeek(iso, weekStart)) : onMonthChange?.(iso.slice(0, 7));
  const step = (delta: -1 | 1) => change(view === "week" ? addDays(key, 7 * delta) : stepMonth(key, delta) + "-01");

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    swallow.current = held.current = false;
    // Any key drops a pending focus; a navigation key below sets a new one.
    focusWanted.current = null;
    const iso = isoOf(event.target);
    if (!iso) return;
    // Enter picks; Shift+Enter is the keyboard long press.
    if (event.key === "Enter" && event.shiftKey) {
      if (onDayLongPress) { event.preventDefault(); onDayLongPress(iso); }
      return;
    }
    const next = moveDate(iso, event.key, event.shiftKey, weekStart);
    if (!next) return;
    event.preventDefault();
    if (!within(next, key)) { if (!canChange) return; change(next); }
    focusWanted.current = next;
    setFocus(next);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swallow.current = false;
    held.current = false;
    focusWanted.current = null;
    endTouch();
    if (event.pointerType !== "touch") return;
    const iso = isoOf(event.target), track: TouchTrack = { id: event.pointerId, x: event.clientX, y: event.clientY, swiped: false, held: false };
    if (iso && onDayLongPress) track.timer = setTimeout(() => { track.held = held.current = swallow.current = true; onDayLongPress(iso); }, calendar.longPressDelay);
    touch.current = track;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = touch.current;
    if (!track || track.id !== event.pointerId || track.swiped || track.held) return;
    const dx = event.clientX - track.x, dy = event.clientY - track.y;
    if (Math.hypot(dx, dy) > calendar.longPressSlop) clearTimeout(track.timer);
    const delta = swipeable ? swipeStep(dx, dy) : 0;
    if (!delta) return;
    // One swipe asks for one month (week); the rest of the gesture is ignored.
    track.swiped = true;
    swallow.current = true;
    step(delta);
  };
  // The finger lifted: a click due to the gesture comes right after, so the swallow flag lasts only that long.
  const onPointerEnd = () => {
    endTouch();
    clearTimeout(swallowTimer.current);
    if (swallow.current) swallowTimer.current = setTimeout(() => { swallow.current = false; }, calendar.pressGuard);
  };
  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    const iso = isoOf(event.target);
    if (!onDayLongPress || !iso) return;
    event.preventDefault();
    // A touch hold may raise the context menu as well as the timer (even after pointercancel); whichever comes first counts.
    if (held.current) return;
    const track = touch.current;
    if (track) {
      if (track.swiped) return;
      clearTimeout(track.timer); track.held = held.current = swallow.current = true;
    }
    onDayLongPress(iso);
  };
  const pick = (day: CalendarDay) => {
    if (swallow.current) { swallow.current = false; return; }
    setFocus(day.iso);
    onSelect?.(day.iso);
    // An outside day picks first, then brings its month.
    if (day.outside) onMonthChange?.(day.iso.slice(0, 7));
  };

  return (
    <div id={id} className={"kjun-event-calendar" + (className ? " " + className : "")} style={style} data-view={view} data-swipeable={swipeable || undefined}>
      <div className="kjun-event-calendar-weekdays">
        {orderWeekdays(labels.weekdays, weekStart).map((name, index) => {
          const tone = dayTone((index + weekStart) % 7, { markSunday, markSaturday, holiday: false });
          return <span key={index} className="kjun-calendar-weekday" data-tone={tone === "text" ? undefined : tone} aria-hidden="true">{name}</span>;
        })}
      </div>
      <div ref={grid} className="kjun-event-calendar-grid" role="group" aria-label={title}
        data-slide={slide.phase === "idle" ? undefined : slide.phase} data-direction={slide.phase === "idle" ? undefined : slide.direction}
        onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
        onContextMenu={onContextMenu}>
        {days.map((day, index) => {
          const holiday = holidayOf(isHoliday, day.iso, scope);
          const tone = dayTone(day.weekday, { markSunday, markSaturday, holiday: holiday.holiday });
          const mark = marks?.(day.iso);
          const dots = visibleDots(mark?.dots), icon = mark?.icon;
          const span = mark?.spans?.[0], segment = span ? spanSegment(span, day.iso, index % 7) : null;
          const selected = day.iso === value;
          return (
            <button key={day.iso} type="button" className="kjun-calendar-day" data-density="comfortable" data-iso={day.iso}
              tabIndex={day.iso === tabStop ? 0 : -1} aria-label={eventDayLabel(day.iso, { holiday: holiday.name, count: mark?.count }, scope)}
              aria-pressed={selected} aria-current={day.today ? "date" : undefined}
              aria-keyshortcuts={onDayLongPress ? "Shift+Enter" : undefined} aria-describedby={describe}
              data-today={day.today || undefined} data-selected={selected || undefined} data-outside={day.outside || undefined}
              data-past={(dimPast && isPast(day.iso, today)) || undefined} data-tone={tone === "text" ? undefined : tone}
              onClick={() => pick(day)}>
              <span className="kjun-calendar-day-number">{day.day}</span>
              {(icon || dots.length > 0) && (
                <span className="kjun-event-calendar-marks" aria-hidden="true">
                  {icon && <KjunIcon name={icon.name} filled size={calendar.eventIconSize} className="kjun-event-calendar-icon" style={{ color: icon.color }} />}
                  {dots.map((color, dot) => <i key={dot} className="kjun-event-calendar-dot" style={{ background: color }} />)}
                </span>
              )}
              {span && segment && <i className="kjun-event-calendar-span" aria-hidden="true" style={{ background: span.color }}
                data-start={segment.start || undefined} data-end={segment.end || undefined} />}
            </button>
          );
        })}
      </div>
      {describe && <span id={describe} hidden>{dayLongPressLabel}</span>}
    </div>
  );
}
