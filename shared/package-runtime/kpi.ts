import { badgeToneRoles, type BadgeToneRoles, type BadgeVariant } from "./badge-tone";

// Framework-agnostic KPI rules shared by KjunKpiHero and KjunKpiRow on every platform: number text, direction,
// missing values, masking, the delta line, the mobile summary layout and the row's keyboard activation.

/** What a masked amount draws in place of its digits. */
export const KPI_MASK = "••••";
/** What a missing value draws unless the app gives its own text. */
export const KPI_MISSING = "—";
/** Digit height as a share of the font size: Native KPI skeleton bars stand this tall, like Web's 1cap. */
export const KPI_NUMERAL_HEIGHT = 0.72;

export type KpiDirection = 1 | -1 | 0;
export type KpiBadgeVariant = "warning" | "success" | "danger" | "price-up" | "price-down" | "info" | "neutral";

/** The parts of a KPI value the shared rules read; each platform adds its own class or color fields. */
export interface KpiNumberItem {
  value?: number | string | null;
  decimals?: number;
  semantic?: "price" | "status";
  showSign?: boolean;
  formatter?: (value: number) => string;
  missingText?: string;
}

const clampDecimals = (decimals = 0) => Math.max(0, Math.min(20, Math.trunc(decimals) || 0));
const formats = new Map<string, Intl.NumberFormat>();
/** One cached formatter per locale and precision; an undefined locale keeps the runtime's default. */
export function kpiNumber(value: number, decimals = 0, locale?: string): string {
  const digits = clampDecimals(decimals), key = (locale ?? "") + "|" + digits;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    formats.set(key, format);
  }
  // A value that rounds to zero never prints a negative zero.
  return format.format(Object.is(value, -0) ? 0 : value);
}

/** The value as it will be shown at this precision, so direction and sign follow the drawn digits. */
export const kpiRound = (value: number, decimals = 0) => {
  const rounded = Number(value.toFixed(clampDecimals(decimals)));
  return rounded === 0 ? 0 : rounded;
};

/** null, undefined and non-finite numbers are missing, never zero. */
export const kpiPresent = (value: unknown): value is number | string =>
  value != null && (typeof value !== "number" || Number.isFinite(value));

const signOf = (value: number): KpiDirection => (value > 0 ? 1 : value < 0 ? -1 : 0);

/** Up, down or flat as drawn: a number rounds at its decimals; a formatted or string value keeps its raw sign. */
export function kpiDirection(item: KpiNumberItem): KpiDirection {
  const number = Number(item.value);
  if (item.value == null || item.value === "" || !Number.isFinite(number)) return 0;
  return typeof item.value === "number" && !item.formatter ? signOf(kpiRound(number, item.decimals)) : signOf(number);
}

/** The price tone a value paints, or null for neutral text. */
export const kpiTone = (item: KpiNumberItem): "up" | "down" | null => {
  if (item.semantic !== "price") return null;
  const direction = kpiDirection(item);
  return direction > 0 ? "up" : direction < 0 ? "down" : null;
};

/** The value's text: missing text, the app's string or formatter, or the locale's digits with the KPI sign rule. */
export function kpiFormat(item: KpiNumberItem, value: number | string | null | undefined = item.value, locale?: string): string {
  if (!kpiPresent(value)) return item.missingText ?? KPI_MISSING;
  if (typeof value === "string") return value;
  if (item.formatter) return item.formatter(value);
  const rounded = kpiRound(value, item.decimals), direction = signOf(rounded);
  const sign = item.showSign && direction > 0 ? "+" : item.semantic === "price" && direction < 0 ? "−" : "";
  return sign + kpiNumber(item.semantic === "price" ? Math.abs(rounded) : rounded, item.decimals, locale);
}

export interface KpiDeltaOptions {
  decimals?: number;
  percentDecimals?: number;
  locale?: string;
  /** With the app's own delta text the digits are unknown, so direction keeps the raw sign. */
  formatted?: boolean;
}
export interface KpiDeltaParts { direction: KpiDirection; sign: string; number: string }
/** One delta number: its drawn direction, its sign and its unsigned digits. */
export function kpiDelta(value: number, kind: "absolute" | "percent", options: KpiDeltaOptions = {}): KpiDeltaParts {
  const decimals = kind === "absolute" ? options.decimals ?? 0 : options.percentDecimals ?? 1;
  const rounded = kpiRound(value, decimals), direction = options.formatted ? signOf(value) : signOf(rounded);
  return { direction, sign: direction > 0 ? "+" : direction < 0 ? "−" : "", number: kpiNumber(Math.abs(rounded), decimals, options.locale) };
}

