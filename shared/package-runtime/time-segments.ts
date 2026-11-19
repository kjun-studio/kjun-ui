import type { createTimeDomain, TimePrecision } from "@kjun-ui/tokens";
import type { KjunMessages } from "./messages/ko";

// The segments a TimePicker draws, shared by every platform. A 12-hour clock adds an AM/PM segment and shows
// hours 1–12; the value stays "HH:mm" either way.
type TimeDomain = ReturnType<typeof createTimeDomain>;
export type HourCycle = 12 | 24;
// A type alias (not an interface) so it fits SelectOption's index signature.
export type TimeSegmentOption = { value: number; label: string };
export interface TimeSegmentModel {
  key: "period" | "hour" | "minute" | "second";
  label: string;
  value: number | null;
  options: TimeSegmentOption[];
  /** The time after choosing this option; the same value when nothing in the domain matches. */
  pick: (option: number) => string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function timeSegments(domain: TimeDomain, value: string | null, { precision, hourCycle = 24, messages, periodFirst = true }:
  { precision: TimePrecision; hourCycle?: HourCycle; messages: KjunMessages; periodFirst?: boolean }): TimeSegmentModel[] {
  const time = value === null ? null : domain.parse(value);
  const segment = (index: number, key: TimeSegmentModel["key"], label: string): TimeSegmentModel => ({
    key, label, value: time === null ? null : domain.part(time, index),
    options: domain.options(value, index).map(n => ({ value: n, label: pad(n) })),
    pick: n => domain.select(value, index, n),
  });
  const rest = [segment(1, "minute", messages.minute), ...(precision === "second" ? [segment(2, "second", messages.second)] : [])];
  if (hourCycle === 24) return [segment(0, "hour", messages.hour), ...rest];

  const hours = domain.options(null, 0), current = time === null ? null : domain.part(time, 0);
  const periods = [0, 1].filter(p => hours.some(h => (h >= 12 ? 1 : 0) === p));
  const period = current === null ? null : current >= 12 ? 1 : 0, shownPeriod = period ?? periods[0] ?? 0;
  const inPeriod = (p: number) => hours.filter(h => (h >= 12 ? 1 : 0) === p);
  const periodSegment: TimeSegmentModel = {
    key: "period", label: messages.period, value: period,
    options: periods.map(p => ({ value: p, label: p ? messages.pm : messages.am })),
    pick: p => {
      const choices = inPeriod(p);
      if (!choices.length) return value;
      const same = current === null ? undefined : (current % 12) + p * 12;
      return domain.select(value, 0, same !== undefined && choices.includes(same) ? same : choices[0]);
    },
  };
  const hourSegment: TimeSegmentModel = {
    key: "hour", label: messages.hour, value: current === null ? null : current % 12 || 12,
    options: inPeriod(shownPeriod).map(h => ({ value: h % 12 || 12, label: pad(h % 12 || 12) })),
    pick: n => domain.select(value, 0, (n % 12) + shownPeriod * 12),
  };
  return periodFirst ? [periodSegment, hourSegment, ...rest] : [hourSegment, ...rest, periodSegment];
}

/** Korean and other East Asian clocks put 오전/오후 before the hour; most others put AM/PM after it. */
export const periodLeads = (language?: string) => !language || ["ko", "ja", "zh"].includes(language);

/** Typing digits into a focused segment: a digit picks at once when no two-digit option starts with it; otherwise it waits for a
 * second digit (and picks the single digit meanwhile when that is an option). A pair that is no option starts over from the new digit.
 * `typed` is the waiting digit ("" for none); `value` the option to pick (null for none); `advance` moves focus to the next segment. */
export function typeSegmentDigit(options: readonly number[], typed: string, digit: string): { typed: string; value: number | null; advance: boolean } {
  if (!/^\d$/.test(digit)) return { typed: "", value: null, advance: false };
  if (typed) {
    const pair = Number(typed + digit);
    if (options.includes(pair)) return { typed: "", value: pair, advance: true };
  }
  const d = Number(digit), single = options.includes(d) ? d : null;
  const grows = options.some(option => option !== d && option >= d * 10 && option <= d * 10 + 9);
  return grows ? { typed: digit, value: single, advance: false } : { typed: "", value: single, advance: single !== null };
}

/** A period segment answers the first letter of its labels (a/p, or the label's own first letter when the two differ). */
export function typeSegmentPeriod(options: readonly { value: number; label: string }[], key: string): number | null {
  const k = key.toLowerCase();
  if (k.length !== 1) return null;
  const firsts = options.map(option => option.label.trim().charAt(0).toLowerCase());
  const own = firsts.length > 1 && firsts[0] === firsts[1] ? -1 : firsts.indexOf(k);
  if (own >= 0) return options[own].value;
  const latin = k === "a" ? 0 : k === "p" ? 1 : null;
  return latin !== null && options.some(option => option.value === latin) ? latin : null;
}

/** Keeps the waiting digit of a TimePicker for a second, like a typeahead. */
export function createSegmentTyping(timeout = 1000) {
  let index = -1, typed = "", at = 0;
  return {
    key(segment: TimeSegmentModel, segmentIndex: number, key: string, now = Date.now()): { value: number | null; advance: boolean } | null {
      if (segmentIndex !== index || now - at > timeout) typed = "";
      index = segmentIndex; at = now;
      if (segment.key === "period") { typed = ""; const value = typeSegmentPeriod(segment.options, key); return value === null ? null : { value, advance: true }; }
      if (!/^\d$/.test(key)) return null;
      const next = typeSegmentDigit(segment.options.map(option => option.value), typed, key);
      typed = next.typed;
      return { value: next.value, advance: next.advance };
    },
    reset() { index = -1; typed = ""; },
  };
}

/** A segment's spinbutton keys: ↑ and ↓ take the next and previous option and go round, Home and End the first and last.
 * An empty segment starts from its first option (↑) or its last (↓). Returns the option, or null when the key does nothing. */
export function segmentStep(segment: TimeSegmentModel, key: string): number | null {
  const values = segment.options.map(option => option.value);
  if (!values.length) return null;
  if (key === "Home") return values[0];
  if (key === "End") return values[values.length - 1];
  const delta = key === "ArrowUp" ? 1 : key === "ArrowDown" ? -1 : 0;
  if (!delta) return null;
  const at = segment.value === null ? -1 : values.indexOf(segment.value);
  if (at < 0) return delta > 0 ? values[0] : values[values.length - 1];
  return values[(at + delta + values.length) % values.length];
}
