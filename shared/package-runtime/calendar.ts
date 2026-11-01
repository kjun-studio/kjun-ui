import type { KjunMessageScope } from "./messages";
import { defaultMessageScope } from "./messages";

// Calendar state shared by DatePicker and DateRangePicker on every platform. Dates are "YYYY-MM-DD"
// strings compared as text; months are 0-based like Date.
export interface DateRange { start: string; end: string }
export interface CalendarDay {
  iso: string; day: number; weekday: number;
  outside: boolean; blocked: boolean; today: boolean;
  selected: boolean; rangeStart: boolean; rangeEnd: boolean; inRange: boolean;
}

const pattern = /^(\d{4})-(\d{2})-(\d{2})$/;
export function parseDate(iso: string | null | undefined) {
  const match = pattern.exec(iso ?? "");
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3]);
  const date = makeDate(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? { year, month, day } : null;
}
// new Date(y, m, d) reads years 0–99 as 1900–1999; setFullYear keeps them as written.
function makeDate(year: number, month: number, day: number) {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  return date;
}
const weekdayOf = (year: number, month: number, day: number) => makeDate(year, month, day).getDay();
const monthLength = (year: number, month: number) => makeDate(year, month + 1, 0).getDate();
export const toIsoDate = (year: number, month: number, day: number) => {
  const date = makeDate(year, month, day);
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export function todayIso(now = new Date()) { return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate()); }
export const isBlocked = (iso: string, min?: string, max?: string) => (!!min && iso < min) || (!!max && iso > max);
/** An app rule for days that cannot be picked inside the bounds, such as holidays or booked days. */
export type DateUnavailable = (iso: string) => boolean;
/** The first column of the week: 0 is Sunday, 1 is Monday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export function clampDate(iso: string, min?: string, max?: string) { return min && iso < min ? min : max && iso > max ? max : iso; }

export function addDays(iso: string, days: number) {
  const date = parseDate(iso)!; return toIsoDate(date.year, date.month, date.day + days);
}
/** The same day in another month, kept inside that month (Jan 31 + 1 month = Feb 28). */
export function addMonths(iso: string, months: number) {
  const date = parseDate(iso)!;
  const last = monthLength(date.year, date.month + months);
  return toIsoDate(date.year, date.month + months, Math.min(date.day, last));
}

/** The band a range draws: the committed range, or while only the start is picked, the start to the previewed day. */
export function rangeBand(range: DateRange | undefined, preview?: string): DateRange | null {
  if (!range?.start) return null;
  if (range.end) return range;
  if (!preview || preview === range.start) return null;
  return preview < range.start ? { start: preview, end: range.start } : { start: range.start, end: preview };
}

/** Whole weeks covering the month from weekStart (Sunday by default), with the neighbouring months' days marked outside. */
export function calendarDays(year: number, month: number, { value, range, min, max, today = todayIso(), weekStart = 0, unavailable, preview }:
  { value?: string; range?: DateRange; min?: string; max?: string; today?: string; weekStart?: WeekStart; unavailable?: DateUnavailable; preview?: string }): CalendarDay[] {
  const first = (weekdayOf(year, month, 1) - weekStart + 7) % 7, count = monthLength(year, month);
  const total = Math.ceil((first + count) / 7) * 7;
  const band = rangeBand(range, preview);
  const start = range?.start || "", end = range?.end || "";
  return Array.from({ length: total }, (_, index) => {
    const iso = toIsoDate(year, month, index - first + 1), date = parseDate(iso)!;
    const outside = index < first || index >= first + count;
    return {
      iso, day: date.day, weekday: weekdayOf(date.year, date.month, date.day), outside,
      blocked: isBlocked(iso, min, max) || !!unavailable?.(iso), today: iso === today,
      selected: !outside && (iso === value || iso === start || iso === end),
      rangeStart: !outside && !!band && iso === band.start, rangeEnd: !outside && !!band && iso === band.end,
      inRange: !outside && !!band && iso > band.start && iso < band.end,
    };
  });
}

