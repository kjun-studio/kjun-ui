import { deviationLevel, type DeviationLevel } from "@kjun-ui/tokens";

/** A finite number from a number or numeric string; null for missing, blank or non-numeric input. -0 becomes 0. */
export const finiteNumber = (value: unknown): number | null =>
  value == null ||
  typeof value === "boolean" ||
  (typeof value === "string" && !value.trim()) ||
  !["number", "string"].includes(typeof value) ||
  !Number.isFinite(Number(value))
    ? null
    : Number(value) || 0;

const digits = (decimals: number) => Math.max(0, Math.min(20, decimals));

export const format = (value: number, decimals = 0) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits(decimals),
    maximumFractionDigits: digits(decimals),
  }).format(value);

/**
 * The value as it will be shown: rounded to `decimals`, with -0 folded into 0. Sign and colour follow this,
 * so 0.001 at two decimals reads "0.00" in the neutral colour rather than "+0.00" in the rising one.
 * A custom formatter owns its own rounding, so the raw value is kept.
 */
export function shownNumber(value: number, decimals: number, formatter?: (value: number) => string) {
  return formatter ? value : Number(value.toFixed(digits(decimals))) || 0;
}

/** Direction of a shown value: 1 rising, -1 falling, 0 flat. */
export const numberDirection = (value: number) => (value > 0 ? 1 : value < 0 ? -1 : 0);

export interface SignedValueTextOptions {
  decimals: number;
  percent: boolean;
  prefix: string;
  suffix: string;
  showSign: boolean;
  formatter?: (value: number) => string;
}

/** SignedValue's text and direction; "—" and direction 0 when there is no number. */
export function signedValueText(value: unknown, o: SignedValueTextOptions): { text: string; direction: number; missing: boolean } {
  const n = finiteNumber(value);
  if (n === null) return { text: "—", direction: 0, missing: true };
  const shown = shownNumber(n, o.decimals, o.formatter), direction = numberDirection(shown);
  const text = o.formatter
    ? o.formatter(n)
    : o.prefix + (o.showSign && direction > 0 ? "+" : "") + format(shown, o.decimals) + (o.percent ? "%" : "") + o.suffix;
  return { text, direction, missing: false };
}

/** Deviation's label, direction and fill step from the shown (rounded) value. Null when there is no number. */
export function deviationText(value: unknown, decimals: number, formatter?: (value: number) => string):
  { label: string; direction: number; level: DeviationLevel; abs: number } | null {
  const n = finiteNumber(value);
  if (n === null) return null;
  const shown = shownNumber(n, decimals, formatter), direction = numberDirection(shown);
  const level = direction === 0 ? "neutral" : deviationLevel(shown);
  const label = formatter ? formatter(n) : (direction > 0 ? "+" : "") + format(shown, decimals) + "%";
  return { label, direction, level, abs: Math.abs(shown) };
}
