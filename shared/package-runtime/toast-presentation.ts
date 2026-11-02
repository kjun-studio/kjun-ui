import { tokens, type ToastItem } from "@kjun-ui/tokens";

export type ToastTone = "success" | "warning" | "danger" | "info";
const icons: Record<ToastTone, string> = {
  success: "circle-check",
  danger: "alert-circle",
  warning: "alert-triangle",
  info: "info-circle",
};
/** What every platform draws for one toast; the views only render it. */
export function toastPresentation(toast: ToastItem) {
  const tone: ToastTone = toast.type === "error" ? "danger" : toast.type || "info";
  // Compact is one capsule line; it is ignored once there is a heading.
  const compact = !!toast.compact && !toast.title;
  return {
    tone,
    icon: toast.loading ? "loader-2" : icons[tone],
    compact,
    // A toast that never closes itself always keeps a close button, whatever closable says.
    closable: !toast.duration || (!compact && toast.closable !== false),
    // Without a heading the action sits beside the close button; with one it goes under the message.
    sideAction: !!toast.action && !toast.title,
    // Only a danger toast interrupts; the rest wait for a pause in speech.
    role: tone === "danger" ? "alert" as const : "status" as const,
    live: tone === "danger" ? "assertive" as const : "polite" as const,
    spoken: toast.title ? `${toast.title}. ${toast.message}` : toast.message,
  };
}

/** A horizontal swipe past this distance closes the toast; a shorter one springs back. */
export const toastSwipeDistance = () => tokens.extensions.toast.swipeDistance;
/** Swipe progress as the card's fade: fully visible at rest, half faded at the closing distance. */
export const toastSwipeOpacity = (dx: number) => Math.max(0, 1 - Math.abs(dx) / (2 * toastSwipeDistance()));
const isCompact = (toast: ToastItem) => !!toast.compact && !toast.title;
/** Order on screen, nearest the edge toasts enter from first: capsules, then cards, each newest first.
 * The bottom placement mirrors it so the newest stays nearest its own edge. */
export function orderToasts<T extends { toast: ToastItem }>(items: T[], placement: "top" | "bottom" = "top") {
  const near = [...items.filter((item) => isCompact(item.toast)).reverse(), ...items.filter((item) => !isCompact(item.toast)).reverse()];
  return placement === "top" ? near : near.reverse();
}

export interface ToastStackItem { toast: ToastItem; exiting: boolean }
/** What a stack draws. Toasts waiting beyond maxToasts are counted, not drawn, until the stack is expanded. On a narrow
 * screen several toasts also fold behind one front card (the newest danger toast, else the newest). */
export function toastStackLayout<T extends ToastStackItem>(items: T[], { placement = "top", narrow = false, expanded = false }:
  { placement?: "top" | "bottom"; narrow?: boolean; expanded?: boolean }) {
  const live = items.filter((item) => !item.exiting && !item.toast.hidden);
  const waiting = items.filter((item) => !item.exiting && item.toast.hidden);
  const folded = narrow && !expanded && live.length > 1;
  const front = folded ? [...live].reverse().find((item) => toastPresentation(item.toast).tone === "danger") ?? live.at(-1) : undefined;
  const drawn = items.filter((item) => (expanded || !item.toast.hidden) && (!folded || item === front || item.exiting));
  // Toasts not drawn as cards: the folded ones and the ones waiting beyond maxToasts.
  const behind = expanded ? 0 : (folded ? live.length - 1 : 0) + waiting.length;
  const cards = drawn.filter((item) => !item.exiting && !isCompact(item.toast)).length;
  return {
    items: orderToasts(drawn, placement),
    folded,
    behind,
    // The control that expands the stack, and folds it again, stays in place so keyboard focus is never lost.
    toggle: expanded || behind > 0,
    // Several cards share one width so the stack's far edge stays straight; a single card hugs its content.
    uniform: !narrow && cards > 1,
    // Live toasts nobody can see: screen readers hear them from the stack's own announcer instead.
    unseen: [...live, ...waiting].filter((item) => !drawn.includes(item)),
  };
}
/** Card edges drawn behind the stack's last card: one per waiting toast, at most two. */
export const toastPeekDepth = (behind: number) => Math.min(2, behind);
