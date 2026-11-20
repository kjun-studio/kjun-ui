import type { KjunMessageScope } from "./messages";
import { defaultMessageScope } from "./messages";

export type NumberInputFormat = "number" | "amount" | "percent";
export interface NumberInputOptions { format?: NumberInputFormat; decimals?: number; grouping?: boolean; allowNegative?: boolean; min?: number; max?: number; suffix?: unknown;
  /** Unit the committed value lands on, counted from `min` (or 0); ArrowUp/ArrowDown move by it. */
  step?: number }
export interface ResolvedNumberInput { format: NumberInputFormat; decimals: number; grouping: boolean; allowNegative: boolean; min?: number; max?: number; suffix?: string; maxIntegerDigits: number;
  /** A positive step rounded to `decimals`; undefined when not given or when it rounds to 0. */
  step?: number }

const presets: Record<NumberInputFormat, { decimals: number; grouping: boolean; allowNegative: boolean; suffix?: string }> = {
  number: { decimals: 0, grouping: true, allowNegative: false },
  amount: { decimals: 0, grouping: true, allowNegative: false },
  percent: { decimals: 1, grouping: false, allowNegative: true, suffix: "%" },
};
const totalDigits = 15;
const finite = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Preset plus the caller's overrides; decimals are cut to a whole 0-6 so the scaled value stays a safe integer. */
export function resolveNumberInput(options: NumberInputOptions): ResolvedNumberInput {
  const format: NumberInputFormat = options.format && Object.prototype.hasOwnProperty.call(presets, options.format) ? options.format : "number";
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
    step: resolveStep(finite(options.step), decimals),
  };
}

function resolveStep(step: number | undefined, decimals: number): number | undefined {
  if (step === undefined || step <= 0) return undefined;
  const rounded = Number(step.toFixed(decimals));
  return rounded > 0 ? rounded : undefined;
}

/** The value written with `decimals` digits, "-0" dropped: the committed form. */
function written(value: number, o: ResolvedNumberInput): string {
  const text = value.toFixed(o.decimals);
  return /^-0(\.0*)?$/.test(text) ? text.slice(1) : text;
}
const stepBase = (o: ResolvedNumberInput) => o.min ?? 0;

/** A committed value moved to the nearest multiple of step from `min` (or 0); one that cannot be negative goes up a step instead.
 * The range is not enforced: a value past min/max stays past it and shows the range message. No step, or "", returns `raw`. */
export function snapNumber(raw: string, o: ResolvedNumberInput): string {
  const value = Number(raw);
  if (o.step === undefined || raw === "" || !Number.isFinite(value)) return raw;
  const base = stepBase(o);
  let snapped = base + Math.round((value - base) / o.step) * o.step;
  if (!o.allowNegative && snapped < 0) snapped += o.step;
  return written(snapped, o);
}

/** ArrowUp (1) / ArrowDown (-1): the next multiple of step from `min` (or 0) in that direction, kept within min/max (and 0 when the
 * value cannot be negative). An empty field starts at `min`, or 0 kept within range. Null when there is no step. */
export function stepNumber(raw: string, direction: 1 | -1, o: ResolvedNumberInput): string | null {
  if (o.step === undefined) return null;
  const base = stepBase(o), value = Number(raw);
  const empty = /^-?\.?$/.test(raw) || !Number.isFinite(value);
  let next: number;
  if (empty) next = base;
  else {
    const units = (value - base) / o.step, near = Math.round(units);
    // A value on the grid (within float noise) moves a whole step; one between points moves to the next point that way.
    const onGrid = Math.abs(units - near) < 1e-9;
    next = base + (onGrid ? near + direction : direction > 0 ? Math.ceil(units) : Math.floor(units)) * o.step;
  }
  const low = o.allowNegative ? o.min : Math.max(o.min ?? 0, 0);
  if (o.max !== undefined && next > o.max) next = o.max;
  if (low !== undefined && next < low) next = low;
  return written(next, o);
}

export interface SanitizeOptions {
  /** Pasted or dropped text: with no decimals allowed, the fraction is dropped at the first "." ("1,234,000.00" → "1234000") instead of the dots being ignored. */
  pasted?: boolean;
}
// "-", the minus sign U+2212 and the en dash U+2013 all read as minus.
const minus = /[-\u2212\u2013]/;
function parts(text: string, o: ResolvedNumberInput, options: SanitizeOptions) {
  const negative = o.allowNegative && minus.test(text);
  let kept = text.replace(/[^0-9.]/g, "");
  if (options.pasted && o.decimals === 0 && kept.includes(".")) kept = kept.slice(0, kept.indexOf("."));
  const dot = o.decimals > 0 ? kept.indexOf(".") : -1;
  const int = (dot < 0 ? kept.replace(/\./g, "") : kept.slice(0, dot)).replace(/^0+(?=\d)/, "");
  const frac = dot < 0 ? "" : kept.slice(dot + 1).replace(/\./g, "").slice(0, o.decimals);
  return { negative, int, frac, dot };
}

/** Keeps digits, one ".", and "-" when allowed; any "-" in the text makes the value negative. Returns the draft ("-12.5", "12.", "").
 * A dot with no digits becomes "0." (or "-0.") when decimals are allowed, so ".5" can be typed. Integer digits past the limit are cut. */
export function sanitizeNumber(text: string, o: ResolvedNumberInput, options: SanitizeOptions = {}): string {
  const { negative, int: rawInt, frac, dot } = parts(text, o, options);
  const int = rawInt.slice(0, o.maxIntegerDigits);
  const body = dot < 0 ? int : `${int || "0"}.${frac}`;
  return (negative ? "-" : "") + body;
}

/** True when `next` holds more integer digits than the field keeps and more than `previous` did: a typed edit like that is refused, not cut. */
export function addsTooManyDigits(previous: string, next: string, o: ResolvedNumberInput): boolean {
  const count = parts(next, o, {}).int.length;
  return count > o.maxIntegerDigits && count > parts(previous, o, {}).int.length;
}

/** An edit that inserted more than one character at once, or that the browser reports as a paste or drop. */
export function isPasteEdit(before: string, after: string, inputType?: string): boolean {
  return inputType === "insertFromPaste" || inputType === "insertFromDrop" || after.length - before.length > 1;
}

/** Whether two values name the same number: "12." and "12" do, "", "-" and "." are all empty, "" and "0" are not. */
export function sameNumber(a: string, b: string): boolean {
  const empty = (s: string) => /^-?\.?$/.test(s);
  if (empty(a) || empty(b)) return empty(a) && empty(b);
  return Number(a) === Number(b);
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

/** Keyboard for a number field. A negative value needs a minus key, which the numeric pads lack (iOS shows none at all). */
export function numberKeyboard(o: Pick<ResolvedNumberInput, "allowNegative" | "decimals">): { inputMode: "numeric" | "decimal" | "text"; ios: string; android: string } {
  if (o.allowNegative) return { inputMode: "text", ios: "numbers-and-punctuation", android: "numeric" };
  if (o.decimals > 0) return { inputMode: "decimal", ios: "decimal-pad", android: "decimal-pad" };
  return { inputMode: "numeric", ios: "number-pad", android: "number-pad" };
}
