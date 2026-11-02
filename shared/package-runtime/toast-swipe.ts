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
    if (event.type === "pointerup" && Math.abs(dx) >= toastSwipeDistance()) { flingToast(card, dx); close(); }
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

/** The whole web stack holds still while a mouse pointer or focus is on any of its toasts, so cards never move under
 * the hand reaching for them. Touch is left out: a tap sends no pointer-leave until the next tap elsewhere, which would
 * freeze the stack. A press outside the stack calls `outside`, and Escape inside it calls `escape` (both fold it). */
export function attachToastStack(root: HTMLElement, { hold, release, outside, escape }: {
  hold(reason: "pointer" | "focus"): void; release(reason: "pointer" | "focus"): void; outside(): void; escape(): boolean;
}) {
  const over = (event: PointerEvent) => { if (event.pointerType === "mouse") hold("pointer"); };
  const out = (event: PointerEvent) => { if (!root.contains(event.relatedTarget as Node | null)) release("pointer"); };
  const focusIn = () => hold("focus");
  const focusOut = (event: FocusEvent) => { if (!root.contains(event.relatedTarget as Node | null)) release("focus"); };
  const press = (event: PointerEvent) => { if (!root.contains(event.target as Node)) outside(); };
  const key = (event: KeyboardEvent) => { if (event.key === "Escape" && escape()) { event.preventDefault(); event.stopPropagation(); } };
  root.addEventListener("pointerover", over);
  root.addEventListener("pointerout", out);
  root.addEventListener("focusin", focusIn);
  root.addEventListener("focusout", focusOut);
  root.addEventListener("keydown", key);
  document.addEventListener("pointerdown", press, true);
  return () => {
    root.removeEventListener("pointerover", over);
    root.removeEventListener("pointerout", out);
    root.removeEventListener("focusin", focusIn);
    root.removeEventListener("focusout", focusOut);
    root.removeEventListener("keydown", key);
    document.removeEventListener("pointerdown", press, true);
    release("pointer");
    release("focus");
  };
}

/** A swipe that closes a card carries it on in the swipe's direction instead of the usual exit toward the edge. */
export function flingToast(card: HTMLElement, dx: number) {
  card.style.transition = `transform ${tokens.motion.toastExit}ms ${tokens.motion.easeIn}, opacity ${tokens.motion.toastExit}ms ${tokens.motion.easeIn}`;
  card.style.transform = `translateX(${Math.sign(dx) * (card.offsetWidth + tokens.extensions.toast.inset)}px)`;
  card.style.opacity = "0";
}
