// Platform-free geometry for KjunChartSkeleton; rendering stays in each package.
export type KjunChartSkeletonKind = "frame" | "donut" | "matrix";

/**
 * The frame follows the app's chart layout: horizontal grid lines, x-axis ticks and the y-axis label width.
 * KJUN cannot know where the real chart puts them, so the app passes its own values; these are common defaults.
 */
export const chartFrameDefaults = { gridLines: 5, xTicks: 6 };

/** Evenly spaced positions from 0 to 1 for at least two marks (grid lines or ticks). */
export function chartFrameStops(count: number) {
  const n = Math.max(2, chartSkeletonCount(count));
  return Array.from({ length: n }, (_, i) => i / (n - 1));
}

/** A tick label centres on its tick, except at the ends where it stays inside the plot (percent of its width). */
export function chartTickShift(stop: number) {
  return stop <= 0 ? 0 : stop >= 1 ? -100 : -50;
}

/** Grid lines in a 0 0 100 100 viewBox, drawn with non-scaling strokes over the plot area. */
export const chartFrameViewBox = "0 0 100 100";
export function chartFramePath(gridLines: number) {
  return chartFrameStops(gridLines).map((f) => `M0 ${f * 100}H100`).join(" ");
}

/** Upper bound for matrix rows and columns, so counts derived from data never render an unbounded grid. */
export const chartSkeletonMaxCount = 100;

/** Matrix rows and columns: finite values floor into 1–100; anything else is 1. */
export function chartSkeletonCount(value: number) {
  return Number.isFinite(value) ? Math.min(chartSkeletonMaxCount, Math.max(1, Math.floor(value))) : 1;
}

/** Every third diagonal cell is drawn at the pending opacity so the matrix reads as a heatmap. */
export function chartMatrixMuted(row: number, column: number) {
  return (row + column + 2) % 3 === 0;
}

/** Donut ring diameter as a share of the skeleton height; data-state.css repeats it as 80% and 80cqh. */
export const chartDonutRatio = 0.8;

/** Inner diameter of the donut ring. */
export function chartDonutHole(height: number, thickness: number) {
  return Math.max(0, height * chartDonutRatio - 2 * thickness);
}

/** Kinds removed in 0.8.0 (line, bar, candle, grid) or any other value draw, and are named, frame. */
export function chartSkeletonKind(kind: unknown): KjunChartSkeletonKind {
  return kind === "donut" || kind === "matrix" ? kind : "frame";
}
