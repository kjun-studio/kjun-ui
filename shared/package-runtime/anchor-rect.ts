/** A screen (viewport) rectangle a popover attaches to instead of its trigger; width and height default to 0. */
export interface AnchorRect { x: number; y: number; width?: number; height?: number }
export type AnchorSource = AnchorRect | (() => AnchorRect | null);

/** Moves the invisible fixed anchor element; returns whether it moved. */
function place(element: HTMLElement, rect: AnchorRect) {
  const next = [rect.x, rect.y, rect.width ?? 0, rect.height ?? 0].map(value => value + "px");
  const style = element.style;
  if (style.left === next[0] && style.top === next[1] && style.width === next[2] && style.height === next[3]) return false;
  [style.left, style.top, style.width, style.height] = next;
  return true;
}

/** Keeps the anchor on its source while a popover is open: a value is placed once, a function is read every
 * frame (a text cursor moves without scrolling). A function returning null keeps the last position. */
export function followAnchor(element: HTMLElement, source: () => AnchorSource | undefined, moved: () => void) {
  let frame = 0, stopped = false;
  const step = () => {
    const current = source();
    const rect = typeof current === "function" ? current() : current;
    if (rect && place(element, rect)) moved();
    if (!stopped && typeof current === "function") frame = requestAnimationFrame(step);
  };
  step();
  return () => { stopped = true; cancelAnimationFrame(frame); };
}

/** Inline style of the anchor element: fixed, invisible and ignoring the pointer. */
export const anchorStyle = { position: "fixed", pointerEvents: "none", visibility: "hidden" } as const;