/** Weekday names (given Sunday first) turned to start on weekStart. */
export const orderWeekdays = <T,>(names: readonly T[], weekStart: WeekStart = 0) => [...names.slice(weekStart), ...names.slice(0, weekStart)];

/** Whether a whole month lies outside the bounds (for month cells and the previous/next buttons). */
export function monthOutside(year: number, month: number, min?: string, max?: string) {
  return (!!max && toIsoDate(year, month, 1) > max) || (!!min && toIsoDate(year, month + 1, 0) < min);
}

/** Keyboard movement inside the day grid, as in the ARIA date picker pattern; Home and End go to the week's ends. */
export function moveDate(iso: string, key: string, shift = false, weekStart: WeekStart = 0): string | null {
  const date = parseDate(iso); if (!date) return null;
  const column = (weekdayOf(date.year, date.month, date.day) - weekStart + 7) % 7;
  switch (key) {
    case "ArrowLeft": return addDays(iso, -1);
    case "ArrowRight": return addDays(iso, 1);
    case "ArrowUp": return addDays(iso, -7);
    case "ArrowDown": return addDays(iso, 7);
    case "Home": return addDays(iso, -column);
    case "End": return addDays(iso, 6 - column);
    case "PageUp": return addMonths(iso, shift ? -12 : -1);
    case "PageDown": return addMonths(iso, shift ? 12 : 1);
    default: return null;
  }
}

/**
 * The next range after picking a day: a fresh pick starts a range, the second pick ends it (in either order).
 * A range may not run across an unavailable day; picking past one starts a new range there.
 */
export function pickRange(range: DateRange, iso: string, unavailable?: DateUnavailable): DateRange {
  if (!range.start || range.end) return { start: iso, end: "" };
  const next = iso < range.start ? { start: iso, end: range.start } : { start: range.start, end: iso };
  if (unavailable) for (let day = addDays(next.start, 1); day < next.end; day = addDays(day, 1)) if (unavailable(day)) return { start: iso, end: "" };
  return next;
}
/** A range Apply can commit: both ends, or neither (which clears it). */
export const canApplyRange = (range: DateRange) => !!range.start === !!range.end;
/** A range from the app put in order and inside the bounds; a malformed one reads as empty. */
export function normalizeRange(range: DateRange | null | undefined, min?: string, max?: string): DateRange {
  const start = parseDate(range?.start) ? range!.start : "", end = parseDate(range?.end) ? range!.end : "";
  if (!start) return { start: "", end: "" };
  const [low, high] = end && end < start ? [end, start] : [start, end];
  return { start: clampDate(low, min, max), end: high ? clampDate(high, min, max) : "" };
}

/** The calendar's three views: days, the months of a year, and a grid of twelve years. */
export type CalendarMode = "days" | "months" | "years";
const modeMonths: Record<CalendarMode, number> = { days: 1, months: 12, years: 144 };
/** Where the previous and next buttons move the focused day in each view. */
export const stepTarget = (focus: string, mode: CalendarMode, delta: number) => addMonths(focus, delta * modeMonths[mode]);
/** Whether the previous or next button leads only outside the bounds. */
export function stepDisabled(focus: string, mode: CalendarMode, delta: number, min?: string, max?: string) {
  const shown = parseDate(focus)!;
  if (mode === "days") return monthOutside(shown.year, shown.month + delta, min, max);
  if (mode === "months") return monthOutside(shown.year + delta, delta < 0 ? 11 : 0, min, max);
  const years = yearGrid(shown.year + delta * 12);
  return years.every(year => yearOutside(year, min, max));
}
/** The focused day moved into another month of the shown year, kept inside that month. */
export const pickMonth = (focus: string, month: number) => addMonths(focus, month - parseDate(focus)!.month);
/** The focused day moved into another year. */
export const pickYear = (focus: string, year: number) => addMonths(focus, (year - parseDate(focus)!.year) * 12);
/** Twelve years around the shown one, aligned to multiples of twelve, for the year view. */
export const yearGrid = (year: number) => Array.from({ length: 12 }, (_, i) => year - (((year % 12) + 12) % 12) + i);
export const yearOutside = (year: number, min?: string, max?: string) =>
  (!!max && toIsoDate(year, 0, 1) > max) || (!!min && toIsoDate(year, 11, 31) < min);
