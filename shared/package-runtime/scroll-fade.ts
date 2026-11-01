// Shared by the React and Vue 3 KjunScrollFade: which edges still have content past them. The CSS draws the fade
// from data-fade-start / data-fade-end, so an app's own mask-image style is left alone.
export type ScrollFadeDirection = "horizontal" | "vertical";
export interface ScrollEdges { start: boolean; end: boolean }
interface ScrollBox { scrollLeft: number; scrollTop: number; clientWidth: number; clientHeight: number; scrollWidth: number; scrollHeight: number }

/** Edges in reading order: in a right-to-left layout scrollLeft runs from 0 to negative and the start is on the right. */
export function scrollEdges(el: ScrollBox, direction: ScrollFadeDirection, rtl = false): ScrollEdges {
  const [offset, size, content] = direction === "vertical"
    ? [el.scrollTop, el.clientHeight, el.scrollHeight]
    : [rtl ? Math.abs(el.scrollLeft) : el.scrollLeft, el.clientWidth, el.scrollWidth];
  return { start: offset > 1, end: offset + size < content - 1 };
}
export const sameEdges = (a: ScrollEdges, b: ScrollEdges) => a.start === b.start && a.end === b.end;

/**
 * Watches a scroller for anything that can move its edges: its size, its children's sizes, children added or
 * removed, images loading late and web fonts arriving. Reports only when an edge changes.
 */
export function trackScrollFade(el: HTMLElement, direction: () => ScrollFadeDirection, onEdges: (edges: ScrollEdges) => void) {
  let last: ScrollEdges = { start: false, end: false }, live = true;
  const update = () => {
    if (!live) return;
    const next = scrollEdges(el, direction(), getComputedStyle(el).direction === "rtl");
    if (!sameEdges(next, last)) { last = next; onEdges(next); }
  };
  const resized = new ResizeObserver(update);
  const observeChildren = () => { resized.disconnect(); resized.observe(el); for (const child of Array.from(el.children)) resized.observe(child); };
  const changed = new MutationObserver(() => { observeChildren(); update(); });
  observeChildren();
  changed.observe(el, { childList: true, subtree: true, characterData: true });
  el.addEventListener("scroll", update, { passive: true });
  // An image deep inside a block child can widen the content without resizing any observed box.
  el.addEventListener("load", update, true);
  document.fonts?.ready.then(update);
  update();
  return {
    update,
    destroy: () => {
      live = false;
      resized.disconnect();
      changed.disconnect();
      el.removeEventListener("scroll", update);
      el.removeEventListener("load", update, true);
    },
  };
}
