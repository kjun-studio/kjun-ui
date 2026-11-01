// Shared by the Vue 3, React and Native KjunCarousel: which slide a scroll position settles on, and the keys that move it.
export type CarouselSlideSize = "full" | "peek" | "auto";
export type CarouselGap = "none" | "sm" | "md" | "lg";
export type CarouselMove = "previous" | "next" | "first" | "last";
export type CarouselIndicators = boolean | "dots" | "count";
export type CarouselTitleTag = "h2" | "h3" | "h4" | "h5" | "h6";

/** true means dots; false means none. */
export function indicatorMode(indicators: CarouselIndicators): "dots" | "count" | undefined {
  return indicators === true ? "dots" : indicators || undefined;
}

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

/** Slide starts as scroll positions the scroller can actually reach; starts past the end stop at the end. */
export function reachableOffsets(offsets: readonly number[], max: number): number[] {
  return offsets.map(offset => Math.max(0, Math.min(offset, Math.max(0, max))));
}

/** Where a mouse drag lands: wherever the position is nearest, or one slide on once the drag passes a fifth of the view. */
export function dragTarget({ start, nearest, distance, width, count }: { start: number; nearest: number; distance: number; width: number; count: number }): number {
  if (nearest !== start) return clampSlide(nearest, count);
  if (Math.abs(distance) < width / 5) return start;
  return clampSlide(start + (distance < 0 ? 1 : -1), count);
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
export function warnCarouselSetup({ controls, dots, mouseDrag, named }: { controls: boolean; dots: boolean; mouseDrag: boolean; named: boolean }) {
  if (!developmentMode()) return;
  if (!controls && !dots && !mouseDrag && !warnedUnreachable) {
    warnedUnreachable = true;
    console.warn("[KJUN] KjunCarousel: with controls, dot indicators and mouseDrag off, a mouse cannot reach other slides (the wheel scrolls vertically). Keep one of them on.");
  }
  if (!named && !warnedUnnamed) {
    warnedUnnamed = true;
    console.warn("[KJUN] KjunCarousel needs ariaLabel or title to name its region.");
  }
}
