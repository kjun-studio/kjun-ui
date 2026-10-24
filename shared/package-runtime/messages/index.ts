import { kjunMessagesEn } from "./en";
import { kjunMessagesKo, type KjunMessages } from "./ko";

export { kjunMessagesEn, kjunMessagesKo, type KjunMessages };

/** What KjunProvider resolved: the copy to render and the locale handed to Intl (undefined keeps each call site's old default). */
export interface KjunMessageScope {
  intl?: string;
  language?: string;
  messages: KjunMessages;
  overrides: Partial<KjunMessages>;
}

export const defaultMessageScope: KjunMessageScope = { messages: kjunMessagesKo, overrides: {} };

function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
const warnedLocales = new Set<string>();

/** "en_US" becomes "en-US"; a tag Intl rejects keeps its language for the copy but no Intl locale, and never throws. */
export function normalizeLocale(locale?: string): { intl?: string; language?: string } {
  if (!locale) return {};
  const tag = locale.trim().replace(/_/g, "-");
  const language = tag.split("-")[0].toLowerCase() || undefined;
  try {
    return { intl: Intl.getCanonicalLocales(tag)[0], language };
  } catch {
    if (developmentMode() && !warnedLocales.has(locale)) {
      warnedLocales.add(locale);
      console.warn(`KJUN Provider: locale "${locale}" is not a valid BCP 47 tag; dates and numbers keep their default format.`);
    }
    return { language };
  }
}

const packFor = (language?: string) => language === undefined || language === "ko" ? kjunMessagesKo : kjunMessagesEn;

/** Props > messages > the locale's pack (ko, en, otherwise en) > Korean. A nested scope in another language drops the outer overrides. */
export function resolveMessageScope(parent: KjunMessageScope | undefined, locale?: string, messages?: Partial<KjunMessages>): KjunMessageScope {
  const base = parent ?? defaultMessageScope;
  const next = locale ? normalizeLocale(locale) : { intl: base.intl, language: base.language };
  // No locale means Korean, so a nested "ko" keeps messages written for a Provider without a locale.
  const sameLanguage = (next.language ?? "ko") === (base.language ?? "ko");
  const overrides = { ...(sameLanguage ? base.overrides : {}), ...messages };
  return { ...next, overrides, messages: { ...packFor(next.language), ...overrides } };
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];
// The unit follows the elapsed time, so a value from weeks ago reads "23 days ago" rather than tens of thousands of minutes.
// Without an Intl locale, Korean copy formats as ko-KR and any other pack as en, so an invalid locale never mixes in Korean.
export function formatRelativeTime(value: string | number | Date, now = Date.now(), scope: KjunMessageScope = defaultMessageScope): string {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return String(value);
  const seconds = Math.round((time - now) / 1000);
  const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) ?? ["second", 1];
  const amount = Math.round(seconds / size);
  if (typeof Intl.RelativeTimeFormat === "function")
    return new Intl.RelativeTimeFormat(scope.intl ?? (!scope.language || scope.language === "ko" ? "ko-KR" : "en"), { numeric: "auto" }).format(amount, unit);
  // Runtimes without RelativeTimeFormat (older Hermes) still get the pack's wording.
  return scope.messages.relativeTimeFallback(amount, unit);
}

/** A "YYYY-MM-DD" value for display; without a locale it keeps KJUN's "2026. 10. 23." form. */
export function formatDateValue(iso: string, scope: KjunMessageScope = defaultMessageScope): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!scope.intl || !match) return iso.replace(/-/g, ". ") + ".";
  return new Intl.DateTimeFormat(scope.intl, { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/** Calendar heading and Sunday-first weekday names; month is 0-based. */
export function calendarLabels(year: number, month: number, scope: KjunMessageScope = defaultMessageScope): { title: string; weekdays: string[] } {
  if (!scope.intl) return { title: scope.messages.calendarTitle(year, month + 1), weekdays: scope.messages.weekdays.split(",") };
  const weekday = new Intl.DateTimeFormat(scope.intl, { weekday: "short" });
  return {
    title: new Intl.DateTimeFormat(scope.intl, { year: "numeric", month: "long" }).format(new Date(year, month, 1)),
    // 2026-10-04 is a Sunday.
    weekdays: Array.from({ length: 7 }, (_, day) => weekday.format(new Date(2026, 9, 4 + day))),
  };
}
