// Drag-to-dismiss for a bottom drawer's handle. The decision is shared by every platform; the web part below is
// framework-free DOM, so React and Vue 3 bind the same handler. Native drives it through a PanResponder.

/** Downward speed in px per ms at which a short flick still dismisses the sheet. */
export const sheetFlickVelocity = 0.5;

/** How far the sheet follows a drag: only downward, never past its own height. */
export function sheetDragOffset(delta: number, height: number) {
  return Math.max(0, Math.min(delta, height > 0 ? height : delta));
}

/** Whether a released drag closes the sheet: past the dismiss distance, or a downward flick. */
export function sheetDragDismisses(offset: number, velocity: number, distance: number) {
  return offset >= distance || (offset > 0 && velocity >= sheetFlickVelocity);
}

/** How much of the backdrop remains while the sheet is dragged down (1 at rest, 0 at its full height). */
export function sheetDragFade(offset: number, height: number) {
  return height > 0 ? Math.max(0, 1 - offset / height) : 1;
}

// Presses on controls inside the drag area (the close button, header actions) stay presses.
const interactive = "button, a, input, select, textarea, [role='button'], [contenteditable='true']";

export interface SheetDragTarget {
  /** The overlay that carries the backdrop. */
  overlay: () => HTMLElement | null;
  /** The panel that moves with the pointer. */
  panel: () => HTMLElement | null;
  /** Dismiss distance in px (tokens drawer.dismissDistance). */
  distance: number;
  enabled: () => boolean;
  onDismiss: () => void;
}

/**
 * pointerdown handler for the drag area (handle and header), given that area's element. While dragging the panel follows the pointer inline and the
 * overlay carries data-dragging with --_kjun-drawer-drag (the backdrop that remains); on release both are cleared, so the
 * panel springs back or leaves through the drawer's own CSS transition from where it was dropped.
 */
export function sheetDragStart(target: SheetDragTarget) {
  return (event: PointerEvent, area: HTMLElement | null) => {
    const panel = target.panel(), overlay = target.overlay();
    if (!area || !panel || !overlay || !target.enabled() || event.button !== 0 || !event.isPrimary) return;
    if ((event.target as Element | null)?.closest?.(interactive)) return;
    const startY = event.clientY, height = panel.getBoundingClientRect().height;
    let offset = 0, lastY = startY, lastTime = event.timeStamp, velocity = 0;
    try { area.setPointerCapture(event.pointerId); } catch { /* the pointer may already be gone */ }
    overlay.setAttribute("data-dragging", "");
    panel.style.transition = "none";
    const move = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId) return;
      offset = sheetDragOffset(next.clientY - startY, height);
      const elapsed = next.timeStamp - lastTime;
      if (elapsed > 0) velocity = (next.clientY - lastY) / elapsed;
      lastY = next.clientY; lastTime = next.timeStamp;
      panel.style.transform = `translateY(${offset}px)`;
      overlay.style.setProperty("--_kjun-drawer-drag", String(sheetDragFade(offset, height)));
    };
    const end = (last: PointerEvent) => {
      if (last.pointerId !== event.pointerId) return;
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerup", end);
      area.removeEventListener("pointercancel", end);
      // A pause before letting go is not a flick.
      if (last.timeStamp - lastTime > 100) velocity = 0;
      const dismiss = last.type === "pointerup" && sheetDragDismisses(offset, velocity, target.distance);
      const release = () => {
        overlay.removeAttribute("data-dragging");
        overlay.style.removeProperty("--_kjun-drawer-drag");
        panel.style.removeProperty("transform");
      };
      panel.style.removeProperty("transition");
      if (!dismiss) { release(); return; }
      // Hold the dropped position until the closed state has rendered, so the exit starts there instead of
      // springing back first. If the app keeps the drawer open, the panel returns to rest.
      target.onDismiss();
      requestAnimationFrame(() => requestAnimationFrame(release));
    };
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerup", end);
    area.addEventListener("pointercancel", end);
  };
}