/** What the footer holds: a clear button when clearing is allowed, then Apply for ranges (unless they commit on the second pick) or Today when today can be picked. */
export function calendarFooter({ range, apply = range, clearable, todayBlocked }: { range: boolean; apply?: boolean; clearable: boolean; todayBlocked: boolean }) {
  const action: "apply" | "today" | null = range ? (apply ? "apply" : null) : todayBlocked ? null : "today";
  return { clear: clearable, action, shown: clearable || !!action };
}

/** The day a calendar opens on: the value (or range start), else today, kept inside the bounds. */
export function initialFocus(value: string | undefined, min?: string, max?: string) {
  return clampDate(parseDate(value) ? value! : todayIso(), min, max);
}

/** A spoken name for a day, such as "2026년 9월 12일 토요일". */
export function dateLabel(iso: string, scope: KjunMessageScope = defaultMessageScope) {
  const date = parseDate(iso); if (!date) return iso;
  const weekday = weekdayOf(date.year, date.month, date.day);
  if (scope.intl) return new Intl.DateTimeFormat(scope.intl, { year: "numeric", month: "long", day: "numeric", weekday: "long" })
    .format(makeDate(date.year, date.month, date.day));
  return scope.messages.dateLabel(date.year, date.month + 1, date.day, weekday);
}

/** Month cell names and the heading of the month view. */
export function monthNames(year: number, scope: KjunMessageScope = defaultMessageScope) {
  if (scope.intl) {
    const short = new Intl.DateTimeFormat(scope.intl, { month: "short" });
    return { title: new Intl.DateTimeFormat(scope.intl, { year: "numeric" }).format(makeDate(year, 0, 1)), months: Array.from({ length: 12 }, (_, m) => short.format(makeDate(year, m, 1))) };
  }
  return { title: scope.messages.yearTitle(year), months: Array.from({ length: 12 }, (_, m) => scope.messages.monthName(m + 1)) };
}

/** Five years around the shown one for the month view's year chips, kept inside the bounds. */
export function yearChoices(year: number, min?: string, max?: string) {
  const low = parseDate(min)?.year ?? -Infinity, high = parseDate(max)?.year ?? Infinity;
  let from = Math.max(low, year - 2);
  if (from + 4 > high) from = Math.max(low, high - 4);
  return Array.from({ length: 5 }, (_, i) => from + i).filter(y => y >= low && y <= high);
}

/** Range field text: the end drops a repeated year ("2026. 09. 08. – 09. 16."). */
export function formatRange(range: DateRange, format: (iso: string) => string) {
  if (!range.start) return "";
  if (!range.end) return format(range.start) + " –";
  const start = format(range.start), end = format(range.end);
  const year = range.start.slice(0, 4);
  return start + " – " + (range.end.startsWith(year) && /^\d{4}\. /.test(end) ? end.slice(6) : end);
}

/** The spoken range for the field: both ends' day names. */
export function rangeSpoken(range: DateRange, scope: KjunMessageScope = defaultMessageScope) {
  return range.start ? dateLabel(range.start, scope) + (range.end ? " – " + dateLabel(range.end, scope) : "") : "";
}
/** The range a form submits: "start/end", or empty until both ends are set. */
export const rangeSubmitted = (range: DateRange) => range.start && range.end ? range.start + "/" + range.end : "";
/** The part a day plays in a range, for its description: start, end or a day between. */
export function rangeRole(day: CalendarDay): "start" | "end" | "between" | null {
  if (day.outside) return null;
  return day.rangeStart ? "start" : day.rangeEnd ? "end" : day.inRange ? "between" : null;
}

const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
const warned = new Set<string>();
/** A one-time development warning shared by the date and time pickers. */
export function warnPicker(message: string) {
  if (!developmentMode() || warned.has(message)) return;
  warned.add(message);
  console.warn("KJUN " + message);
}
