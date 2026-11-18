import { tokens } from "@kjun-ui/tokens";

/**
 * Collapses a dismissed web Alert's height and padding while it fades, so the content below slides up
 * instead of jumping; `done` runs once it is gone. Reduced motion (or no Web Animations) finishes at once.
 */
export function collapseAlert(el: HTMLElement | null, reduced: boolean, done: () => void) {
  keepFocusPastAlert(el);
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

const tabbable = 'button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])';
const reachable = (node: HTMLElement) =>
  !(node as HTMLButtonElement).disabled && !node.closest("[inert],[hidden],[aria-hidden='true']") && node.getClientRects().length > 0;
/**
 * A dismissed Alert takes its focused close button with it: when focus is inside the alert, it moves to the next
 * tabbable element after it, or the one before when the alert was last, so keyboard users keep their place.
 * Call before the alert turns inert.
 */
export function keepFocusPastAlert(el: HTMLElement | null) {
  const doc = el?.ownerDocument;
  if (!el || !doc || !el.contains(doc.activeElement)) return;
  const candidates = [...doc.querySelectorAll<HTMLElement>(tabbable)].filter((node) => !el.contains(node) && reachable(node));
  const next = candidates.find((node) => el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
    ?? candidates.reverse().find((node) => el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING);
  next?.focus();
}
