// Shared by the Vue 3, React and Native KjunSteps: each step's status from `current`, when the row folds to compact,
// which steps are buttons, and the words a screen reader and the compact heading row use.
import type { KjunMessages } from "./messages";
export type KjunStepStatus = "complete" | "current" | "error" | "upcoming";
export type KjunStepsCurrentStatus = "active" | "error";
export type KjunStepsLayout = "auto" | "full" | "compact";
/** Which steps onStepSelect makes buttons: completed ones (default), or every step but the current one (a wizard that may skip ahead). */
export type KjunStepsSelectable = "complete" | "all";

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

/** A step is a button when someone listens and it is not the step the user is on. */
export function stepSelectable(status: KjunStepStatus, selectable: KjunStepsSelectable = "complete"): boolean {
  return selectable === "all" ? status === "complete" || status === "upcoming" : status === "complete";
}

type StepMessages = Pick<KjunMessages, "stepComplete" | "stepCurrent" | "stepError" | "stepUpcoming" | "stepPosition" | "stepCount">;

/** Vertical rows show meta and description under the label; the horizontal row shows the label alone. */
export function stepDetail(item: KjunStepItem, vertical: boolean): string {
  return vertical ? [item.meta, item.description].filter(Boolean).join(" · ") : "";
}

/** One phrase names the step for a screen reader: a button carries it as its name, static copy as hidden text. */
export function stepSpoken(m: StepMessages, index: number, item: KjunStepItem, status: KjunStepStatus, detail: string): string {
  const text = { complete: m.stepComplete, current: m.stepCurrent, error: m.stepError, upcoming: m.stepUpcoming }[status];
  return m.stepPosition(index + 1) + ", " + item.label + ", " + text + (detail ? ", " + detail : "");
}

/** The compact heading row: the current step (the last one once every step is complete), the step after it, and "n / N"
 * split so the position can be drawn bold (lead is "" when a locale's count does not start with it). */
export function stepsHead<T extends KjunStepItem>(m: StepMessages, items: readonly T[], at: number) {
  const count = items.length, shown = Math.min(at, count - 1), total = m.stepCount(shown + 1, count), lead = String(shown + 1);
  const split = total.startsWith(lead);
  return { item: items[shown] as T | undefined, next: at < count ? items[at + 1] as T | undefined : undefined,
    lead: split ? lead : "", rest: split ? total.slice(lead.length) : total };
}
