// Platform-free geometry for KjunChartSkeleton; rendering stays in each package.
export type KjunChartSkeletonKind = "frame" | "donut" | "matrix";

/** Axes plus three horizontal grid lines in the frame's 600×240 viewBox. */
export const chartFrameViewBox = "0 0 600 240";
export const chartFramePath = "M20 10V220H590 M20 65H590 M20 120H590 M20 175H590";

/** Matrix rows and columns: finite values floor to at least 1; anything else is 1. */
export function chartSkeletonCount(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

/** Every third diagonal cell is drawn at the pending opacity so the matrix reads as a heatmap. */
export function chartMatrixMuted(row: number, column: number) {
  return (row + column + 2) % 3 === 0;
}

/** Inner diameter of the donut ring, which is 80% of the skeleton height. */
export function chartDonutHole(height: number, thickness: number) {
  return Math.max(0, height * 0.8 - 2 * thickness);
}
