// Default relative time for package copy (Korean): the unit follows the elapsed time, so a value from
// weeks ago reads "23일 전" rather than tens of thousands of minutes. Consumers pass a formatter to override.
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
export function formatRelativeTime(value: string | number | Date, now = Date.now()): string {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return String(value);
  const seconds = Math.round((time - now) / 1000);
  const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) ?? ["second", 1];
  const amount = Math.round(seconds / size);
  if (typeof Intl.RelativeTimeFormat === "function")
    return new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" }).format(amount, unit);
  // Runtimes without RelativeTimeFormat (older Hermes) still get the same Korean wording.
  const names = { year: "년", month: "개월", day: "일", hour: "시간", minute: "분", second: "초" } as Record<string, string>;
  return Math.abs(amount) + names[unit] + (amount < 0 ? " 전" : " 후");
}
