// Keyboard and focus rules for a non-modal Popover, shared by the React and Vue 3 packages (DOM only).
const tabbableSelector = 'button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])';

// tabIndex also drops react-aria's hidden Dismiss buttons (tabindex -1) that sit at the panel's edges.
function tabbable(element: HTMLElement) {
  return element.tabIndex >= 0 && !(element as HTMLButtonElement).disabled && element.getClientRects().length > 0 && !element.closest("[inert]");
}
function tabbables(root: ParentNode) {
  return [...root.querySelectorAll<HTMLElement>(tabbableSelector)].filter(tabbable);
}

/** The first tabbable element after the trigger in document order, outside the trigger and the skipped panel. */
export function nextTabbableAfter(trigger: HTMLElement, skip: HTMLElement | null): HTMLElement | null {
  return tabbables(trigger.ownerDocument).find(element =>
    !trigger.contains(element) && !skip?.contains(element) &&
    !!(trigger.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? null;
}

/**
 * While open: Shift+Tab from the first element goes to the trigger, Tab from the last closes and moves on
 * after the trigger, and focus or a press outside the panel, the trigger and other KJUN floating panels
 * (menus opened from inside) closes it. Returns the cleanup.
 */
export function installNonModalPopover({ panel, trigger, close }: {
  panel: () => HTMLElement | null; trigger: () => HTMLElement | null; close: () => void;
}) {
  const doc = trigger()?.ownerDocument;
  if (!doc) return () => {};
  const inside = (node: EventTarget | null) => {
    if (!(node instanceof Node)) return false;
    const element = node instanceof Element ? node : node.parentElement;
    return !!(panel()?.contains(node) || trigger()?.contains(node) || element?.closest(".kjun-floating"));
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const root = panel(), opener = trigger();
    if (event.key !== "Tab" || !root || !opener || !root.contains(event.target as Node)) return;
    const items = tabbables(root), first = items[0], last = items.at(-1);
    if (event.shiftKey && (event.target === first || event.target === root || !first)) {
      event.preventDefault();
      event.stopPropagation();
      (tabbables(opener)[0] ?? opener).focus();
    } else if (!event.shiftKey && (event.target === last || !last)) {
      event.preventDefault();
      event.stopPropagation();
      const next = nextTabbableAfter(opener, root) ?? tabbables(opener)[0] ?? opener;
      close();
      // Overlay libraries keep their focus scope until the panel unmounts and restore focus then;
      // move on once the panel has left the document (or after a bounded wait).
      let frames = 0;
      const moveOn = () => {
        if (root.isConnected && frames++ < 60) requestAnimationFrame(moveOn);
        else next.focus();
      };
      moveOn();
    }
  };
  const onOutside = (event: Event) => { if (!inside(event.target)) close(); };
  // The window capture phase runs before react-aria's focus-scope Tab handling, which would otherwise
  // send Shift+Tab to the element before the trigger instead of the trigger.
  const view = doc.defaultView ?? window;
  view.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("focusin", onOutside, true);
  doc.addEventListener("pointerdown", onOutside, true);
  return () => {
    view.removeEventListener("keydown", onKeyDown, true);
    doc.removeEventListener("focusin", onOutside, true);
    doc.removeEventListener("pointerdown", onOutside, true);
  };
}
