import { addDays, addMonths, dateLabel, parseDate, todayIso, weekdayOf } from "./calendar";
import type { CalendarDay, WeekStart } from "./calendar";
import { defaultMessageScope } from "./messages";
import type { KjunMessageScope } from "./messages";

// Model of the event calendar (month and week) shared by React, Vue 3 and Native. Pure: no react import here.
/** A bar over consecutive days; the colour is whatever the app passes. */
export interface DaySpan<C = string> { color: C; start: string; end: string }
export interface DayMarks<C = string> { spans?: readonly DaySpan<C>[]; icon?: { name: string; color: C }; dots?: readonly C[]; count?: number }
/** A holiday rule: true marks the day, a string marks it and names it. */
export type HolidayTest = (iso: string) => string | boolean;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
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
    selected: false, rangeStart: false, rangeEnd: false, inRange: false,
  };
});

/** What a span draws on one day: null outside it; rounded at the span's ends and at the week's edges (column 0 and 6). */
export function spanSegment(span: DaySpan<unknown>, iso: string, column: number) {
  if (span.start > span.end || iso < span.start || iso > span.end) return null;
  return { start: iso === span.start || column === 0, end: iso === span.end || column === 6 };
}
const maxDots = 3;
export const visibleDots = <C,>(dots: readonly C[] | undefined): C[] => (dots ?? []).slice(0, maxDots);

const swipeDistance = 20, swipeRatio = 2;
/** The month step of a horizontal swipe: left is next (+1), right is previous (-1). */
export const swipeStep = (dx: number, dy: number): -1 | 0 | 1 =>
  Math.abs(dx) > swipeDistance && Math.abs(dx) > Math.abs(dy) * swipeRatio ? (dx < 0 ? 1 : -1) : 0;

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

/** A spoken name for an event day: the date, then the holiday name and the event count when present. */
export function eventDayLabel(iso: string, { holiday, count }: { holiday?: string; count?: number; today?: boolean }, scope: KjunMessageScope = defaultMessageScope) {
  const events = Math.floor(count ?? 0);
  return [dateLabel(iso, scope), holiday, events >= 1 ? scope.messages.eventCount(events) : ""].filter(Boolean).join(", ");
}

/** The month slide: the old month leaves, then the newest requested one enters. */
export interface SlideState { shown: string; pending: string | null; phase: "idle" | "out" | "in"; direction: -1 | 1 }
export function slideStart(state: SlideState, next: string): SlideState {
  if (state.phase !== "idle") return { ...state, pending: next };
  if (next === state.shown) return state;
  return { shown: state.shown, pending: next, phase: "out", direction: next > state.shown ? 1 : -1 };
}
export function slideNext(state: SlideState): SlideState {
  if (state.phase === "out") return { ...state, shown: state.pending ?? state.shown, pending: null, phase: "in" };
  if (state.phase === "in" && state.pending && state.pending !== state.shown)
    return { shown: state.shown, pending: state.pending, phase: "out", direction: state.pending > state.shown ? 1 : -1 };
  return { ...state, pending: null, phase: "idle" };
}
