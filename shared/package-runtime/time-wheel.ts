import type { createTimeDomain, TimePrecision } from "@kjun-ui/tokens";
import type { KjunMessages } from "./messages/ko";
import type { HourCycle } from "./time-segments";

// The wheel a TimePicker opens (popover, sheet) or shows in place (inline), shared by every platform. A wheel shows every
// hour and every step of the minute (and second); times outside min and max stay in the wheel faded, and a column that
// stops on one turns back to the closest allowed time.
type TimeDomain = ReturnType<typeof createTimeDomain>;
export type TimeLayout = "auto" | "popover" | "sheet" | "inline";
export type TimeTrigger = "segments" | "button";
export type WheelColumnKey = "period" | "hour" | "minute" | "second";
export interface WheelItem { value: number; label: string; disabled: boolean }
export interface WheelColumn {
  key: WheelColumnKey;
  label: string;
  items: WheelItem[];
  /** The index of the draft's item. */
  index: number;
  /** Hours, minutes and seconds go round; AM/PM stops at its ends. */
  loop: boolean;
}
export interface TimeWheelOptions {
  precision: TimePrecision;
  hourCycle?: HourCycle;
  minuteStep?: number;
  secondStep?: number;
  messages: KjunMessages;
  periodFirst?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const steps = (step: number) => Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
const split = (domain: TimeDomain, draft: string) => {
  const time = domain.parse(draft) ?? 0;
  return [Math.floor(time / 3600), Math.floor(time / 60) % 60, time % 60] as const;
};

/** The wheel's columns for a draft time, in the order the segments read. */
export function timeWheel(domain: TimeDomain, draft: string, { precision, hourCycle = 24, minuteStep = 1, secondStep = 1, messages, periodFirst = true }: TimeWheelOptions): WheelColumn[] {
  const [hour, minute, second] = split(domain, draft);
  const hours = new Set(domain.options(null, 0)), minutes = new Set(domain.options(draft, 1)), seconds = new Set(domain.options(draft, 2));
  const column = (key: WheelColumnKey, label: string, items: WheelItem[], selected: number, loop = true): WheelColumn =>
    ({ key, label, items, loop, index: Math.max(0, items.findIndex(item => item.value === selected)) });
  const rest = [
    column("minute", messages.minute, steps(minuteStep).map(n => ({ value: n, label: pad(n), disabled: !minutes.has(n) })), minute),
    ...(precision === "second" ? [column("second", messages.second, steps(secondStep).map(n => ({ value: n, label: pad(n), disabled: !seconds.has(n) })), second)] : []),
  ];
  if (hourCycle === 24) return [column("hour", messages.hour, Array.from({ length: 24 }, (_, h) => ({ value: h, label: pad(h), disabled: !hours.has(h) })), hour), ...rest];
  const period = hour >= 12 ? 1 : 0;
  const periodColumn = column("period", messages.period, [0, 1].map(p => ({ value: p, label: p ? messages.pm : messages.am,
    disabled: !Array.from(hours).some(h => (h >= 12 ? 1 : 0) === p) })), period, false);
  const hourColumn = column("hour", messages.hour, [12, ...Array.from({ length: 11 }, (_, i) => i + 1)].map(h => ({ value: h, label: pad(h),
    disabled: !hours.has((h % 12) + period * 12) })), hour % 12 || 12);
  return periodFirst ? [periodColumn, hourColumn, ...rest] : [hourColumn, ...rest, periodColumn];
}

/** The draft after a column stops on a value: that time when it is allowed, otherwise the closest allowed one. */
export function wheelPick(domain: TimeDomain, draft: string, key: WheelColumnKey, value: number, { precision, hourCycle = 24 }: Pick<TimeWheelOptions, "precision" | "hourCycle">): string {
  let [hour, minute, second] = split(domain, draft);
  if (key === "period") hour = (hour % 12) + value * 12;
  else if (key === "hour") hour = hourCycle === 12 ? (value % 12) + (hour >= 12 ? 12 : 0) : value;
  else if (key === "minute") minute = value;
  else second = value;
  const time = hour * 3600 + minute * 60 + (precision === "second" ? second : 0);
  const text = [hour, minute, second].slice(0, precision === "second" ? 3 : 2).map(pad).join(":");
  return domain.accepts(text) ? text : domain.nearest(time) ?? draft;
}

/** Where the wheel starts: the value, the allowed time closest to it, or the allowed time closest to now (which rounds now to the step). */
export function wheelStart(domain: TimeDomain, value: string | null, now: Date = new Date()): string {
  const time = value === null ? null : domain.parse(value);
  if (time !== null && value !== null && domain.accepts(value)) return value;
  return domain.nearest(time ?? now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) ?? value ?? "00:00";
}

/** A time as it reads on the button trigger: "09:30" on a 24-hour clock, "오전 9:30" or "9:30 AM" on a 12-hour one. */
export function timeText(domain: TimeDomain, value: string | null, { precision, hourCycle = 24, messages, periodFirst = true }: Pick<TimeWheelOptions, "precision" | "hourCycle" | "messages" | "periodFirst">): string {
  if (value === null || domain.parse(value) === null) return "";
  const [hour, minute, second] = split(domain, value);
  const tail = ":" + pad(minute) + (precision === "second" ? ":" + pad(second) : "");
  if (hourCycle === 24) return pad(hour) + tail;
  const period = hour >= 12 ? messages.pm : messages.am, clock = (hour % 12 || 12) + tail;
  return periodFirst ? period + " " + clock : clock + " " + period;
}

/** The value a key moves a column to, skipping faded items; null when the key does nothing or the column cannot move. */
export function wheelKey(column: WheelColumn, key: string): number | null {
  const { items, index, loop } = column, open = items.map((item, i) => item.disabled ? -1 : i).filter(i => i >= 0);
  if (!open.length) return null;
  if (key === "Home" || key === "End") {
    const target = items[key === "Home" ? open[0] : open[open.length - 1]];
    return target.value === items[index].value ? null : target.value;
  }
  const delta = ({ ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 } as Record<string, number>)[key];
  if (!delta) return null;
  let i = index;
  for (let moved = 0, guard = 0; moved < Math.abs(delta) && guard < items.length * 5; guard++) {
    const next = i + Math.sign(delta);
    if (!loop && (next < 0 || next >= items.length)) break;
    i = (next + items.length) % items.length;
    if (!items[i].disabled) moved++;
  }
  if (items[i].disabled) return null;
  return i === index ? null : items[i].value;
}

/** auto takes the sheet on touch screens and devices, the popover elsewhere. */
export const resolveTimeLayout = (layout: TimeLayout, coarse: boolean): Exclude<TimeLayout, "auto"> => layout === "auto" ? coarse ? "sheet" : "popover" : layout;
/** Segments keep typing on a keyboard; a sheet opens from a one-line button. */
export const resolveTimeTrigger = (trigger: TimeTrigger | undefined, layout: Exclude<TimeLayout, "auto">): TimeTrigger => trigger ?? (layout === "sheet" ? "button" : "segments");

/** A looping column draws its items three times and stays in the middle copy, so it turns either way without an end. */
export const wheelCopies = (column: Pick<WheelColumn, "loop">) => column.loop ? 3 : 1;
/** The row to show an item on: the copy nearest to the row now in the middle, so a move takes the short way round. */
export function wheelRow(column: WheelColumn, index: number, current: number | null): number {
  const length = column.items.length;
  if (!column.loop) return index;
  if (current === null) return length + index;
  const base = current - (((current % length) + length) % length);
  return [base - length + index, base + index, base + length + index].reduce((a, b) => Math.abs(b - current) < Math.abs(a - current) ? b : a);
}
/** The same item's row in the middle copy, where a looping column settles after a turn. */
export const wheelHome = (column: WheelColumn, row: number) => column.loop ? column.items.length + (((row % column.items.length) + column.items.length) % column.items.length) : row;
/** The item a settled row shows. */
export const wheelItemAt = (column: WheelColumn, row: number) => {
  const length = column.items.length, at = Math.round(row);
  return column.items[column.loop ? ((at % length) + length) % length : Math.min(length - 1, Math.max(0, at))];
};
