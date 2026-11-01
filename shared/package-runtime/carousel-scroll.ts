// Shared by the React and Vue 3 KjunCarousel: the browser scroller behind the slides, its settling, layout and mouse dragging.
import { dragTarget, reachableOffsets, settleSlide, slideStops, type CarouselSnapAlign } from "./carousel";

export interface CarouselScrollerOptions {
  /** The scroll position came to rest on this slide. */
  onSettle: (index: number) => void;
  /** A mouse drag ended; move to this slide. */
  onDragEnd: (index: number) => void;
  /** The places the slides stop changed; slides that share a stop share a dot. */
  onStops: (stops: number[]) => void;
  current: () => number;
  mouseDrag: () => boolean;
  align: () => CarouselSnapAlign;
}
export interface CarouselScroller {
  scrollTo: (target: number, smooth: boolean) => void;
  nearest: () => number;
  /** A smooth scroll toward this slide is still under way; starting it again would end it early with a midway scrollend. */
  heading: () => number | undefined;
  /** Call after every render: picks up added or removed slides. */
  refresh: () => void;
  destroy: () => void;
}

const editable = "input, textarea, select, [contenteditable]:not([contenteditable=false])";
// The distance a mouse must move before a press becomes a drag rather than a click.
const dragSlop = 5;

export function createCarouselScroller(el: HTMLElement, options: CarouselScrollerOptions): CarouselScroller {
  const max = () => el.scrollWidth - el.clientWidth;
  const slides = () => Array.from(el.children) as HTMLElement[];
  const offsets = () => {
    const all = slides(), first = all[0]?.offsetLeft ?? 0, center = options.align() === "center";
    return reachableOffsets(all.map(slide => center ? slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2 : slide.offsetLeft - first), max());
  };
  const nearest = () => settleSlide(offsets(), el.scrollLeft, max(), options.current());
  let timer: ReturnType<typeof setTimeout> | undefined;
  let drag: { x: number; left: number; start: number; moved: boolean; pointer: number } | undefined;
  let snapOff = false, suppressClick = false, width = el.clientWidth, lastStops = "";
  let heading: number | undefined;

  const settle = () => {
    clearTimeout(timer);
    if (drag) return;
    heading = undefined;
    // Snapping stays off after a drag until its smooth scroll lands, so it cannot pull the slides back midway.
    if (snapOff) { snapOff = false; el.style.scrollSnapType = ""; el.style.scrollBehavior = ""; }
    options.onSettle(nearest());
  };
  // Browsers without scrollend settle shortly after the last scroll event.
  const scroll = () => { clearTimeout(timer); timer = setTimeout(settle, 120); };

  const reportStops = () => {
    const stops = slideStops(offsets()), key = stops.join();
    if (key !== lastStops) { lastStops = key; options.onStops(stops); }
  };
  // A carousel drawn while hidden measures every slide at 0; once it has a size, it returns to the current slide.
  const resized = new ResizeObserver(() => {
    if (drag || el.clientWidth === width) return;
    width = el.clientWidth;
    el.scrollTo({ left: offsets()[options.current()] ?? 0, behavior: "auto" });
    reportStops();
  });
  resized.observe(el);
  // Slides wholly out of view leave the Tab order and the accessibility tree, so Tab cannot jump the carousel back.
  const seen = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.toggleAttribute("inert", entry.intersectionRatio === 0);
  }, { root: el, threshold: [0, 0.01] });

  const down = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !options.mouseDrag()) return;
    if ((event.target as Element | null)?.closest(editable)) return;
    drag = { x: event.clientX, left: el.scrollLeft, start: options.current(), moved: false, pointer: event.pointerId };
  };
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const distance = event.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(distance) < dragSlop) return;
      drag.moved = true;
      try { el.setPointerCapture(drag.pointer); } catch { /* a synthetic or already released pointer cannot be captured */ }
      el.setAttribute("data-dragging", "");
      // A page-wide smooth scroll-behavior would make the slides trail the pointer.
      el.style.scrollSnapType = "none";
      el.style.scrollBehavior = "auto";
      snapOff = true;
    }
    el.scrollLeft = drag.left - distance;
  };
  const end = (event: PointerEvent, cancelled: boolean) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const { moved, start, x } = drag;
    drag = undefined;
    if (!moved) return;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    el.removeAttribute("data-dragging");
    suppressClick = !cancelled;
    setTimeout(() => { suppressClick = false; });
    // A cancelled drag (the window lost the pointer) goes back to where it started.
    options.onDragEnd(cancelled ? start
      : dragTarget({ start, nearest: nearest(), distance: event.clientX - x, width: el.clientWidth, count: el.children.length }));
    // Settle even when the target is already in place and no scroll event follows.
    scroll();
  };
  const up = (event: PointerEvent) => end(event, false);
  const cancel = (event: PointerEvent) => end(event, true);
  // A drag that ends over a link or button is not a click on it.
  const click = (event: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };
  const dragStart = (event: DragEvent) => { if (options.mouseDrag()) event.preventDefault(); };

  const refresh = () => {
    for (const slide of slides()) seen.observe(slide);
    reportStops();
  };
  el.addEventListener("scroll", scroll, { passive: true });
  el.addEventListener("scrollend", settle);
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", cancel);
  el.addEventListener("click", click, true);
  el.addEventListener("dragstart", dragStart);
  refresh();
  return {
    scrollTo: (target, smooth) => {
      heading = smooth ? target : undefined;
      el.scrollTo({ left: offsets()[target] ?? 0, behavior: smooth ? "smooth" : "auto" });
    },
    nearest,
    heading: () => heading,
    refresh,
    destroy: () => {
      clearTimeout(timer);
      resized.disconnect();
      seen.disconnect();
      el.removeEventListener("scroll", scroll);
      el.removeEventListener("scrollend", settle);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
      el.removeEventListener("click", click, true);
      el.removeEventListener("dragstart", dragStart);
    },
  };
}
