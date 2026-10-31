import { useKjunMessageScope } from "./runtime/messages";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  addMonths, calendarDays, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside, moveDate,
  parseDate, todayIso, toIsoDate, yearChoices, type DateRange,
} from "../../../shared/package-runtime/calendar";
import { defineComponent, nextTick, onMounted, ref, watch, type PropType } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";

/** KJUN's calendar: a day grid with keyboard movement, and a month view opened from the heading. Internal. */
export const CalendarView = defineComponent({
  name: "KjunCalendarView",
  props: {
    value: { type: String, default: undefined },
    range: { type: Object as PropType<DateRange>, default: undefined },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
    clearable: { type: Boolean, default: false },
    onSelect: { type: Function as PropType<(iso: string) => void>, required: true },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    /** Range mode: the footer applies the picked range instead of jumping to today. */
    onApply: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const scope = useKjunMessageScope();
    const focus = ref(initialFocus(props.range ? props.range.start : props.value, props.min, props.max));
    const view = ref<"days" | "months">("days");
    const grid = ref<HTMLElement | null>(null);
    // The day that holds keyboard focus follows every move, including the first open.
    const place = () => nextTick(() => { if (view.value === "days") grid.value?.querySelector<HTMLButtonElement>(`[data-iso="${focus.value}"]`)?.focus({ preventScroll: true }); });
    onMounted(place);
    watch([focus, view], place);
    const go = (iso: string) => { focus.value = clampDate(iso, props.min, props.max); };
    return () => {
      const m = scope.value.messages, shown = parseDate(focus.value)!, today = todayIso();
      const icon = tokens.extensions.calendar.navSize / 2;
      const days = view.value === "days";
      const stepDisabled = (delta: number) => days ? monthOutside(shown.year, shown.month + delta, props.min, props.max)
        : monthOutside(shown.year + delta, delta < 0 ? 11 : 0, props.min, props.max);
      const step = (delta: number) => go(addMonths(focus.value, days ? delta : delta * 12));
      const selectedMonth = parseDate(props.range ? props.range.start : props.value);
      const labels = calendarLabels(shown.year, shown.month, scope.value), names = monthNames(shown.year, scope.value);
      const complete = !!props.range?.start && !!props.range?.end;
      return (
        <div class="kjun-calendar">
          <div class="kjun-calendar-head">
            <button type="button" class="kjun-calendar-title" aria-label={m.chooseMonth} aria-expanded={!days} onClick={() => { view.value = days ? "months" : "days"; }}>
              <span aria-hidden="true">{days ? labels.title : names.title}</span>
              <KjunIcon name="chevron-down" size={tokens.input.md.iconSize} style={{ transform: days ? undefined : "rotate(180deg)" }} />
            </button>
            <button type="button" class="kjun-calendar-nav" aria-label={days ? m.previousMonth : m.previousYear} disabled={stepDisabled(-1)} onClick={() => step(-1)}>
              <KjunIcon name="chevron-left" size={icon} />
            </button>
            <button type="button" class="kjun-calendar-nav" aria-label={days ? m.nextMonth : m.nextYear} disabled={stepDisabled(1)} onClick={() => step(1)}>
              <KjunIcon name="chevron-right" size={icon} />
            </button>
          </div>
          {days ? (
            <div ref={grid} class="kjun-calendar-grid" role="group" aria-label={labels.title}
              onKeydown={(event: KeyboardEvent) => { const next = moveDate(focus.value, event.key, event.shiftKey); if (!next) return; event.preventDefault(); go(next); }}>
              {labels.weekdays.map((day, index) => <span key={day} class="kjun-calendar-weekday" data-sunday={index === 0 || undefined} aria-hidden="true">{day}</span>)}
              {calendarDays(shown.year, shown.month, { value: props.value, range: props.range, min: props.min, max: props.max, today }).map(day => (
                <button key={day.iso} type="button" class="kjun-calendar-day" data-iso={day.iso} tabindex={day.iso === focus.value ? 0 : -1} disabled={day.blocked}
                  aria-label={dateLabel(day.iso, scope.value)} aria-pressed={day.selected} aria-current={day.today ? "date" : undefined}
                  data-sunday={day.weekday === 0 || undefined} data-outside={day.outside || undefined} data-today={day.today || undefined}
                  data-selected={day.selected || undefined} data-in-range={day.inRange || undefined}
                  data-range-start={(complete && day.rangeStart) || undefined} data-range-end={(complete && day.rangeEnd) || undefined}
                  onClick={() => { focus.value = day.iso; props.onSelect(day.iso); }}>
                  {day.day}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div class="kjun-calendar-months">
                {names.months.map((name, month) => (
                  <button key={name} type="button" class="kjun-calendar-month" disabled={monthOutside(shown.year, month, props.min, props.max)}
                    data-selected={(selectedMonth?.year === shown.year && selectedMonth.month === month) || undefined}
                    data-current={today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7)) || undefined}
                    onClick={() => { go(toIsoDate(shown.year, month, Math.min(shown.day, new Date(shown.year, month + 1, 0).getDate()))); view.value = "days"; }}>
                    {name}
                  </button>
                ))}
              </div>
              {/* Year chips only when the bounds leave more than one year to choose. */}
              {yearChoices(shown.year, props.min, props.max).length > 1 && <div class="kjun-calendar-years" role="group" aria-label={names.title}>
                {yearChoices(shown.year, props.min, props.max).map(year => (
                  <button key={year} type="button" class="kjun-calendar-year" aria-pressed={year === shown.year} onClick={() => go(addMonths(focus.value, (year - shown.year) * 12))}>{year}</button>
                ))}
              </div>}
            </>
          )}
          {days && (props.onApply || props.clearable || !isBlocked(today, props.min, props.max)) && (
            <div class="kjun-calendar-foot">
              {props.onApply || props.clearable ? <KjunButton size="sm" variant="ghost" onClick={() => props.onClear?.()}>{m.clearDate}</KjunButton> : <span />}
              {props.onApply
                ? <KjunButton size="sm" variant="secondary" disabled={!props.range?.start || !props.range?.end} onClick={() => props.onApply?.()}>{m.apply}</KjunButton>
                : <KjunButton size="sm" variant="secondary" disabled={isBlocked(today, props.min, props.max)} onClick={() => { focus.value = today; props.onSelect(today); }}>{m.today}</KjunButton>}
            </div>
          )}
        </div>
      );
    };
  },
});
