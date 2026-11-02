import { tokens } from "@kjun-ui/tokens";
import { toastSwipeDistance, toastSwipeOpacity } from "./toast-presentation";

/** Touch and pen swipes sideways on a web toast: past the distance it closes, short of it the card springs back.
 * Vertical moves stay page scrolls, and presses on its buttons stay presses. */
export function attachToastSwipe(card: HTMLElement, { hold, release, close }: { hold(): void; release(): void; close(): void }) {
  let start: { x: number; y: number; id: number } | null = null, dx = 0, active = false;
  // Movement smaller than this is still a tap.
  const slop = toastSwipeDistance() / 8;
  const settle = () => {
    card.style.transition = `transform ${tokens.motion.toastMove}ms ${tokens.motion.easeOut}, opacity ${tokens.motion.toastMove}ms ${tokens.motion.easeOut}`;
    card.style.transform = "";
    card.style.opacity = "";
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType === "mouse" || (event.target as Element).closest("button, a")) return;
    start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dx = 0;
    active = false;
  };
  const move = (event: PointerEvent) => {
    if (!start || event.pointerId !== start.id) return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    if (!active) {
      if (Math.max(Math.abs(x), Math.abs(y)) < slop) return;
      if (Math.abs(y) > Math.abs(x)) { start = null; return; }
      active = true;
      card.setPointerCapture?.(event.pointerId);
      card.style.transition = "none";
      hold();
    }
    dx = x;
    card.style.transform = `translateX(${dx}px)`;
    card.style.opacity = String(toastSwipeOpacity(dx));
  };
  const up = (event: PointerEvent) => {
    if (!start || event.pointerId !== start.id) return;
    const swiped = active;
    start = null;
    active = false;
    if (!swiped) return;
    // A closing card leaves from where the finger let go.
    if (event.type === "pointerup" && Math.abs(dx) >= toastSwipeDistance()) close();
    else { settle(); release(); }
  };
  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);
  return () => {
    card.removeEventListener("pointerdown", down);
    card.removeEventListener("pointermove", move);
    card.removeEventListener("pointerup", up);
    card.removeEventListener("pointercancel", up);
  };
}

/** Focus returns to where it was when the toast appeared, but only if it is inside the leaving toast. */
export function restoreToastFocus(surface: HTMLElement | null, previous: Element | null) {
  if (!surface?.contains(document.activeElement) || !(previous instanceof HTMLElement) || !previous.isConnected) return;
  previous.focus({ preventScroll: true });
}
