import { tokens } from "@kjun-ui/tokens";

export type ProgressCircleSize = "sm" | "md" | "lg";

/** Circle progress geometry: the arc is a dashed stroke whose visible length is the percentage of the circumference. */
export function progressCircle(size: ProgressCircleSize, percentage: number) {
  const { size: diameter, stroke } = tokens.extensions.progress.circle[size];
  const radius = (diameter - stroke) / 2, circumference = 2 * Math.PI * radius;
  return { diameter, stroke, radius, centre: diameter / 2, circumference, offset: circumference * (1 - percentage / 100),
    // Small circles are too narrow for the centre percentage; screen readers still get the value.
    showsPercentage: size !== "sm" };
}

/**
 * What a progress value means: indeterminate work wins, then a null, non-finite value or an invalid max is
 * missing data (never 0%). An omitted value keeps the 0 default before it reaches here.
 */
export function progressState(value: number | null, max: number, indeterminate: boolean): "indeterminate" | "missing" | "determinate" {
  if (indeterminate) return "indeterminate";
  return value === null || !Number.isFinite(value) || !Number.isFinite(max) || max <= 0 ? "missing" : "determinate";
}
