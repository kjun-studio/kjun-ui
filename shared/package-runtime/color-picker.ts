import { formatColor, hsvToRgb, normalizeColor, parseColor, rgbToHsv, type Hsv } from "./color";

// KjunColorPicker state shared by every platform: the HSV the user is moving, key steps, the hex field and swatches.
export type PickerState = { hsv: Hsv; a: number };
export const initialPickerState: PickerState = { hsv: { h: 0, s: 1, v: 1 }, a: 1 };
/** Swatches take this many fixed columns (web CSS repeat(8); Native divides the measured width). */
export const colorSwatchColumns = 8;
/** Square swatch size for a row of `width` with `gap` between the fixed columns. */
export const colorSwatchSize = (width: number, gap: number) => (width - (colorSwatchColumns - 1) * gap) / colorSwatchColumns;

declare const process: { env: { NODE_ENV?: string } };
const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
export function warnColorPicker(message: string) {
  if (developmentMode()) console.warn("[KJUN] KjunColorPicker: " + message);
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export function stateToValue(s: PickerState, alpha: boolean): string {
  return formatColor(hsvToRgb(s.hsv, s.a), alpha);
}

/** Follows an outside value without losing hue or saturation: a value that the current HSV already draws keeps it, and null keeps the last state. */
export function syncHsv(prev: PickerState, value: string | null, alpha: boolean): PickerState {
  const v = normalizeColor(value, alpha);
  if (v === null || v === stateToValue(prev, alpha)) return prev;
  const c = parseColor(v)!;
  // Only the opacity moved (the % field, or a parent changing AA): keep hue and saturation, which a gray or black would lose.
  if (formatColor({ ...c, a: 1 }, false) === stateToValue(prev, false)) return { hsv: prev.hsv, a: alpha ? c.a : 1 };
  return { hsv: rgbToHsv(c), a: alpha ? c.a : 1 };
}

/** Arrows move saturation (left/right) and brightness (up/down) 1%, 10% with Shift; Home/End set saturation, PageUp/PageDown brightness. */
export function colorAreaKey(key: string, shift: boolean, hsv: Hsv): Hsv | null {
  const step = shift ? 0.1 : 0.01;
  const s = (n: number) => ({ ...hsv, s: round2(clamp01(n)) }), v = (n: number) => ({ ...hsv, v: round2(clamp01(n)) });
  switch (key) {
    case "ArrowRight": return s(hsv.s + step);
    case "ArrowLeft": return s(hsv.s - step);
    case "ArrowUp": return v(hsv.v + step);
    case "ArrowDown": return v(hsv.v - step);
    case "Home": return s(0);
    case "End": return s(1);
    case "PageUp": return v(hsv.v + 0.1);
    case "PageDown": return v(hsv.v - 0.1);
    default: return null;
  }
}

/** One step of a hue (0–360) or alpha (0–100) slider. */
export function channelKey(key: string, shift: boolean, value: number, max: number): number | null {
  const step = shift ? 10 : 1, at = (n: number) => Math.min(max, Math.max(0, Math.round(n)));
  switch (key) {
    case "ArrowRight": case "ArrowUp": return at(value + step);
    case "ArrowLeft": case "ArrowDown": return at(value - step);
    case "PageUp": return at(value + 10);
    case "PageDown": return at(value - 10);
    case "Home": return 0;
    case "End": return max;
    default: return null;
  }
}

/** With alpha on, a 3- or 6-digit code keeps the current opacity (AA) instead of resetting it to 100%. Other text passes through. */
export function hexWithAlpha(text: string, alpha: boolean, currentAlpha: string): string {
  const t = text.trim().replace(/^#/, "");
  if (!alpha || (t.length !== 3 && t.length !== 6)) return t;
  const six = normalizeColor(t, false);
  return six ? six.slice(1) + currentAlpha : t;
}

/** The hex field: live only once all 6 (or 8 with alpha) digits are typed, so "3B8" never jumps to #33BB88 mid-typing; commit expands short forms. */
export function hexDraft(text: string, alpha: boolean): { live: string | null; commit: string | null | "revert" } {
  const t = text.trim().replace(/^#/, "");
  if (!t) return { live: null, commit: null };
  const commit = normalizeColor(t, alpha);
  if (commit === null) return { live: null, commit: "revert" };
  return { live: t.length === 6 || (alpha && t.length === 8) ? commit : null, commit };
}

export type ColorSwatchInput = string | { value: string; label?: string };
const swatchValue = (item: unknown) => typeof item === "object" && item ? (item as { value?: unknown }).value : item;
/** How many swatches are not hex colors; the picker warns once about them (normalizing runs on every render and stays quiet). */
export function invalidSwatchCount(list: unknown[]): number {
  return (list ?? []).filter(item => normalizeColor(swatchValue(item), false) === null).length;
}
export function normalizeSwatches(list: unknown[], alpha: boolean): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (const item of list ?? []) {
    const value = normalizeColor(swatchValue(item), alpha);
    if (value === null) continue;
    const label = typeof item === "object" && item && typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label : value;
    out.push({ value, label });
  }
  return out;
}

export function initialFocus(o: { selectedSwatch: boolean; custom: boolean; input: boolean }): "swatch" | "area" | "hex" | "first-swatch" {
  return o.selectedSwatch ? "swatch" : o.custom ? "area" : o.input ? "hex" : "first-swatch";
}
/** The control the panel focuses when it opens, from the elements each platform registered. */
export function initialFocusTarget<T>(targets: { swatches: (T | null)[]; area: T | null; hex: T | null }, o: { selected: number; custom: boolean; input: boolean }): T | null {
  const where = initialFocus({ selectedSwatch: o.selected >= 0, custom: o.custom, input: o.input });
  return (where === "swatch" ? targets.swatches[o.selected] : where === "area" ? targets.area : where === "hex" ? targets.hex : targets.swatches[0]) ?? null;
}

/** The swatch row's items: "no color" first when clearable. */
export const swatchItems = (swatches: { value: string; label: string }[], clearable: boolean, noneLabel: string) =>
  [...(clearable ? [{ value: null as string | null, label: noneLabel }] : []), ...swatches];
/** Which item of swatchItems the value selects, or -1. */
export function selectedSwatchIndex(value: string | null, swatches: { value: string }[], clearable: boolean): number {
  const at = value === null ? -1 : swatches.findIndex(s => s.value === value);
  return clearable ? (value === null ? 0 : at < 0 ? -1 : at + 1) : at;
}

/** What the trigger shows and says: #RRGGBB, the opacity % with alpha, and the spoken value. */
export function pickerSummary(value: string | null, alpha: boolean, m: { colorValue: (hex: string, alpha?: number) => string; colorNone: string }) {
  const hex = value ? value.slice(0, 7) : "", percent = value && alpha ? Math.round(parseColor(value)!.a * 100) : undefined;
  return { hex, percent, opacity: percent === undefined ? 1 : percent / 100, spoken: value ? m.colorValue(hex, percent) : m.colorNone };
}

/** Development warnings, each said once per picker. */
export function createPickerWarnings() {
  const said = new Set<string>();
  const once = (key: string, message: string) => { if (!said.has(key)) { said.add(key); warnColorPicker(message); } };
  return (o: { raw: unknown; alpha: boolean; swatches: unknown[] | undefined; nothing: boolean }) => {
    if (!o.alpha && typeof o.raw === "string" && parseColor(o.raw) && /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(o.raw.trim()))
      once("alpha", "the value has alpha but alpha is off; it is drawn and reported without it.");
    if (invalidSwatchCount(o.swatches ?? []) > 0) once("swatches", "swatches has entries that are not hex colors; they are left out.");
    if (o.nothing) once("nothing", "turn on custom, input or clearable, or give swatches; showing the hex field.");
  };
}
