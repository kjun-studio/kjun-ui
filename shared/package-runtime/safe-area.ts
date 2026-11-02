// One safe area for the whole app: KjunProvider receives it once and every edge component reads it.
export interface KjunSafeArea {
  /** Top inset in px (status bar, notch). */
  top?: number;
  /** Bottom inset in px (home indicator). */
  bottom?: number;
}
export interface ResolvedSafeArea { top: number; bottom: number }

/** A provider's own values, else the parent's, never negative. */
export function resolveSafeArea(area?: KjunSafeArea, parent?: ResolvedSafeArea): ResolvedSafeArea {
  const pick = (own: number | undefined, inherited = 0) => Math.max(0, Number.isFinite(own) ? own! : inherited);
  return { top: pick(area?.top, parent?.top), bottom: pick(area?.bottom, parent?.bottom) };
}

/**
 * Web: a provider that receives a safe area writes it as CSS variables; without one, components fall back to the
 * browser's env(safe-area-inset-*) (which needs viewport-fit=cover). Nested providers inherit their parent's values.
 */
export function safeAreaVars(area?: KjunSafeArea) {
  const vars: Record<string, string> = {};
  if (area?.top != null) vars["--_kjun-safe-top"] = Math.max(0, area.top) + "px";
  if (area?.bottom != null) vars["--_kjun-safe-bottom"] = Math.max(0, area.bottom) + "px";
  return vars;
}
/** The web inset for an edge component; safeArea={false} drops it where the app already reserved the space. */
export const webSafeTop = (on = true) => (on ? "var(--_kjun-safe-area-top)" : "0px");
export const webSafeBottom = (on = true) => (on ? "var(--_kjun-safe-area-bottom)" : "0px");
