// Framework-free KjunSplitPane rules shared by React, Vue and Native: the first pane's allowed size, ratio and pixel
// conversion, pointer positions, keys and collapsing. With sizeUnit "ratio" sizes are the first pane's share (0–1) of
// the room left beside the handle; with "px" they are the first pane's pixels.
import { tokens } from "@kjun-ui/tokens";

export type SplitDirection = "horizontal" | "vertical";
export type SplitMin = readonly [number, number];
export type SplitMax = readonly [number | null, number | null];
export interface SplitLimits { low: number; high: number }
export type SplitKeyAction = "decrease" | "increase" | "min" | "max" | "reset";
export type SplitUnit = "ratio" | "px";

/** Pixels one arrow key press moves the handle. */
export const SPLIT_KEY_STEP: number = tokens.extensions.splitPane.keyStep;
/** Two presses on the handle this close in time, and this close in place, are a double press that restores the default size. */
export const SPLIT_DOUBLE_PRESS_MS = 300;
export const SPLIT_PRESS_SLOP = 10;

const room = (total: number, handle: number) => Math.max(0, total - handle);

/**
 * The first pane's allowed pixels. Minimums beat maximums, and when the container is narrower than both minimums the
 * first pane keeps its minimum (or all the room, if even that does not fit), so panes never overlap or go negative.
 */
export function splitLimits(total: number, handle: number, min: SplitMin = [0, 0], max: SplitMax = [null, null]): SplitLimits {
  const space = room(total, handle);
  const low = Math.min(space, Math.max(0, min[0], max[1] == null ? 0 : space - max[1]));
  const high = Math.min(max[0] ?? space, space - Math.max(0, min[1]));
  return { low, high: Math.max(low, high) };
}

export function splitClamp(px: number, limits: SplitLimits) {
  return Number.isFinite(px) ? Math.min(limits.high, Math.max(limits.low, px)) : limits.low;
}

export function splitFromRatio(ratio: number, total: number, handle: number) {
  return ratio * room(total, handle);
}

/** Four decimals: enough for a pixel on any screen, and stable to store. */
export function splitToRatio(px: number, total: number, handle: number) {
  const space = room(total, handle);
  return space > 0 ? Math.round(px / space * 10000) / 10000 : 0;
}

/** The wanted ratio as the first pane's pixels inside the limits. */
export function splitResolve(ratio: number, total: number, handle: number, min?: SplitMin, max?: SplitMax) {
  return splitClamp(splitFromRatio(ratio, total, handle), splitLimits(total, handle, min, max));
}

/** A whole percent for aria-valuenow, aria-valuemin and aria-valuemax. */
export function splitPercent(px: number, total: number, handle: number) {
  return Math.round(splitToRatio(px, total, handle) * 100);
}

/**
 * The first pane's pixels during a drag: where it started plus how far the pointer has moved. scale is layout pixels
 * per viewport pixel (1 unless an ancestor is transformed), and right to left the pane grows as the pointer moves left.
 */
export function splitDrag(startPx: number, startPointer: number, pointer: number, scale: number, rtl: boolean | undefined) {
  const moved = (pointer - startPointer) * (Number.isFinite(scale) && scale > 0 ? scale : 1);
  return startPx + (rtl ? -moved : moved);
}

/** A usable share: a missing or non-finite size falls back, and the rest is kept inside 0–1. */
export function splitShare(size: number | undefined, fallback = 0.5) {
  const value = Number.isFinite(size) ? size as number : Number.isFinite(fallback) ? fallback : 0.5;
  return Math.min(1, Math.max(0, value));
}

/** Browser shortcuts (Alt+Left, Ctrl+Home) keep their meaning on a focused handle. */
export function splitKeyHeld(event: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) {
  return !!(event.altKey || event.ctrlKey || event.metaKey);
}

