/** Percentage boundaries of a deviation's visual step, shared by every platform and by apps counting the same steps. */
export const deviationThresholds = { neutral: 0.1, medium: 0.5, strong: 1 } as const;
export type DeviationLevel = "neutral" | "low" | "medium" | "strong";
/** Neutral below 0.1%, then low (under 0.5%), medium (under 1%) and strong; the sign does not matter. */
export function deviationLevel(value: number): DeviationLevel {
  const abs = Math.abs(value);
  return abs < deviationThresholds.neutral ? "neutral" : abs < deviationThresholds.medium ? "low"
    : abs < deviationThresholds.strong ? "medium" : "strong";
}
