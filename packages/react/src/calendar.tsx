import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  calendarDays, calendarFooter, canApplyRange, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside, moveDate,
  orderWeekdays, parseDate, pickMonth, pickYear, rangeRole, stepDisabled, stepTarget, todayIso, toIsoDate, yearChoices, yearGrid,
  yearOutside, type CalendarMode, type DateRange, type DateUnavailable, type WeekStart,
} from "../../../shared/package-runtime/calendar";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, useState } from "react";
import { KjunButton, KjunIcon } from "./button";

export interface CalendarOptions {
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart?: WeekStart;
  /** Paints Sundays with the danger role, as Korean calendars do (default true). */
  markSunday?: boolean;
  /** Days that cannot be picked inside the bounds, such as holidays; a range cannot run across one. */
  isDateUnavailable?: DateUnavailable;
}
export interface CalendarViewProps extends CalendarOptions {
  value?: string;
  range?: DateRange;
  min?: string;
  max?: string;
  clearable?: boolean;
  onSelect: (iso: string) => void;
  onClear?: () => void;
  /** Range mode: the footer applies the picked range instead of jumping to today. */
  onApply?: () => void;
  /** Range mode: ready-made ranges shown as chips above the days. */
  presets?: readonly DateRangePreset[];
  onPreset?: (range: DateRange) => void;
}
/** A named range offered as a chip, such as "최근 7일". */
export interface DateRangePreset { label: string; value: DateRange }
/** KJUN's calendar: a day grid with keyboard movement, and month and year views opened from the heading. */
export function CalendarView({ value, range, min, max, clearable = false, weekStart = 0, markSunday = true, isDateUnavailable,
  onSelect, onClear, onApply, presets, onPreset }: CalendarViewProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  const [focus, setFocus] = useState(() => initialFocus(range ? range.start : value, min, max));
  const [mode, setMode] = useState<CalendarMode>("days");
  const [preview, setPreview] = useState<string>();
  // Keyboard focus follows the day only when it opened, moved by keys or came back from the month view;
  // the previous and next buttons keep their own focus.
  const [focusRequest, setFocusRequest] = useState(1);
  const grid = useRef<HTMLDivElement>(null), uid = "kjun-calendar-" + useId().replace(/:/g, "");
  const shown = parseDate(focus)!, today = todayIso();
  const icon = tokens.extensions.calendar.navSize / 2;
  useEffect(() => {
    if (mode === "days") grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus({ preventScroll: true });
  }, [focusRequest, mode]);
  const go = (iso: string, moveFocus = false) => { setFocus(clampDate(iso, min, max)); if (moveFocus) setFocusRequest(n => n + 1); };
  const head = useRef<HTMLDivElement>(null);
  // A button that turns off at the bounds hands keyboard focus to the other one (or the heading) instead of the page.
  const step = (delta: -1 | 1) => {
    const next = stepTarget(focus, mode, delta);
    go(next);
    if (stepDisabled(next, mode, delta, min, max)) requestAnimationFrame(() =>
      (head.current?.querySelector<HTMLButtonElement>(".kjun-calendar-nav:not(:disabled)") ?? head.current?.querySelector<HTMLButtonElement>(".kjun-calendar-title"))?.focus());
  };
  const selectedMonth = parseDate(range ? range.start : value);
  const labels = calendarLabels(shown.year, shown.month, scope), names = monthNames(shown.year, scope);
  const years = yearGrid(shown.year);
  const title = mode === "days" ? labels.title : mode === "months" ? names.title : `${years[0]} – ${years[11]}`;
  const picking = !!range?.start && !range.end;
  const footer = calendarFooter({ range: !!range, apply: !!onApply, clearable, todayBlocked: isBlocked(today, min, max) || !!isDateUnavailable?.(today) });
  const sunday = (weekday: number) => (markSunday && weekday === 0) || undefined;
  // The live region stays empty on open and speaks only when the heading or the range step changes.
  const announcement = picking ? m.chooseEndDate : title, first = useRef(announcement);
  const [spoken, setSpoken] = useState("");
  useEffect(() => { if (announcement !== first.current) { first.current = ""; setSpoken(announcement); } }, [announcement]);
  return (
    <div className="kjun-calendar">
      <div ref={head} className="kjun-calendar-head">
        <button type="button" className="kjun-calendar-title" aria-label={mode === "days" ? m.chooseMonth : m.chooseYear} aria-describedby={uid + "-title"}
          aria-expanded={mode !== "days"} onClick={() => setMode(mode === "days" ? "months" : mode === "months" ? "years" : "months")}>
          <span id={uid + "-title"}>{title}</span>
          <KjunIcon name="chevron-down" size={tokens.input.md.iconSize} style={{ transform: mode !== "days" ? "rotate(180deg)" : undefined }} />
        </button>
        {([-1, 1] as const).map(delta => (
          <button key={delta} type="button" className="kjun-calendar-nav" disabled={stepDisabled(focus, mode, delta, min, max)} onClick={() => step(delta)}
            aria-label={mode === "days" ? (delta < 0 ? m.previousMonth : m.nextMonth) : (delta < 0 ? m.previousYear : m.nextYear)}>
            <KjunIcon name={delta < 0 ? "chevron-left" : "chevron-right"} size={icon} />
          </button>
        ))}
      </div>
      {/* The heading and the range step are announced as they change, not only when a day takes focus. */}
      <div className="kjun-sr-only" aria-live="polite">{spoken}</div>
      {mode === "days" && !!presets?.length && (
        <div className="kjun-calendar-presets" role="group">
          {presets.map(preset => (
            <button key={preset.label} type="button" className="kjun-calendar-year" onClick={() => onPreset?.(preset.value)}
              aria-pressed={range?.start === preset.value.start && range?.end === preset.value.end}>{preset.label}</button>
          ))}
        </div>
      )}
      {mode === "days" ? (
        <div ref={grid} className="kjun-calendar-grid" role="group" aria-label={labels.title}
          onMouseLeave={() => setPreview(undefined)}
          onKeyDown={event => {
            const next = moveDate(focus, event.key, event.shiftKey, weekStart);
            if (!next) return;
            event.preventDefault();
            go(next, true);
            if (picking) setPreview(clampDate(next, min, max));
          }}>
          {orderWeekdays(labels.weekdays, weekStart).map((day, index) => (
            <span key={day} className="kjun-calendar-weekday" data-sunday={sunday((index + weekStart) % 7)} aria-hidden="true">{day}</span>
          ))}
          {calendarDays(shown.year, shown.month, { value, range, min, max, today, weekStart, unavailable: isDateUnavailable, preview: picking ? preview : undefined }).map(day => {
            const role = range ? rangeRole(day) : null;
            return (
              <button key={day.iso} type="button" className="kjun-calendar-day" data-iso={day.iso}
                // Blocked days stay focusable so arrow keys can pass over them, as in the ARIA date picker pattern.
                tabIndex={day.iso === focus ? 0 : -1} aria-disabled={day.blocked || undefined}
                aria-label={dateLabel(day.iso, scope)} aria-pressed={day.selected} aria-current={day.today ? "date" : undefined}
                aria-describedby={role ? `${uid}-${role}` : undefined}
                data-sunday={sunday(day.weekday)} data-outside={day.outside || undefined} data-today={day.today || undefined}
                data-selected={day.selected || undefined} data-in-range={day.inRange || undefined}
                data-range-start={day.rangeStart || undefined} data-range-end={day.rangeEnd || undefined}
                onMouseEnter={() => { if (picking && !day.blocked) setPreview(day.iso); }}
                onClick={() => { if (day.blocked) return; setFocus(day.iso); setPreview(undefined); onSelect(day.iso); }}>
                {day.day}
              </button>
            );
          })}
          {range && <>
            <span id={uid + "-start"} hidden>{m.rangeStartDay}</span>
            <span id={uid + "-end"} hidden>{m.rangeEndDay}</span>
            <span id={uid + "-between"} hidden>{m.inRangeDay}</span>
          </>}
        </div>
      ) : mode === "months" ? (
        <>
          <div className="kjun-calendar-months">
            {names.months.map((name, month) => {
              const selected = selectedMonth?.year === shown.year && selectedMonth.month === month;
              const current = today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7));
              return <button key={name} type="button" className="kjun-calendar-month" disabled={monthOutside(shown.year, month, min, max)}
                aria-pressed={selected} aria-current={current ? "date" : undefined} data-selected={selected || undefined} data-current={current || undefined}
                onClick={() => { go(pickMonth(focus, month), true); setMode("days"); }}>
                {name}
              </button>;
            })}
          </div>
          {/* Year chips only when the bounds leave more than one year to choose. */}
          {yearChoices(shown.year, min, max).length > 1 && <div className="kjun-calendar-years" role="group" aria-label={names.title}>
            {yearChoices(shown.year, min, max).map(year => (
              <button key={year} type="button" className="kjun-calendar-year" aria-pressed={year === shown.year} onClick={() => go(pickYear(focus, year))}>{year}</button>
            ))}
          </div>}
        </>
      ) : (
        <div className="kjun-calendar-months">
          {years.map(year => {
            const selected = year === shown.year, current = today.startsWith(String(year).padStart(4, "0"));
            return <button key={year} type="button" className="kjun-calendar-month" data-year={year} disabled={yearOutside(year, min, max)}
              aria-pressed={selected} aria-current={current ? "date" : undefined} data-selected={selected || undefined} data-current={current || undefined}
              onClick={() => { go(pickYear(focus, year)); setMode("months"); }}>
              {year}
            </button>;
          })}
        </div>
      )}
      {mode === "days" && footer.shown && (
        <div className="kjun-calendar-foot">
          {footer.clear ? <KjunButton size="sm" variant="ghost" onClick={onClear}>{range ? m.clearDates : m.clearDate}</KjunButton> : <span />}
          {footer.action === "apply"
            ? <KjunButton size="sm" variant="secondary" disabled={!range || !canApplyRange(range)} onClick={onApply}>{m.apply}</KjunButton>
            : footer.action === "today" ? <KjunButton size="sm" variant="secondary" onClick={() => { go(today, true); onSelect(today); }}>{m.today}</KjunButton> : null}
        </div>
      )}
    </div>
  );
}
