import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  addMonths, calendarDays, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside, moveDate,
  parseDate, todayIso, toIsoDate, yearChoices, type DateRange,
} from "../../../shared/package-runtime/calendar";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState } from "react";
import { KjunButton, KjunIcon } from "./button";

export interface CalendarViewProps {
  value?: string;
  range?: DateRange;
  min?: string;
  max?: string;
  clearable?: boolean;
  onSelect: (iso: string) => void;
  onClear?: () => void;
  /** Range mode: the footer applies the picked range instead of jumping to today. */
  onApply?: () => void;
}
/** KJUN's calendar: a day grid with keyboard movement, and a month view opened from the heading. */
export function CalendarView({ value, range, min, max, clearable = false, onSelect, onClear, onApply }: CalendarViewProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  const [focus, setFocus] = useState(() => initialFocus(range ? range.start : value, min, max));
  const [view, setView] = useState<"days" | "months">("days");
  const grid = useRef<HTMLDivElement>(null);
  const shown = parseDate(focus)!, today = todayIso();
  const icon = tokens.extensions.calendar.navSize / 2;
  // The day that holds keyboard focus follows every move, including the first open.
  useEffect(() => { if (view === "days") grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus({ preventScroll: true }); }, [focus, view]);
  const go = (iso: string) => setFocus(clampDate(iso, min, max));
  const step = (delta: number) => go(view === "days" ? addMonths(focus, delta) : addMonths(focus, delta * 12));
  const stepDisabled = (delta: number) => view === "days"
    ? monthOutside(shown.year, shown.month + delta, min, max)
    : monthOutside(shown.year + delta, delta < 0 ? 11 : 0, min, max);
  const selectedMonth = parseDate(range ? range.start : value);
  return (
    <div className="kjun-calendar">
      <div className="kjun-calendar-head">
        <button type="button" className="kjun-calendar-title" aria-label={m.chooseMonth} aria-expanded={view === "months"} onClick={() => setView(view === "days" ? "months" : "days")}>
          <span aria-hidden="true">{view === "days" ? calendarLabels(shown.year, shown.month, scope).title : monthNames(shown.year, scope).title}</span>
          <KjunIcon name="chevron-down" size={tokens.input.md.iconSize} style={{ transform: view === "months" ? "rotate(180deg)" : undefined }} />
        </button>
        <button type="button" className="kjun-calendar-nav" aria-label={view === "days" ? m.previousMonth : m.previousYear} disabled={stepDisabled(-1)} onClick={() => step(-1)}>
          <KjunIcon name="chevron-left" size={icon} />
        </button>
        <button type="button" className="kjun-calendar-nav" aria-label={view === "days" ? m.nextMonth : m.nextYear} disabled={stepDisabled(1)} onClick={() => step(1)}>
          <KjunIcon name="chevron-right" size={icon} />
        </button>
      </div>
      {view === "days" ? (
        <div ref={grid} className="kjun-calendar-grid" role="group" aria-label={calendarLabels(shown.year, shown.month, scope).title}
          onKeyDown={event => {
            const next = moveDate(focus, event.key, event.shiftKey);
            if (!next) return;
            event.preventDefault();
            go(next);
          }}>
          {calendarLabels(shown.year, shown.month, scope).weekdays.map((day, index) => (
            <span key={day} className="kjun-calendar-weekday" data-sunday={index === 0 || undefined} aria-hidden="true">{day}</span>
          ))}
          {calendarDays(shown.year, shown.month, { value, range, min, max, today }).map(day => {
            const complete = !!range?.start && !!range?.end;
            return (
              <button key={day.iso} type="button" className="kjun-calendar-day" data-iso={day.iso}
                tabIndex={day.iso === focus ? 0 : -1} disabled={day.blocked}
                aria-label={dateLabel(day.iso, scope)} aria-pressed={day.selected} aria-current={day.today ? "date" : undefined}
                data-sunday={day.weekday === 0 || undefined} data-outside={day.outside || undefined} data-today={day.today || undefined}
                data-selected={day.selected || undefined} data-in-range={day.inRange || undefined}
                data-range-start={(complete && day.rangeStart) || undefined} data-range-end={(complete && day.rangeEnd) || undefined}
                onClick={() => { setFocus(day.iso); onSelect(day.iso); }}>
                {day.day}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="kjun-calendar-months">
            {monthNames(shown.year, scope).months.map((name, month) => (
              <button key={name} type="button" className="kjun-calendar-month" disabled={monthOutside(shown.year, month, min, max)}
                data-selected={(selectedMonth?.year === shown.year && selectedMonth.month === month) || undefined}
                data-current={today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7)) || undefined}
                onClick={() => { go(toIsoDate(shown.year, month, Math.min(shown.day, new Date(shown.year, month + 1, 0).getDate()))); setView("days"); }}>
                {name}
              </button>
            ))}
          </div>
          {/* Year chips only when the bounds leave more than one year to choose. */}
          {yearChoices(shown.year, min, max).length > 1 && <div className="kjun-calendar-years" role="group" aria-label={monthNames(shown.year, scope).title}>
            {yearChoices(shown.year, min, max).map(year => (
              <button key={year} type="button" className="kjun-calendar-year" aria-pressed={year === shown.year} onClick={() => go(addMonths(focus, (year - shown.year) * 12))}>{year}</button>
            ))}
          </div>}
        </>
      )}
      {view === "days" && (onApply || clearable || !isBlocked(today, min, max)) && (
        <div className="kjun-calendar-foot">
          {onApply || clearable ? <KjunButton size="sm" variant="ghost" onClick={onClear}>{m.clearDate}</KjunButton> : <span />}
          {onApply
            ? <KjunButton size="sm" variant="secondary" disabled={!range?.start || !range?.end} onClick={onApply}>{m.apply}</KjunButton>
            : <KjunButton size="sm" variant="secondary" disabled={isBlocked(today, min, max)} onClick={() => { setFocus(today); onSelect(today); }}>{m.today}</KjunButton>}
        </div>
      )}
    </div>
  );
}
