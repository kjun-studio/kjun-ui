import type { KjunMessageScope } from "./messages";
import { defaultMessageScope } from "./messages";

export type NumberInputFormat = "number" | "amount" | "percent";
export interface NumberInputOptions { format?: NumberInputFormat; decimals?: number; grouping?: boolean; allowNegative?: boolean; min?: number; max?: number; suffix?: unknown }
export interface ResolvedNumberInput { format: NumberInputFormat; decimals: number; grouping: boolean; allowNegative: boolean; min?: number; max?: number; suffix?: string; maxIntegerDigits: number }

const presets: Record<NumberInputFormat, { decimals: number; grouping: boolean; allowNegative: boolean; suffix?: string }> = {
  number: { decimals: 0, grouping: true, allowNegative: false },
  amount: { decimals: 0, grouping: true, allowNegative: false },
  percent: { decimals: 1, grouping: false, allowNegative: true, suffix: "%" },
};
const totalDigits = 15;
const finite = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Preset plus the caller's overrides; decimals are cut to a whole 0-6 so the scaled value stays a safe integer. */
export function resolveNumberInput(options: NumberInputOptions): ResolvedNumberInput {
  const format: NumberInputFormat = options.format && options.format in presets ? options.format : "number";
  const preset = presets[format];
  const given = finite(options.decimals);
  const decimals = given === undefined ? preset.decimals : Math.min(6, Math.max(0, Math.trunc(given)));
  return {
    format,
    decimals,
    grouping: options.grouping ?? preset.grouping,
    allowNegative: options.allowNegative ?? preset.allowNegative,
    min: finite(options.min),
    max: finite(options.max),
    suffix: options.suffix === undefined ? preset.suffix : typeof options.suffix === "string" ? options.suffix : undefined,
    maxIntegerDigits: totalDigits - decimals,
  };
}

/** Keeps digits, one ".", and "-" when allowed; any "-" in the text makes the value negative. Returns the draft ("-12.5", "12.", "").
 * A dot with no digits becomes "0." (or "-0.") when decimals are allowed, so ".5" can be typed. */
export function sanitizeNumber(text: string, o: ResolvedNumberInput): string {
  const negative = o.allowNegative && text.includes("-");
  const kept = text.replace(/[^0-9.]/g, "");
  const dot = o.decimals > 0 ? kept.indexOf(".") : -1;
  const rawInt = (dot < 0 ? kept.replace(/\./g, "") : kept.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const int = rawInt.slice(0, o.maxIntegerDigits);
  const frac = dot < 0 ? "" : kept.slice(dot + 1).replace(/\./g, "").slice(0, o.decimals);
  const body = dot < 0 ? int : `${int || "0"}.${frac}`;
  return (negative ? "-" : "") + body;
}

/** Display text: thousands commas only, nothing padded. */
export function formatNumber(raw: string, o: ResolvedNumberInput): string {
  const negative = raw.startsWith("-");
  const [int, frac] = raw.replace("-", "").split(".");
  const grouped = o.grouping ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : int;
  return (negative ? "-" : "") + grouped + (frac === undefined ? "" : "." + frac);
}

/** The value kept on blur/Enter: "" and "-" become "", a bare dot ("0.") is zero, "-0" becomes "0", the fraction is padded to decimals. */
export function commitNumber(raw: string, o: ResolvedNumberInput): string {
  const clean = sanitizeNumber(raw, o);
  if (/^-?\.?$/.test(clean)) return "";
  const negative = clean.startsWith("-");
  const [int, frac = ""] = clean.replace("-", "").split(".");
  const body = o.decimals > 0 ? `${int || "0"}.${frac.padEnd(o.decimals, "0")}` : int || "0";
  return (negative && /[1-9]/.test(body) ? "-" : "") + body;
}

const significant = /[0-9.\-]/;

/** How many digits, "." and "-" sit before the caret. */
export function significantCount(text: string, caret: number): number {
  let count = 0;
  for (let i = 0; i < Math.min(caret, text.length); i++) if (significant.test(text[i])) count++;
  return count;
}

/** The caret position right after that many digits, "." and "-". */
export function caretForCount(display: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < display.length; i++) if (significant.test(display[i]) && ++seen === count) return i + 1;
  return display.length;
}

/** Where the caret sits after an edit that turned `before` into `after`, from the text alone: right after the changed part.
 * Platforms that report the selection separately from the text (React Native) can send the two in either order. */
export function caretAfterEdit(before: string, after: string): number {
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
  let suffix = 0;
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  return Math.max(prefix, after.length - suffix);
}

/** Backspace right after a comma deletes the digit before it, Delete right before one deletes the digit after it. Returns the text without commas and the caret in it; null when the browser's default is right. */
export function deleteAcrossSeparator(display: string, start: number, end: number, key: "Backspace" | "Delete"): { text: string; caret: number } | null {
  if (start !== end) return null;
  const target = key === "Backspace" ? start - 2 : start + 1;
  const comma = key === "Backspace" ? start - 1 : start;
  if (display[comma] !== "," || target < 0 || target >= display.length || !significant.test(display[target])) return null;
  const text = (display.slice(0, target) + display.slice(target + 1)).replace(/,/g, "");
  return { text, caret: significantCount(display, key === "Backspace" ? target : start) };
}

export function rangeIssue(raw: string, o: ResolvedNumberInput): "min" | "max" | null {
  if (raw === "" || raw === "-") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (o.min !== undefined && value < o.min) return "min";
  if (o.max !== undefined && value > o.max) return "max";
  return null;
}

/** "100% 이하로 입력해 주세요": the limit is formatted like the value, with the suffix attached without a space. */
export function rangeMessage(kind: "min" | "max", o: ResolvedNumberInput, scope: KjunMessageScope = defaultMessageScope): string {
  const limit = kind === "min" ? o.min : o.max;
  const text = formatNumber(String(limit ?? ""), o) + (o.suffix ?? "");
  return kind === "min" ? scope.messages.numberRangeMin(text) : scope.messages.numberRangeMax(text);
}

/** "1억 2,003만 5,000 원" for an integer part of 10,000 or more; empty for percent and for languages other than Korean. */
export function readingAid(raw: string, o: ResolvedNumberInput, scope: KjunMessageScope = defaultMessageScope): string {
  if (o.format === "percent" || (scope.language ?? "ko") !== "ko") return "";
  const int = Math.abs(Math.trunc(Number(raw.split(".")[0])));
  if (!Number.isFinite(int) || int < 10000) return "";
  const group = (n: number) => n.toLocaleString("en-US");
  const parts = [
    Math.floor(int / 1e8) && group(Math.floor(int / 1e8)) + scope.messages.numberUnitEok,
    Math.floor((int % 1e8) / 1e4) && group(Math.floor((int % 1e8) / 1e4)) + scope.messages.numberUnitMan,
    int % 1e4 && group(int % 1e4),
  ].filter(Boolean);
  return (raw.startsWith("-") ? "-" : "") + parts.join(" ") + (o.suffix ? " " + o.suffix : "");
}

export function numberKeyboard(o: ResolvedNumberInput): { inputMode: "numeric" | "decimal" | "text"; ios: string; android: string } {
  if (o.allowNegative) return { inputMode: "text", ios: "numbers-and-punctuation", android: "numeric" };
  if (o.decimals > 0) return { inputMode: "decimal", ios: "decimal-pad", android: "decimal-pad" };
  return { inputMode: "numeric", ios: "number-pad", android: "number-pad" };
}
