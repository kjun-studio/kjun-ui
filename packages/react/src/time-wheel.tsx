import { wheelCopies, wheelHome, wheelItemAt, wheelKey, wheelRow, wheelSeparated, type WheelColumn, type WheelColumnKey } from "../../../shared/package-runtime/time-wheel";
import { tokens } from "@kjun-ui/tokens";
import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "./use-reduced-motion";

const rowHeight = tokens.extensions.timePicker.wheelRowHeight;
// The idle time after the last scroll event that counts as stopped (browsers without scrollend, and the snap's own settle).
const settleDelay = 120;
// The longest a smooth scroll of the column's own may take before a stop counts again.
const travelLimit = 1000;

interface ColumnProps {
  column: WheelColumn;
  disabled: boolean;
  readOnly: boolean;
  autoFocus: boolean;
  onPick: (value: number) => void;
  onEnter?: () => void;
  onFocus?: () => void;
}
/** One scrolling column: a spinbutton whose rows snap to the band in the middle. */
function WheelColumnView({ column, disabled, readOnly, autoFocus, onPick, onEnter, onFocus }: ColumnProps) {
  const scroller = useRef<HTMLDivElement>(null), held = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined), mounted = useRef(false);
  // Where the column itself is scrolling to: its own scroll events are no stop of the user's (cleared by a wheel or a touch).
  const travel = useRef<{ top: number; until: number } | null>(null);
  const go = (element: HTMLElement, top: number, smooth: boolean) => {
    travel.current = { top, until: Date.now() + travelLimit };
    element.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
  };
  const reduced = useReducedMotion();
  const item = column.items[column.index];
  // The settle timer outlives a render, so it reads the latest column and handler.
  const latest = useRef({ column, onPick });
  latest.current = { column, onPick };
  // Brings the draft's item to the band: at once on the first draw, otherwise the short way round.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const current = mounted.current ? element.scrollTop / rowHeight : null;
    const row = wheelRow(column, column.index, current === null ? null : Math.round(current));
    if (current === null || Math.abs(current - row) > 0.01) go(element, row * rowHeight, mounted.current && !reduced);
    mounted.current = true;
    // A new column object with the same item needs no scroll.
  }, [column.index, column.items.length, column.loop, reduced]);
  useEffect(() => { if (autoFocus) scroller.current?.focus({ preventScroll: true }); }, [autoFocus]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const settle = () => {
    const element = scroller.current, { column, onPick } = latest.current;
    if (!element || held.current) return;
    const goal = travel.current;
    if (goal && Math.abs(element.scrollTop - goal.top) > 1 && Date.now() < goal.until) { later(); return; }
    travel.current = null;
    const row = Math.round(element.scrollTop / rowHeight), home = wheelHome(column, row);
    // A looping column comes back to its middle copy unseen, so it never reaches an end.
    if (home !== row) go(element, home * rowHeight, false);
    if (goal) return;
    const stopped = wheelItemAt(column, row);
    if (stopped.value !== column.items[column.index].value) onPick(stopped.value);
    // A stop between rows (a slow drag without snap support) settles on the row.
    else if (Math.abs(element.scrollTop - home * rowHeight) > 1) go(element, home * rowHeight, !reduced);
  };
  const later = () => { clearTimeout(timer.current); timer.current = setTimeout(settle, settleDelay); };
  const locked = disabled || readOnly;
  return (
    <div className="kjun-time-wheel-column" data-key={column.key}>
      <div ref={scroller} className="kjun-time-wheel-scroll" role="spinbutton" tabIndex={disabled ? -1 : 0}
        aria-label={column.label} aria-valuenow={item.value} aria-valuetext={item.label}
        aria-disabled={disabled || undefined} aria-readonly={readOnly || undefined} data-locked={locked || undefined}
        onScroll={later} onFocus={onFocus}
        onWheel={() => { travel.current = null; }}
        onPointerDown={event => { travel.current = null; if (event.pointerType !== "mouse") held.current = true; }}
        onTouchStart={() => { travel.current = null; held.current = true; }}
        onTouchEnd={() => { held.current = false; later(); }}
        onPointerUp={() => { if (held.current) { held.current = false; later(); } }}
        onPointerCancel={() => { held.current = false; later(); }}
        onKeyDown={event => {
          if (event.key === "Enter" && onEnter) { event.preventDefault(); onEnter(); return; }
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            const columns = Array.from(event.currentTarget.closest(".kjun-time-wheel")?.querySelectorAll<HTMLElement>(".kjun-time-wheel-scroll") ?? []);
            const next = columns[columns.indexOf(event.currentTarget) + (event.key === "ArrowRight" ? 1 : -1)];
            if (next) { event.preventDefault(); next.focus({ preventScroll: true }); }
            return;
          }
          if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          if (locked) return;
          const value = wheelKey(column, event.key);
          if (value !== null) onPick(value);
        }}>
        {Array.from({ length: wheelCopies(column) }, (_, copy) => column.items.map((entry, index) => (
          <div key={copy + ":" + entry.value} className="kjun-time-wheel-row" aria-hidden="true"
            data-selected={index === column.index || undefined} data-disabled={entry.disabled || undefined}
            onClick={() => { if (!locked && entry.value !== item.value) onPick(entry.value); }}>{entry.label}</div>
        )))}
      </div>
    </div>
  );
}

export interface TimeWheelProps {
  columns: WheelColumn[];
  label: string;
  labelledBy?: string;
  /** Inline wheels sit on the page: a field fill with a surface band. */
  inline?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** The column to focus when the wheel appears. */
  focusColumn?: number | null;
  /** The column the person is on: focused or turned. */
  onFocusColumn?: (index: number) => void;
  onPick: (key: WheelColumnKey, value: number) => void;
  onEnter?: () => void;
}
/** The hour, minute (and second, AM/PM) columns over one band that marks the chosen time. */
export function TimeWheel({ columns, label, labelledBy, inline = false, disabled = false, readOnly = false, focusColumn = null, onFocusColumn, onPick, onEnter }: TimeWheelProps) {
  return (
    <div className="kjun-time-wheel" role="group" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy}
      data-inline={inline || undefined} data-disabled={disabled || undefined}>
      <div className="kjun-time-wheel-band" aria-hidden="true" />
      {columns.map((column, index) => <Fragment key={column.key}>
        {wheelSeparated(columns, index) && <span className="kjun-time-wheel-separator" aria-hidden="true">:</span>}
        <WheelColumnView column={column} disabled={disabled} readOnly={readOnly} autoFocus={focusColumn === index} onFocus={() => onFocusColumn?.(index)}
          onPick={value => { onFocusColumn?.(index); onPick(column.key, value); }} onEnter={onEnter} /></Fragment>)}
    </div>
  );
}