/** rtl is read by truth: Native Web has no reading direction to report and passes undefined. */
export function splitKeyAction(key: string, direction: SplitDirection, rtl: boolean | undefined): SplitKeyAction | null {
  if (key === "Home") return "min";
  if (key === "End") return "max";
  if (key === "Enter") return "reset";
  if (direction === "vertical") return key === "ArrowUp" ? "decrease" : key === "ArrowDown" ? "increase" : null;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return null;
  return (key === "ArrowLeft") === !rtl ? "decrease" : "increase";
}

/** The first pane's pixels after a key action; resetPx is the default size in pixels. */
export function splitKeyTarget(action: SplitKeyAction, px: number, limits: SplitLimits, resetPx: number) {
  if (action === "min") return limits.low;
  if (action === "max") return limits.high;
  if (action === "reset") return splitClamp(resetPx, limits);
  return splitClamp(px + (action === "increase" ? SPLIT_KEY_STEP : -SPLIT_KEY_STEP), limits);
}

/**
 * The wanted size in its unit. A ratio falls back to the default share (or one half); pixels fall back to the default
 * pixels, or to null when there is none, which means half the room once the split is measured.
 */
export function splitWanted(size: number | undefined, fallback: number | undefined, unit: SplitUnit): number | null {
  if (unit === "ratio") return splitShare(size, fallback ?? 0.5);
  const usable = (value: number | undefined) => value !== undefined && Number.isFinite(value);
  return usable(size) ? Math.max(0, size as number) : usable(fallback) ? Math.max(0, fallback as number) : null;
}

/** The first pane's pixels for a wanted size, before the limits. */
export function splitWantedPx(value: number | null, unit: SplitUnit, total: number, handle: number) {
  const space = room(total, handle);
  return value === null ? space / 2 : unit === "px" ? value : value * space;
}

/** The size reported to the app: a ratio with four decimals, or whole pixels. */
export function splitReport(px: number, unit: SplitUnit, total: number, handle: number) {
  return unit === "px" ? Math.round(Math.max(0, px)) : splitToRatio(px, total, handle);
}

/** A collapsed first pane's pixels: collapsedSize, never past the room. */
export function splitFoldedPx(collapsedSize: number | undefined, total: number, handle: number) {
  const size = collapsedSize !== undefined && Number.isFinite(collapsedSize) ? Math.max(0, collapsedSize) : 0;
  return Math.min(size, room(total, handle));
}

/**
 * While dragging a collapsible pane: the pointer collapses it once it passes the midpoint between the collapsed size
 * and the pane's smallest open size, and opens it again on the way back.
 */
export function splitCollapseAt(px: number, low: number, folded: number) {
  return px < (Math.max(low, folded) + folded) / 2;
}

/**
 * What a key does to a collapsible pane, as in the window-splitter pattern: Enter toggles it, Home collapses it, and
 * from collapsed an increase restores the size it had while End opens it to the largest size. move says whether the
 * key then moves the handle as on a pane that does not collapse.
 */
export function splitKeyCollapse(action: SplitKeyAction, collapsible: boolean, collapsed: boolean): { collapse: boolean | null; move: boolean } {
  if (!collapsible) return { collapse: null, move: true };
  if (action === "reset") return { collapse: !collapsed, move: false };
  if (!collapsed) return action === "min" ? { collapse: true, move: false } : { collapse: null, move: true };
  if (action === "increase") return { collapse: false, move: false };
  if (action === "max") return { collapse: false, move: true };
  return { collapse: null, move: false };
}

/** A second press within the double-press time and slop of the first. */
export function splitDoublePress(previous: { at: number; x: number; y: number } | null, now: { at: number; x: number; y: number }) {
  return !!previous && now.at - previous.at <= SPLIT_DOUBLE_PRESS_MS &&
    Math.abs(now.x - previous.x) <= SPLIT_PRESS_SLOP && Math.abs(now.y - previous.y) <= SPLIT_PRESS_SLOP;
}
