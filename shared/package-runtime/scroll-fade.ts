// Shared by the React and Vue 3 KjunScrollFade: which edges still have content, and the mask that fades them.
export type ScrollFadeDirection = "horizontal" | "vertical";
export interface ScrollEdges { start: boolean; end: boolean }
interface ScrollBox { scrollLeft: number; scrollTop: number; clientWidth: number; clientHeight: number; scrollWidth: number; scrollHeight: number }

export function scrollEdges(el: ScrollBox, direction: ScrollFadeDirection): ScrollEdges {
  const [offset, size, content] = direction === "vertical"
    ? [el.scrollTop, el.clientHeight, el.scrollHeight]
    : [el.scrollLeft, el.clientWidth, el.scrollWidth];
  return { start: offset > 1, end: offset + size < content - 1 };
}

export function scrollFadeMask({ start, end }: ScrollEdges, width: number, direction: ScrollFadeDirection): string | undefined {
  if (!start && !end) return undefined;
  const to = direction === "vertical" ? "bottom" : "right";
  return `linear-gradient(to ${to}, ${start ? `transparent, currentColor ${width}px` : "currentColor"}, ${
    end ? `currentColor calc(100% - ${width}px), transparent` : "currentColor"})`;
}
