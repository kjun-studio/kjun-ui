// Shared by the Vue 3, React and Native KjunSteps: each step's status from `current`, and when the row folds to compact.
export type KjunStepStatus = "complete" | "current" | "error" | "upcoming";
export type KjunStepsCurrentStatus = "active" | "error";
export type KjunStepsLayout = "auto" | "full" | "compact";

export interface KjunStepItem {
  key?: string | number;
  label: string;
  description?: string;
  meta?: string;
}

/** Narrowest column a step gets in the wide layout; mirrors `extensions.steps.minColumn`. */
export const STEPS_MIN_COLUMN = 80;
/** More steps than this always fold to compact. */
export const STEPS_AUTO_MAX = 10;

/** `current` counts finished steps: floored and kept within 0..count (count means all complete). */
export function clampCurrent(current: number, count: number): number {
  if (!Number.isFinite(current)) return 0;
  return Math.min(Math.max(0, count), Math.max(0, Math.floor(current)));
}

export function stepStatus(index: number, current: number, currentStatus: KjunStepsCurrentStatus): KjunStepStatus {
  if (index < current) return "complete";
  if (index === current) return currentStatus === "error" ? "error" : "current";
  return "upcoming";
}

export function stepsRootStatus(
  current: number,
  count: number,
  currentStatus: KjunStepsCurrentStatus,
): "current" | "error" | "complete" {
  if (current >= count) return "complete";
  return currentStatus === "error" ? "error" : "current";
}

export function stepsLayout(width: number, count: number): "full" | "compact" {
  return count > STEPS_AUTO_MAX || width < count * STEPS_MIN_COLUMN ? "compact" : "full";
}
