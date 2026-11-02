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
/** Newest toast closest to the screen edge it enters from: on top for the top placement, at the bottom for the bottom one. */
export const orderToasts = <T>(items: T[], placement: "top" | "bottom" = "top") => (placement === "top" ? [...items].reverse() : items);
