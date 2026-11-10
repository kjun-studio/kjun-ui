import { normalizeColor } from "./color";
import { colorSwatchColumns, hexDraft, hexWithAlpha, normalizeSwatches, type ColorSwatchInput } from "./color-picker";

// KjunColorPicker rules every platform shares beyond the HSV state: when a pick commits, the hex and % fields,
// recent colors, the screen eyedropper and the screen reader actions of the area.

/** One pick that may span many changes (a drag, typing in a field). begin remembers the value once; end says whether it moved. */
export function createCommitSession(read: () => string | null) {
  let start: string | null | undefined;
  return {
    begin() { if (start === undefined) start = read(); },
    end(): boolean {
      if (start === undefined) return false;
      const changed = read() !== start;
      start = undefined;
      return changed;
    },
  };
}

/** #RRGGBB of a value. */
export const colorRgb = (value: string) => value.slice(0, 7);
/** The AA of a value, FF when it has none. */
export const colorAlphaHex = (value: string | null) => value && value.length === 9 ? value.slice(7, 9) : "FF";
/** 0–100 opacity as two hex digits. */
export const alphaPercentHex = (percent: number) => Math.round(percent / 100 * 255).toString(16).toUpperCase().padStart(2, "0");
const validPercent = (text: string) => /^\d{1,3}$/.test(text.trim()) && Number(text) <= 100;

/** What the hex field shows: six digits without #. */
export const hexFieldText = (value: string | null) => value ? value.slice(1, 7) : "";
/** A change while typing in the hex field: only a complete code (6 digits, or 8 with alpha); 6 digits keep the current opacity. */
export function hexFieldLive(text: string, alpha: boolean, value: string | null): string | null {
  const t = text.trim().replace(/^#/, "");
  return hexDraft(alpha && t.length === 6 ? t + colorAlphaHex(value) : t, alpha).live;
}
/** Enter or leaving the hex field: the value to keep, or "revert". A short code expands; empty is null only when clearable. */
export function hexFieldCommit(text: string, alpha: boolean, value: string | null, clearable: boolean): string | null | "revert" {
  const draft = hexDraft(hexWithAlpha(text, alpha, colorAlphaHex(value)), alpha);
  return draft.commit === "revert" || (draft.commit === null && !clearable) ? "revert" : draft.commit;
}
/** A change while typing in the % field: a whole 0–100 on a color. */
export const alphaFieldLive = (text: string, value: string | null) => value && validPercent(text) ? colorRgb(value) + alphaPercentHex(Number(text)) : null;

/** Recent colors fill one swatch row. */
export const recentColorLimit = colorSwatchColumns;
const uniqueColors = (list: ColorSwatchInput[] | undefined, alpha: boolean) =>
  normalizeSwatches(list ?? [], alpha).filter((item, index, all) => all.findIndex(other => other.value === item.value) === index);
/** The recent row: invalid entries, repeats and colors the swatches already offer left out, at most one row.
 * Only the row hides them; the app's list keeps every color. */
export const recentColorItems = (list: ColorSwatchInput[] | undefined, alpha: boolean, swatches: { value: string }[] = []) =>
  uniqueColors(list, alpha).filter(item => !swatches.some(swatch => swatch.value === item.value)).slice(0, recentColorLimit);
const recentColorValues = (list: ColorSwatchInput[] | undefined, alpha: boolean) => uniqueColors(list, alpha).slice(0, recentColorLimit).map(item => item.value);
/** The list after the panel closes on a new value: that value first, once, at most one row; null if nothing changes. */
export function nextRecentColors(list: ColorSwatchInput[] | undefined, value: string | null, alpha: boolean): string[] | null {
  if (value === null) return null;
  const current = recentColorValues(list, alpha), next = [value, ...current.filter(item => item !== value)].slice(0, recentColorLimit);
  return next.length === current.length && next.every((item, index) => item === current[index]) ? null : next;
}

type EyeDropperWindow = { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } };
const screen = () => typeof window === "undefined" ? undefined : (window as unknown as EyeDropperWindow).EyeDropper;
/** The browser's EyeDropper (Chromium desktop). Elsewhere the picker draws no eyedropper button. */
export const eyeDropperSupported = () => typeof screen() === "function";
/** Opens the screen eyedropper; resolves the color as #RRGGBB (the current opacity kept with alpha), or null when cancelled. */
export async function pickScreenColor(alpha: boolean, value: string | null): Promise<string | null> {
  const EyeDropper = screen();
  if (!EyeDropper) return null;
  try {
    const picked = normalizeColor((await new EyeDropper().open()).sRGBHex, false);
    return picked && alpha ? picked + colorAlphaHex(value) : picked;
  } catch {
    return null;
  }
}

/** Screen reader actions of the area: swipe up/down moves saturation; named actions move brightness (Native devices have no arrow keys). */
export function colorAreaActions(m: { increaseSaturation: string; decreaseSaturation: string; increaseBrightness: string; decreaseBrightness: string }) {
  return [
    { name: "increment", label: m.increaseSaturation }, { name: "decrement", label: m.decreaseSaturation },
    { name: "increaseBrightness", label: m.increaseBrightness }, { name: "decreaseBrightness", label: m.decreaseBrightness },
  ];
}
const areaActionKeys: Record<string, string> = { increment: "ArrowRight", decrement: "ArrowLeft", increaseBrightness: "ArrowUp", decreaseBrightness: "ArrowDown" };
/** The key an area action stands for, so it moves exactly like the keyboard. */
export const colorAreaActionKey = (name: string): string | null => areaActionKeys[name] ?? null;
