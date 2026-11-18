// Shared by the Vue 3, React and Native KjunCarousel: which slide a scroll position settles on, and the keys that move it.
export type CarouselSlideSize = "full" | "peek" | "auto";
export type CarouselGap = "none" | "sm" | "md" | "lg";
export type CarouselMove = "previous" | "next" | "first" | "last";
export type CarouselIndicators = boolean | "dots" | "count";
export type CarouselTitleTag = "h2" | "h3" | "h4" | "h5" | "h6";
export type CarouselSnapAlign = "start" | "center";
export type CarouselBleed = "none" | "sm" | "md" | "lg";
export type CarouselIndicatorPlacement = "below" | "overlay";

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

/** Like nearestSlide, but a current slide that already sits at the position stays current (several narrow cards share the end). */
export function settleSlide(offsets: readonly number[], position: number, max: number, current: number): number {
  if (offsets[current] !== undefined && Math.abs(offsets[current] - position) <= 1) return current;
  return nearestSlide(offsets, position, max);
}

/** Numbers the distinct places the slides stop, so slides that share a stop share one dot. */
export function slideStops(offsets: readonly number[]): number[] {
  let stop = 0;
  return offsets.map((offset, i) => (i && Math.abs(offset - offsets[i - 1]) > 1 ? ++stop : stop));
}

/** One dot per stop: the first slide at that stop is where the dot leads, and the current slide's stop is lit. */
export function stopDots(stops: readonly number[] | undefined, count: number, current: number): { target: number; current: boolean }[] {
  const marks = stops && stops.length === count ? stops : Array.from({ length: count }, (_, i) => i);
  const dots: { target: number; current: boolean }[] = [];
  marks.forEach((stop, i) => { dots[stop] ??= { target: i, current: false }; });
  if (dots[marks[current]]) dots[marks[current]].current = true;
  return dots;
}

/** The stop each slide sits at; before the slides are measured, every slide is its own stop. */
function stopsFor(stops: readonly number[] | undefined, count: number): readonly number[] {
  return stops && stops.length === count ? stops : Array.from({ length: count }, (_, i) => i);
}

/**
 * Where previous or next leads: the first slide of the neighbouring stop, so slides that share the end of a card rail
 * are passed over in one step instead of moving nothing. undefined when there is no stop that way.
 */
export function stepTarget(stops: readonly number[] | undefined, current: number, count: number, direction: "previous" | "next"): number | undefined {
  const marks = stopsFor(stops, count), here = marks[current];
  if (here === undefined) return undefined;
  const wanted = direction === "next" ? here + 1 : here - 1;
  const target = marks.indexOf(wanted);
  return target < 0 ? undefined : target;
}

/** Where focus goes after a button moves to an end: the scroller for side buttons, which vanish, or the other header button. */
export function stepFocus(stops: readonly number[] | undefined, target: number, count: number, header: boolean): "viewport" | "previous" | "next" | undefined {
  const atStart = stepTarget(stops, target, count, "previous") === undefined, atEnd = stepTarget(stops, target, count, "next") === undefined;
  if (!atStart && !atEnd) return undefined;
  return header ? (atStart ? "next" : "previous") : "viewport";
}

/** How many slides fit side by side when each must be at least `min` wide (never fewer than one). */
export function slidesPerView(width: number, min: number, gap: number): number {
  if (!(width > 0) || !(min > 0)) return 1;
  return Math.max(1, Math.floor((width + gap) / (min + gap)));
}

/** The slide width that puts `perView` slides across `width` with `gap` between them. */
export function perViewWidth(width: number, perView: number, gap: number): number {
  return Math.max(0, (width - (perView - 1) * gap) / perView);
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

/** Arrow keys step by stop like the buttons; Home and End go to either end. */
export function carouselTarget(move: CarouselMove, index: number, count: number, stops?: readonly number[]): number {
  if (move === "previous" || move === "next") return stepTarget(stops, index, count, move) ?? clampSlide(index, count);
  return clampSlide(move === "first" ? 0 : count - 1, count);
}

function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
let warnedUnreachable = false, warnedUnnamed = false;
export function warnUnnamedCarousel(named: boolean) {
  if (named || warnedUnnamed || !developmentMode()) return;
  warnedUnnamed = true;
  console.warn("[KJUN] KjunCarousel needs ariaLabel or title to name its region.");
}
/** Development-only hints for setups that leave some people unable to move or name the carousel. */
export function warnCarouselSetup({ controls, dots, mouseDrag, named }: { controls: boolean; dots: boolean; mouseDrag: boolean; named: boolean }) {
  if (!developmentMode()) return;
  if (!controls && !dots && !mouseDrag && !warnedUnreachable) {
    warnedUnreachable = true;
    console.warn("[KJUN] KjunCarousel: with controls, dot indicators and mouseDrag off, a mouse cannot reach other slides (the wheel scrolls vertically). Keep one of them on.");
  }
  warnUnnamedCarousel(named);
}
