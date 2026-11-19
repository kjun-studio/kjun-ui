import { tokens } from "@kjun-ui/tokens";
import { addDays, addMonths, calendarDays, dateLabel, parseDate, todayIso, weekdayOf } from "./calendar";
import type { CalendarDay, WeekStart } from "./calendar";
import { calendarLabels, defaultMessageScope, resolveMessageScope } from "./messages";
import type { KjunMessageScope } from "./messages";

// Model of the event calendar (month and week) shared by React, Vue 3 and Native. Pure: no react import here.
/** A bar over consecutive days; the colour is whatever the app passes. */
export interface DaySpan<C = string> { color: C; start: string; end: string }
export interface DayMarks<C = string> { spans?: readonly DaySpan<C>[]; icon?: { name: string; color: C }; dots?: readonly C[]; count?: number }
/** A holiday rule: true marks the day, a string marks it and names it. */
export type HolidayTest = (iso: string) => string | boolean;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
/** The app's "YYYY-MM-DD" today (server time, another time zone); missing or malformed reads as the device's today. */
export const resolveToday = (today?: string) => today && parseDate(today) ? today : todayIso();
/** "YYYY-MM"; a malformed value reads as the month of today. */
export const resolveMonth = (month: string | undefined, today = todayIso()) => monthPattern.test(month ?? "") ? month! : today.slice(0, 7);
/** The first day of the week holding the given day (today's week when malformed). */
export function resolveWeek(week: string | undefined, weekStart: WeekStart = 0, today = todayIso()) {
  const date = parseDate(week) ?? parseDate(today)!;
  const iso = `${String(date.year).padStart(4, "0")}-${String(date.month + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  return addDays(iso, -((weekdayOf(date.year, date.month, date.day) - weekStart + 7) % 7));
}
export const stepMonth = (month: string, delta: number) => addMonths(month + "-01", delta).slice(0, 7);
/** Seven days from the week's first day; none is outside the month. */
export const weekDays = (weekStartIso: string, today = todayIso()): CalendarDay[] => Array.from({ length: 7 }, (_, index) => {
  const iso = addDays(weekStartIso, index), date = parseDate(iso)!;
  return {
    iso, day: date.day, weekday: weekdayOf(date.year, date.month, date.day), outside: false, blocked: false, today: iso === today,
    selected: false, rangeStart: false, rangeEnd: false, inRange: false, limited: false,
  };
});

// A period key is "YYYY-MM" for a month or the week's first day ("YYYY-MM-DD") for a week.
/** Whether a day belongs to the period shown (outside days of a month do not). */
export const withinPeriod = (iso: string, key: string) => key.length === 7 ? iso.startsWith(key + "-") : iso >= key && iso <= addDays(key, 6);
/** The days drawn for a period: six fixed weeks for a month, seven days for a week. */
export function periodDays(key: string, today: string, weekStart: WeekStart): CalendarDay[] {
  if (key.length !== 7) return weekDays(key, today);
  const [year, month] = key.split("-").map(Number);
  return calendarDays(year, month - 1, { today, weekStart, fixedWeeks: true });
}
/** The grid's name: the month ("2026년 11월"), or a week's first and last day ("2026년 11월 16일 – 22일"). */
export function periodTitle(key: string, scope: KjunMessageScope = defaultMessageScope) {
  const first = parseDate(key.length === 7 ? key + "-01" : key)!;
  if (key.length === 7) return calendarLabels(first.year, first.month, scope).title;
  const last = parseDate(addDays(key, 6))!;
  if (scope.intl) {
    const format = new Intl.DateTimeFormat(scope.intl, { year: "numeric", month: "long", day: "numeric" });
    const from = new Date(first.year, first.month, first.day), to = new Date(last.year, last.month, last.day);
    // Runtimes without formatRange (older Hermes) join the two dates.
    const range = (format as { formatRange?: (from: Date, to: Date) => string }).formatRange;
    return typeof range === "function" ? range.call(format, from, to) : format.format(from) + " – " + format.format(to);
  }
  return scope.messages.weekTitle(first.year, first.month + 1, first.day, last.year, last.month + 1, last.day);
}

/**
 * Helpers for the app's own title row and buttons: the calendar draws neither.
 * key is "YYYY-MM" for a month, or any day "YYYY-MM-DD" of a week.
 */
export const kjunCalendarPeriod = {
  /** The month ("YYYY-MM") or the week's first day ("YYYY-MM-DD") delta periods away. */
  step(view: "month" | "week", key: string, delta: number, weekStart: WeekStart = 0): string {
    return view === "week" ? addDays(resolveWeek(key, weekStart), 7 * delta) : stepMonth(resolveMonth(key.slice(0, 7)), delta);
  },
  /** The period's name as the grid reads it: "2026년 11월", or "2026년 11월 29일 – 12월 5일" for a week. locale follows KjunProvider's. */
  title(view: "month" | "week", key: string, options: { locale?: string; weekStart?: WeekStart } = {}): string {
    const scope = options.locale ? resolveMessageScope(undefined, options.locale) : defaultMessageScope;
    return periodTitle(view === "week" ? resolveWeek(key, options.weekStart ?? 0) : resolveMonth(key.slice(0, 7)), scope);
  },
};

/** What a span draws on one day: null outside it; rounded at the span's ends and at the week's edges (column 0 and 6). */
export function spanSegment(span: DaySpan<unknown>, iso: string, column: number) {
  if (span.start > span.end || iso < span.start || iso > span.end) return null;
  return { start: iso === span.start || column === 0, end: iso === span.end || column === 6 };
}
const maxDots = 3;
export const visibleDots = <C,>(dots: readonly C[] | undefined): C[] => (dots ?? []).slice(0, maxDots);

/** The month step of a horizontal swipe: left is next (+1), right is previous (-1). */
export const swipeStep = (dx: number, dy: number): -1 | 0 | 1 =>
  Math.abs(dx) > tokens.extensions.calendar.swipeDistance && Math.abs(dx) > Math.abs(dy) * tokens.extensions.calendar.swipeRatio ? (dx < 0 ? 1 : -1) : 0;

/** The colour role of a day's number: holidays and Sundays danger, Saturdays info. */
export function dayTone(weekday: number, { markSunday, markSaturday, holiday }: { markSunday: boolean; markSaturday: boolean; holiday: boolean }): "danger" | "info" | "text" {
  if (holiday || (markSunday && weekday === 0)) return "danger";
  return markSaturday && weekday === 6 ? "info" : "text";
}
export function holidayOf(test: HolidayTest | undefined, iso: string, scope: KjunMessageScope = defaultMessageScope): { holiday: boolean; name?: string } {
  const result = test?.(iso);
  if (!result) return { holiday: false };
  return { holiday: true, name: typeof result === "string" ? result : scope.messages.holiday };
}
export const isPast = (iso: string, today: string) => iso < today;

/** A spoken name for an event day: the date, then "today", the holiday name and the event count when present. */
export function eventDayLabel(iso: string, { holiday, count, today }: { holiday?: string; count?: number; today?: boolean }, scope: KjunMessageScope = defaultMessageScope) {
  const events = Number.isFinite(count) ? Math.floor(count!) : 0;
  return [dateLabel(iso, scope), today ? scope.messages.today : "", holiday, events >= 1 ? scope.messages.eventCount(events) : ""].filter(Boolean).join(", ");
}

/** The month slide: the old month leaves, then the newest requested one enters. */
export interface SlideState { shown: string; pending: string | null; phase: "idle" | "out" | "in"; direction: -1 | 1 }
const directionOf = (shown: string, target: string): -1 | 1 => target > shown ? 1 : -1;
export function slideStart(state: SlideState, next: string): SlideState {
  if (state.phase !== "idle") return { ...state, pending: next, direction: next === state.shown ? state.direction : directionOf(state.shown, next) };
  if (next === state.shown) return state;
  return { shown: state.shown, pending: next, phase: "out", direction: directionOf(state.shown, next) };
}
export function slideNext(state: SlideState): SlideState {
  if (state.phase === "out") {
    // The target came back to the shown month: nothing to enter.
    if (!state.pending || state.pending === state.shown) return { ...state, pending: null, phase: "idle" };
    return { ...state, shown: state.pending, pending: null, phase: "in" };
  }
  if (state.phase === "in" && state.pending && state.pending !== state.shown)
    return { shown: state.shown, pending: state.pending, phase: "out", direction: directionOf(state.shown, state.pending) };
  return { ...state, pending: null, phase: "idle" };
}
