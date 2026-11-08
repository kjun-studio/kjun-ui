import { formatColor, hsvToRgb, normalizeColor, parseColor, rgbToHsv, type Hsv } from "./color";

// KjunColorPicker state shared by every platform: the HSV the user is moving, key steps, the hex field and swatches.
export type PickerState = { hsv: Hsv; a: number };
export const initialPickerState: PickerState = { hsv: { h: 0, s: 1, v: 1 }, a: 1 };

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

/** The hex field: live only once all 6 (or 8 with alpha) digits are typed, so "3B8" never jumps to #33BB88 mid-typing; commit expands short forms. */
export function hexDraft(text: string, alpha: boolean): { live: string | null; commit: string | null | "revert" } {
  const t = text.trim().replace(/^#/, "");
  if (!t) return { live: null, commit: null };
  const commit = normalizeColor(t, alpha);
  if (commit === null) return { live: null, commit: "revert" };
  return { live: t.length === 6 || (alpha && t.length === 8) ? commit : null, commit };
}

export type ColorSwatchInput = string | { value: string; label?: string };
export function normalizeSwatches(list: unknown[], alpha: boolean): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  let dropped = false;
  for (const item of list ?? []) {
    const raw = typeof item === "object" && item ? (item as { value?: unknown }).value : item;
    const value = normalizeColor(raw, alpha);
    if (value === null) { dropped = true; continue; }
    const label = typeof item === "object" && item && typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label : value;
    out.push({ value, label });
  }
  if (dropped) warnColorPicker("swatches has entries that are not hex colors; they are left out.");
  return out;
}

export function initialFocus(o: { selectedSwatch: boolean; custom: boolean; input: boolean }): "swatch" | "area" | "hex" | "first-swatch" {
  return o.selectedSwatch ? "swatch" : o.custom ? "area" : o.input ? "hex" : "first-swatch";
}
