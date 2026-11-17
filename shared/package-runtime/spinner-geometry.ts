import { tokens } from "@kjun-ui/tokens";

export type SpinnerSize = keyof typeof tokens.extensions.spinner.sizes;

// One loading glyph for every component: a track ring and a quarter arc with round ends.
// The arc keeps the md stroke-to-diameter ratio at any pixel size, so a 20px button loader
// weighs the same as a 24px spinner.
export const spinnerCircle = { cx: 12, cy: 12, r: 10 } as const;
export const spinnerArc = "M22 12A10 10 0 0 0 12 2";
const viewBox = 24;
const ratio = tokens.extensions.spinner.strokeWidths.md / tokens.extensions.spinner.sizes.md;

/** Stroke in the 24-unit viewBox for a glyph drawn at `size` pixels; `strokePx` overrides the ratio. */
export function spinnerStroke(size: number, strokePx = size * ratio) {
  return (strokePx * viewBox) / size;
}

/** Stroke for a named spinner size, from the size table. */
export function spinnerSizeStroke(size: SpinnerSize) {
  return spinnerStroke(tokens.extensions.spinner.sizes[size], tokens.extensions.spinner.strokeWidths[size]);
}

/** Large spinners put their text below the ring; the small ones keep it beside. */
export function spinnerStacked(size: SpinnerSize) {
  return size === "lg" || size === "xl";
}
