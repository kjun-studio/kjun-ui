// Shared by the React and Vue 3 KjunCarousel: the browser scroller behind the slides, its settling and mouse dragging.
import { dragTarget, nearestSlide, reachableOffsets } from "./carousel";

export interface CarouselScrollerOptions {
  /** The scroll position came to rest on this slide. */
  onSettle: (index: number) => void;
  /** A mouse drag ended; move to this slide. */
  onDragEnd: (index: number) => void;
  current: () => number;
  mouseDrag: () => boolean;
}
export interface CarouselScroller {
  scrollTo: (target: number, smooth: boolean) => void;
  nearest: () => number;
  destroy: () => void;
}

const editable = "input, textarea, select, [contenteditable]:not([contenteditable=false])";
// The distance a mouse must move before a press becomes a drag rather than a click.
const dragSlop = 5;

export function createCarouselScroller(el: HTMLElement, options: CarouselScrollerOptions): CarouselScroller {
  const max = () => el.scrollWidth - el.clientWidth;
  const offsets = () => {
    const first = (el.firstElementChild as HTMLElement | null)?.offsetLeft ?? 0;
    return reachableOffsets(Array.from(el.children, child => (child as HTMLElement).offsetLeft - first), max());
  };
  const nearest = () => nearestSlide(offsets(), el.scrollLeft, max());
  let timer: ReturnType<typeof setTimeout> | undefined;
  let drag: { x: number; left: number; start: number; moved: boolean; pointer: number } | undefined;
  let snapOff = false, suppressClick = false;

  const settle = () => {
    clearTimeout(timer);
    if (drag) return;
    // Snapping stays off after a drag until its smooth scroll lands, so it cannot pull the slides back midway.
    if (snapOff) { snapOff = false; el.style.scrollSnapType = ""; }
    options.onSettle(nearest());
  };
  // Browsers without scrollend settle shortly after the last scroll event.
  const scroll = () => { clearTimeout(timer); timer = setTimeout(settle, 120); };

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
      el.setPointerCapture(drag.pointer);
      el.setAttribute("data-dragging", "");
      el.style.scrollSnapType = "none";
      snapOff = true;
    }
    el.scrollLeft = drag.left - distance;
  };
  const up = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const { moved, start, x } = drag;
    drag = undefined;
    if (!moved) return;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    el.removeAttribute("data-dragging");
    suppressClick = true;
    setTimeout(() => { suppressClick = false; });
    options.onDragEnd(dragTarget({ start, nearest: nearest(), distance: event.clientX - x, width: el.clientWidth, count: el.children.length }));
    // Settle even when the target is already in place and no scroll event follows.
    scroll();
  };
  // A drag that ends over a link or button is not a click on it.
  const click = (event: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };
  const dragStart = (event: DragEvent) => { if (options.mouseDrag()) event.preventDefault(); };

  el.addEventListener("scroll", scroll, { passive: true });
  el.addEventListener("scrollend", settle);
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("click", click, true);
  el.addEventListener("dragstart", dragStart);
  return {
    scrollTo: (target, smooth) => el.scrollTo({ left: offsets()[target] ?? 0, behavior: smooth ? "smooth" : "auto" }),
    nearest,
    destroy: () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", scroll);
      el.removeEventListener("scrollend", settle);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", click, true);
      el.removeEventListener("dragstart", dragStart);
    },
  };
}
