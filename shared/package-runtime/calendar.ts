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
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? { year, month, day } : null;
}
export const toIsoDate = (year: number, month: number, day: number) => {
  const date = new Date(year, month, day);
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export function todayIso(now = new Date()) { return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate()); }
export const isBlocked = (iso: string, min?: string, max?: string) => (!!min && iso < min) || (!!max && iso > max);
export function clampDate(iso: string, min?: string, max?: string) { return min && iso < min ? min : max && iso > max ? max : iso; }

export function addDays(iso: string, days: number) {
  const date = parseDate(iso)!; return toIsoDate(date.year, date.month, date.day + days);
}
/** The same day in another month, kept inside that month (Jan 31 + 1 month = Feb 28). */
export function addMonths(iso: string, months: number) {
  const date = parseDate(iso)!;
  const last = new Date(date.year, date.month + months + 1, 0).getDate();
  return toIsoDate(date.year, date.month + months, Math.min(date.day, last));
}

/** Whole weeks (Sunday first) covering the month, with the neighbouring months' days marked outside. */
export function calendarDays(year: number, month: number, { value, range, min, max, today = todayIso() }:
  { value?: string; range?: DateRange; min?: string; max?: string; today?: string }): CalendarDay[] {
  const first = new Date(year, month, 1).getDay(), count = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((first + count) / 7) * 7;
  const start = range?.start || "", end = range?.end || "";
  return Array.from({ length: total }, (_, index) => {
    const iso = toIsoDate(year, month, index - first + 1), date = parseDate(iso)!;
    const outside = index < first || index >= first + count;
    return {
      iso, day: date.day, weekday: index % 7, outside, blocked: isBlocked(iso, min, max), today: iso === today,
      selected: !outside && (iso === value || iso === start || iso === end),
      rangeStart: !outside && !!start && iso === start, rangeEnd: !outside && !!end && iso === end,
      inRange: !outside && !!start && !!end && iso > start && iso < end,
    };
  });
}

/** Whether a whole month lies outside the bounds (for month cells and the previous/next buttons). */
export function monthOutside(year: number, month: number, min?: string, max?: string) {
  return (!!max && toIsoDate(year, month, 1) > max) || (!!min && toIsoDate(year, month + 1, 0) < min);
}

/** Keyboard movement inside the day grid, as in the ARIA date picker pattern. */
export function moveDate(iso: string, key: string, shift = false): string | null {
  const date = parseDate(iso); if (!date) return null;
  switch (key) {
    case "ArrowLeft": return addDays(iso, -1);
    case "ArrowRight": return addDays(iso, 1);
    case "ArrowUp": return addDays(iso, -7);
    case "ArrowDown": return addDays(iso, 7);
    case "Home": return addDays(iso, -new Date(date.year, date.month, date.day).getDay());
    case "End": return addDays(iso, 6 - new Date(date.year, date.month, date.day).getDay());
    case "PageUp": return addMonths(iso, shift ? -12 : -1);
    case "PageDown": return addMonths(iso, shift ? 12 : 1);
    default: return null;
  }
}

/** The next range after picking a day: a fresh pick starts a range, the second pick ends it (in either order). */
export function pickRange(range: DateRange, iso: string): DateRange {
  if (!range.start || range.end) return { start: iso, end: "" };
  return iso < range.start ? { start: iso, end: range.start } : { start: range.start, end: iso };
}

/** The day a calendar opens on: the value (or range start), else today, kept inside the bounds. */
export function initialFocus(value: string | undefined, min?: string, max?: string) {
  return clampDate(parseDate(value) ? value! : todayIso(), min, max);
}

/** A spoken name for a day, such as "2026년 9월 12일 토요일". */
export function dateLabel(iso: string, scope: KjunMessageScope = defaultMessageScope) {
  const date = parseDate(iso); if (!date) return iso;
  const weekday = new Date(date.year, date.month, date.day).getDay();
  if (scope.intl) return new Intl.DateTimeFormat(scope.intl, { year: "numeric", month: "long", day: "numeric", weekday: "long" })
    .format(new Date(date.year, date.month, date.day));
  return scope.messages.dateLabel(date.year, date.month + 1, date.day, weekday);
}

/** Month cell names and the heading of the month view. */
export function monthNames(year: number, scope: KjunMessageScope = defaultMessageScope) {
  if (scope.intl) {
    const short = new Intl.DateTimeFormat(scope.intl, { month: "short" });
    return { title: new Intl.DateTimeFormat(scope.intl, { year: "numeric" }).format(new Date(year, 0, 1)), months: Array.from({ length: 12 }, (_, m) => short.format(new Date(year, m, 1))) };
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
