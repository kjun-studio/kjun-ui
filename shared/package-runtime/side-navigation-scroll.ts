/** Web only. Scrolling the side navigation's own column, never the page: element.scrollIntoView would also move the
 * window and every scrolling ancestor, which jumps the page when the menu sits in a sticky sidebar. */

/** The closest ancestor that scrolls vertically, below the document. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent && parent !== document.body && parent !== document.documentElement; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return null;
}

/** Brings an element into its scrolling column by the shortest move ("nearest"); does nothing when it is already in view. */
export function scrollSideNavigationRow(node: HTMLElement | null | undefined, instant = false) {
  if (!node) return;
  const parent = scrollParent(node);
  if (!parent) return;
  const box = parent.getBoundingClientRect(), row = node.getBoundingClientRect();
  const top = row.top - box.top, bottom = row.bottom - box.bottom;
  const delta = top < 0 ? top : bottom > 0 ? Math.min(bottom, top) : 0;
  if (!delta) return;
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  parent.scrollTo({ top: parent.scrollTop + delta, behavior: instant || reduce ? "auto" : "smooth" });
}

/** The row that shows where the person is: the current link when it is on screen, else the closed parent or group that
 * stands for it. */
export function sideNavigationCurrentRow(nav: HTMLElement | null | undefined): HTMLElement | null {
  if (!nav) return null;
  const current = Array.from(nav.querySelectorAll<HTMLElement>("[aria-current=page]")).find(node => !node.closest("[inert]"));
  return current ?? nav.querySelector<HTMLElement>("[data-current-within]");
}
