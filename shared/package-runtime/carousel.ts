// Shared by the Vue 3, React and Native KjunCarousel: which slide a scroll position settles on, and the keys that move it.
export type CarouselSlideSize = "full" | "peek" | "auto";
export type CarouselGap = "none" | "sm" | "md" | "lg";
export type CarouselMove = "previous" | "next" | "first" | "last";

export function clampSlide(index: number, count: number): number {
  if (count <= 0 || !Number.isFinite(index)) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(index)));
}

/**
 * The slide whose start edge is nearest the scroll position. Narrow slides near the end can never reach the start
 * edge, so a position at the end of the scroll range (`max`) settles on the last slide.
 */
export function nearestSlide(offsets: readonly number[], position: number, max?: number): number {
  if (max !== undefined && max > 0 && offsets.length && position >= max - 1) return offsets.length - 1;
  let best = 0;
  for (let i = 1; i < offsets.length; i++)
    if (Math.abs(offsets[i] - position) < Math.abs(offsets[best] - position)) best = i;
  return best;
}

export function carouselKey(key: string): CarouselMove | undefined {
  return key === "ArrowLeft" ? "previous" : key === "ArrowRight" ? "next" : key === "Home" ? "first" : key === "End" ? "last" : undefined;
}

export function carouselTarget(move: CarouselMove, index: number, count: number): number {
  return clampSlide(move === "previous" ? index - 1 : move === "next" ? index + 1 : move === "first" ? 0 : count - 1, count);
}

function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
let warnedUnreachable = false, warnedUnnamed = false;
/** Development-only hints for setups that leave some people unable to move or name the carousel. */
export function warnCarouselSetup({ controls, indicators, named }: { controls: boolean; indicators: boolean; named: boolean }) {
  if (!developmentMode()) return;
  if (!controls && !indicators && !warnedUnreachable) {
    warnedUnreachable = true;
    console.warn("[KJUN] KjunCarousel: with controls and indicators off, a mouse cannot reach other slides (the wheel scrolls vertically and dragging is not supported). Keep one of them on.");
  }
  if (!named && !warnedUnnamed) {
    warnedUnnamed = true;
    console.warn("[KJUN] KjunCarousel needs ariaLabel or title to name its region.");
  }
}
