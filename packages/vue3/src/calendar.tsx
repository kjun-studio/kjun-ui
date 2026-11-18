import { useKjunMessageScope } from "./runtime/messages";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  calendarDays, calendarFooter, canApplyRange, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside, moveDate,
  orderWeekdays, parseDate, pickMonth, pickYear, rangeRole, stepDisabled, stepTarget, todayIso, toIsoDate, yearGrid,
  yearOutside, type CalendarMode, type DateRange, type DateUnavailable, type RangeLimits, type WeekStart,
} from "../../../shared/package-runtime/calendar";
import { dayTone } from "../../../shared/package-runtime/event-calendar";
import { nextTick, onMounted, ref, useId, watch, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";

/** A named range offered as a chip, such as "최근 7일". */
export interface DateRangePreset { label: string; value: DateRange }
export const calendarOptionProps = {
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart: { type: Number as PropType<WeekStart>, default: 0 },
  /** Paints Sundays with the danger role, as Korean calendars do (default true). */
  markSunday: { type: Boolean, default: true },
  /** Paints Saturdays with the info role (default true). */
  markSaturday: { type: Boolean, default: true },
  /** Days that cannot be picked inside the bounds, such as holidays; a range cannot run across one. */
  isDateUnavailable: { type: Function as PropType<DateUnavailable>, default: undefined },
} as const;

/** KJUN's calendar: a day grid with keyboard movement, and month and year views opened from the heading. Internal. */
export const CalendarView = defineComponent({
  name: "KjunCalendarView",
  props: {
    ...calendarOptionProps,
    value: { type: String, default: undefined },
    range: { type: Object as PropType<DateRange>, default: undefined },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
    clearable: { type: Boolean, default: false },
    onSelect: { type: Function as PropType<(iso: string) => void>, required: true },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    /** Range mode: the footer applies the picked range instead of jumping to today. */
    onApply: { type: Function as PropType<() => void>, default: undefined },
    /** Range mode: ready-made ranges shown as chips above the days. */
    presets: { type: Array as PropType<readonly DateRangePreset[]>, default: undefined },
    onPreset: { type: Function as PropType<(range: DateRange) => void>, default: undefined },
    /** Range mode: the shortest and longest range while the end is picked. */
    limits: { type: Object as PropType<RangeLimits>, default: undefined },
  },
  setup(props) {
    const scope = useKjunMessageScope();
    const focus = ref(initialFocus(props.range ? props.range.start : props.value, props.min, props.max));
    const mode = ref<CalendarMode>("days");
    const preview = ref<string>();
    // The live region stays empty on open and speaks only when the heading or the range step changes.
    const spoken = ref("");
    const grid = ref<HTMLElement | null>(null), uid = "kjun-calendar-" + useId().replace(/[^\w-]/g, "");
    // Keyboard focus follows the day only when it opened, moved by keys or came back from the month view;
    // the previous and next buttons keep their own focus.
    const place = () => nextTick(() => { if (mode.value === "days") grid.value?.querySelector<HTMLButtonElement>(`[data-iso="${focus.value}"]`)?.focus({ preventScroll: true }); });
    onMounted(place);
    watch(mode, place);
    // Picking a year swaps the year cells for months; focus moves to the shown month instead of falling to the page.
    const months = ref<HTMLElement | null>(null);
    const placeMonth = () => nextTick(() => months.value?.querySelector<HTMLButtonElement>(`[data-month="${parseDate(focus.value)!.month}"]:not(:disabled)`)?.focus({ preventScroll: true }));
    const limitNote = () => {
      const limits = props.limits;
      return props.range?.start && !props.range.end && (limits?.minDays || limits?.maxDays) ? scope.value.messages.rangeLength(limits.minDays, limits.maxDays) : "";
    };
    const go = (iso: string, moveFocus = false) => { focus.value = clampDate(iso, props.min, props.max); if (moveFocus) place(); };
    const head = ref<HTMLElement | null>(null);
    // A button that turns off at the bounds hands keyboard focus to the other one (or the heading) instead of the page.
    const step = (delta: -1 | 1) => {
      const next = stepTarget(focus.value, mode.value, delta);
      go(next);
      if (stepDisabled(next, mode.value, delta, props.min, props.max)) nextTick(() =>
        (head.value?.querySelector<HTMLButtonElement>(".kjun-calendar-nav:not(:disabled)") ?? head.value?.querySelector<HTMLButtonElement>(".kjun-calendar-title"))?.focus());
    };
    const announcement = () => {
      const m = scope.value.messages, shown = parseDate(focus.value)!;
      if (props.range?.start && !props.range.end) return m.chooseEndDate + (limitNote() ? ", " + limitNote() : "");
      if (mode.value === "days") return calendarLabels(shown.year, shown.month, scope.value).title;
      const years = yearGrid(shown.year);
      return mode.value === "months" ? monthNames(shown.year, scope.value).title : `${years[0]} – ${years[11]}`;
    };
    watch(announcement, next => { spoken.value = next; });
    return () => {
      const m = scope.value.messages, shown = parseDate(focus.value)!, today = todayIso();
      const icon = tokens.extensions.calendar.navSize / 2, weekStart = props.weekStart;
      const selectedMonth = parseDate(props.range ? props.range.start : props.value);
      const labels = calendarLabels(shown.year, shown.month, scope.value), names = monthNames(shown.year, scope.value);
      const years = yearGrid(shown.year), note = limitNote();
      const title = mode.value === "days" ? labels.title : mode.value === "months" ? names.title : `${years[0]} – ${years[11]}`;
      const picking = !!props.range?.start && !props.range.end;
      const footer = calendarFooter({ range: !!props.range, apply: !!props.onApply, clearable: props.clearable,
        todayBlocked: isBlocked(today, props.min, props.max) || !!props.isDateUnavailable?.(today), note: !!note });
      const tone = (weekday: number) => {
        const t = dayTone(weekday, { markSunday: props.markSunday, markSaturday: props.markSaturday, holiday: false });
        return t === "text" ? undefined : t;
      };
      return (
        <div class="kjun-calendar">
          <div ref={head} class="kjun-calendar-head">
            <button type="button" class="kjun-calendar-title" aria-label={mode.value === "days" ? m.chooseMonth : m.chooseYear} aria-describedby={uid + "-title"}
              aria-expanded={mode.value !== "days"} onClick={() => { mode.value = mode.value === "days" ? "months" : mode.value === "months" ? "years" : "months"; }}>
              <span id={uid + "-title"}>{title}</span>
              <KjunIcon name="chevron-down" size={tokens.input.md.iconSize} style={{ transform: mode.value !== "days" ? "rotate(180deg)" : undefined }} />
            </button>
            {([-1, 1] as const).map(delta => (
              <button key={delta} type="button" class="kjun-calendar-nav" disabled={stepDisabled(focus.value, mode.value, delta, props.min, props.max)}
                aria-label={mode.value === "days" ? (delta < 0 ? m.previousMonth : m.nextMonth) : (delta < 0 ? m.previousYear : m.nextYear)}
                onClick={() => step(delta)}>
                <KjunIcon name={delta < 0 ? "chevron-left" : "chevron-right"} size={icon} />
              </button>
            ))}
          </div>
          {/* The heading and the range step are announced as they change, not only when a day takes focus. */}
          <div class="kjun-sr-only" aria-live="polite">{spoken.value}</div>
          {mode.value === "days" && !!props.presets?.length && (
            <div class="kjun-calendar-presets" role="group" aria-label={m.rangePresets}>
              {props.presets.map(preset => (
                <button key={preset.label} type="button" class="kjun-calendar-year kjun-calendar-preset" onClick={() => props.onPreset?.(preset.value)}
                  aria-pressed={props.range?.start === preset.value.start && props.range?.end === preset.value.end}>{preset.label}</button>
              ))}
            </div>
          )}
          {mode.value === "days" ? (
            <div ref={grid} class="kjun-calendar-grid" role="group" aria-label={labels.title} onMouseleave={() => { preview.value = undefined; }}
              onKeydown={(event: KeyboardEvent) => {
                const next = moveDate(focus.value, event.key, event.shiftKey, weekStart);
                if (!next) return;
                event.preventDefault();
                go(next, true);
                if (picking) preview.value = clampDate(next, props.min, props.max);
              }}>
              {orderWeekdays(labels.weekdays, weekStart).map((day, index) => (
                <span key={day} class="kjun-calendar-weekday" data-tone={tone((index + weekStart) % 7)} aria-hidden="true">{day}</span>
              ))}
              {calendarDays(shown.year, shown.month, { value: props.value, range: props.range, min: props.min, max: props.max, today, weekStart,
                unavailable: props.isDateUnavailable, preview: picking ? preview.value : undefined, limits: props.limits }).map(day => {
                const role = props.range ? rangeRole(day) : null;
                return (
                  <button key={day.iso} type="button" class="kjun-calendar-day" data-density="compact" data-iso={day.iso}
                    // Blocked days stay focusable so arrow keys can pass over them, as in the ARIA date picker pattern.
                    tabindex={day.iso === focus.value ? 0 : -1} aria-disabled={day.blocked || undefined}
                    aria-label={dateLabel(day.iso, scope.value)} aria-pressed={day.selected} aria-current={day.today ? "date" : undefined}
                    aria-describedby={role ? `${uid}-${role}` : undefined}
                    data-tone={tone(day.weekday)} data-outside={day.outside || undefined} data-today={day.today || undefined}
                    data-selected={day.selected || undefined} data-in-range={day.inRange || undefined}
                    data-range-start={day.rangeStart || undefined} data-range-end={day.rangeEnd || undefined} data-limited={day.limited || undefined}
                    onMouseenter={() => { if (picking && !day.blocked) preview.value = day.iso; }}
                    onClick={() => { if (day.blocked) return; focus.value = day.iso; preview.value = undefined; props.onSelect(day.iso); }}>
                    <span class="kjun-calendar-day-number">{day.day}</span>
                  </button>
                );
              })}
              {props.range && <>
                <span id={uid + "-start"} hidden>{m.rangeStartDay}</span>
                <span id={uid + "-end"} hidden>{m.rangeEndDay}</span>
                <span id={uid + "-between"} hidden>{m.inRangeDay}</span>
              </>}
            </div>
          ) : mode.value === "months" ? (
            <>
              <div ref={months} class="kjun-calendar-months">
                {names.months.map((name, month) => {
                  const selected = selectedMonth?.year === shown.year && selectedMonth.month === month;
                  const current = today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7));
                  return <button key={name} type="button" class="kjun-calendar-month" data-month={month} disabled={monthOutside(shown.year, month, props.min, props.max)}
                    aria-pressed={selected} aria-current={current ? "date" : undefined} data-selected={selected || undefined} data-current={current || undefined}
                    onClick={() => { go(pickMonth(focus.value, month)); mode.value = "days"; }}>
                    {name}
                  </button>;
                })}
              </div>
            </>
          ) : (
            <div class="kjun-calendar-months">
              {years.map(year => {
                const selected = year === shown.year, current = today.startsWith(String(year).padStart(4, "0"));
                return <button key={year} type="button" class="kjun-calendar-month" data-year={year} disabled={yearOutside(year, props.min, props.max)}
                  aria-pressed={selected} aria-current={current ? "date" : undefined} data-selected={selected || undefined} data-current={current || undefined}
                  onClick={() => { go(pickYear(focus.value, year)); mode.value = "months"; placeMonth(); }}>
                  {year}
                </button>;
              })}
            </div>
          )}
          {mode.value === "days" && footer.shown && (
            <div class="kjun-calendar-foot">
              {footer.note ? <span class="kjun-calendar-note">{note}</span>
                : footer.clear ? <KjunButton size="sm" variant="ghost" onClick={() => props.onClear?.()}>{props.range ? m.clearDates : m.clearDate}</KjunButton> : <span />}
              {footer.action === "apply"
                ? <KjunButton size="sm" variant="secondary" disabled={!props.range || !canApplyRange(props.range)} onClick={() => props.onApply?.()}>{m.apply}</KjunButton>
                : footer.action === "today" ? <KjunButton size="sm" variant="secondary" onClick={() => { go(today, true); props.onSelect(today); }}>{m.today}</KjunButton> : null}
            </div>
          )}
        </div>
      );
    };
  },
});
