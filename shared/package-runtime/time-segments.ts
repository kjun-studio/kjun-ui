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