/** A finite delta number, or null when the app passed nothing, null or a non-finite value. */
export const kpiDeltaValue = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** The caret marks the first delta number shown, and only when it has a direction. */
export const kpiDeltaIcon = (enabled: boolean, direction: KpiDirection, kind: "absolute" | "percent", hasAbsolute: boolean) =>
  enabled && direction !== 0 && (kind === "absolute" || !hasAbsolute);

const deltaKeys = ["deltaAbsolute", "deltaPercent", "deltaDescription", "delta-absolute", "delta-percent", "delta-description"];
/** The delta line shows with any delta, and while loading when the app passed a delta prop at all. */
export const kpiShowDelta = (absolute: number | null, percent: number | null, description: string, loading: boolean, passed: object | null | undefined) =>
  absolute !== null || percent !== null || !!description ||
  (loading && deltaKeys.some(key => Object.prototype.hasOwnProperty.call(passed ?? {}, key)));

/** Whether any price colour is painted, so the domain colour contract must be present. */
export function kpiHeroNeedsDomain(options: { loading: boolean; masked: boolean; absolute: number | null; percent: number | null;
  decimals?: number; percentDecimals?: number; formatted?: boolean; secondary: KpiNumberItem[] }) {
  if (options.loading || options.masked) return false;
  const delta = { decimals: options.decimals, percentDecimals: options.percentDecimals, formatted: options.formatted };
  return (options.absolute !== null && kpiDelta(options.absolute, "absolute", delta).direction !== 0) ||
    (options.percent !== null && kpiDelta(options.percent, "percent", delta).direction !== 0) ||
    options.secondary.some(item => kpiTone(item) !== null);
}
export const kpiRowNeedsDomain = (loading: boolean, masked: boolean, items: (KpiNumberItem & { loading?: boolean; badge?: { variant?: string } | null })[]) =>
  !loading && items.some(item => !item.loading && ((!masked && kpiTone(item) !== null) || !!item.badge?.variant?.startsWith("price-")));

/** Only items marked mobileSecondary fold into the summary's inline footnote; an odd last primary cell takes the full width. */
export function kpiSummaryLayout(items: { mobileSecondary?: boolean; mobileFull?: boolean }[]) {
  const secondary = items.map(item => item.mobileSecondary === true);
  const primary = items.flatMap((item, i) => (!secondary[i] && !item.mobileFull ? [i] : []));
  return { secondary, lastFull: primary.length % 2 ? primary[primary.length - 1] : -1 };
}

/** A row badge is KjunBadge's tone: neutral is the secondary badge. */
export const kpiBadgeVariant = (variant?: KpiBadgeVariant): BadgeVariant => (!variant || variant === "neutral" ? "secondary" : variant);
export const kpiBadgeRoles = (variant?: KpiBadgeVariant): BadgeToneRoles => badgeToneRoles(kpiBadgeVariant(variant));

/**
 * Keyboard activation for a clickable cell drawn as a button: Enter acts once on key down (never on auto-repeat),
 * Space acts on key up like a native button, and its key down only stops the page from scrolling.
 */
export function kpiKeyAction(type: "keydown" | "keyup", key: string, repeat: boolean): "activate" | "prevent" | null {
  if (key === "Enter") return type === "keydown" ? (repeat ? "prevent" : "activate") : null;
  if (key === " " || key === "Spacebar") return type === "keyup" ? "activate" : "prevent";
  return null;
}

/** A spoken cell: its non-empty parts in reading order. */
export const kpiSpoken = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join(", ");

/** Web: the CSS colour for a tone or direction, or the neutral role. */
export const kpiCssColor = (tone: "up" | "down" | KpiDirection | null, neutral = "text") =>
  tone === "up" || tone === 1 ? "var(--_kjun-color-price-up)" : tone === "down" || tone === -1 ? "var(--_kjun-color-price-down)" : `var(--_kjun-color-${neutral})`;
/** Web: the percent chip's tint, the direction's soft fill or the neutral fill when flat. */
export const kpiCssTint = (direction: KpiDirection) =>
  direction === 0 ? "var(--_kjun-color-secondary)" : `var(--_kjun-color-price-${direction > 0 ? "up" : "down"}-bg)`;
