/** Web only. ← and → in an open side navigation, shared by React and Vue 3: "in" opens a closed parent or group, or moves
 * to its first row; "out" closes an open one, or moves from a row to the parent or group title it sits under. In a flyout
 * beside a collapsed icon, "out" from a row with nothing above it closes the flyout. Right to left swaps the keys. */
import { sideNavigationArrow } from "./side-navigation";

/** A parent or group title's own panel: whether it shows, how to open or close it, and the panel's id. */
export type SideNavigationArrowOwner = { shown: boolean; set: (open: boolean) => void; panel: string };
type KeyEvent = { key: string; currentTarget: EventTarget | null; preventDefault(): void };

const isRtl = (node: HTMLElement) => getComputedStyle(node).direction === "rtl";

/** The first row a panel holds that can take focus. */
export function sideNavigationFirstRow(panel: string) {
  return document.getElementById(panel)?.querySelector<HTMLElement>(".kjun-side-navigation-item:not([aria-disabled=true])") ?? null;
}
/** The parent button or group title whose panel holds a row. */
export function sideNavigationOwner(node: HTMLElement) {
  const panel = node.parentElement?.closest<HTMLElement>("[data-side-panel]");
  return panel ? document.querySelector<HTMLElement>(`[aria-controls="${panel.id}"]`) : null;
}

/** Moves or opens for an arrow key on a row. own is the row's own panel (a parent or group title); leave closes the
 * flyout the row sits in. */
export function sideNavigationArrowKey(event: KeyEvent, own?: SideNavigationArrowOwner, leave?: () => void) {
  const target = event.currentTarget as HTMLElement;
  const direction = sideNavigationArrow(event.key, isRtl(target));
  if (!direction) return;
  if (own && direction === "in") {
    event.preventDefault();
    if (!own.shown) own.set(true); else sideNavigationFirstRow(own.panel)?.focus();
    return;
  }
  if (own && own.shown) { event.preventDefault(); own.set(false); return; }
  if (direction !== "out") return;
  const owner = sideNavigationOwner(target);
  if (owner) { event.preventDefault(); owner.focus(); } else if (leave) { event.preventDefault(); leave(); }
}

/** Whether a key on a collapsed icon opens its flyout: → (← right to left). */
export const sideNavigationOpensFlyout = (event: KeyEvent) =>
  sideNavigationArrow(event.key, isRtl(event.currentTarget as HTMLElement)) === "in";

/** Closes a flyout and puts focus back on the icon that opened it. */
export function closeSideNavigationFlyout(close: () => void, trigger: string) {
  close();
  setTimeout(() => document.getElementById(trigger)?.focus());
}
