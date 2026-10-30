import { tokens } from "@kjun-ui/tokens";

/**
 * Collapses a dismissed web Alert's height and padding while it fades, so the content below slides up
 * instead of jumping; `done` runs once it is gone. Reduced motion (or no Web Animations) finishes at once.
 */
export function collapseAlert(el: HTMLElement | null, reduced: boolean, done: () => void) {
  if (reduced || !el || typeof el.animate !== "function") { done(); return; }
  const style = getComputedStyle(el);
  el.inert = true;
  el.style.overflow = "hidden";
  el.style.boxSizing = "border-box";
  const exit = el.animate([
    { height: el.getBoundingClientRect().height + "px", paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, opacity: 1 },
    { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0 },
  ], { duration: tokens.motion.collapse, easing: tokens.motion.easeOut, fill: "forwards" });
  exit.onfinish = done;
}
