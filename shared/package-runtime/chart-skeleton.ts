// Platform-free geometry for KjunChartSkeleton; rendering stays in each package.
export type KjunChartSkeletonKind = "frame" | "donut" | "matrix";

/** Axes plus three horizontal grid lines in the frame's 600×240 viewBox. */
export const chartFrameViewBox = "0 0 600 240";
export const chartFramePath = "M20 10V220H590 M20 65H590 M20 120H590 M20 175H590";

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
