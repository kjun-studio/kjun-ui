import { activeFocusElements, containsLayer } from "./layer-host.js";
const stack = [];
const visible = (el) =>
  el.getClientRects().length &&
  getComputedStyle(el).visibility !== "hidden" &&
  !el.closest('[inert], [aria-hidden="true"]');
export function createFocusTrap() {
  const owner = {};
  let element = null,
    previous = null,
    timer;
  const isTop = () => stack[stack.length - 1] === owner;
  const focusables = () => {
    if (!element) return [];
    const elements = activeFocusElements(element);
    return [...new Set(elements)].filter(visible);
  };
  function keydown(e) {
    if (e.key !== "Tab" || !isTop() || !element) return;
    const items = focusables();
    if (!items.length) {
      e.preventDefault();
      element.focus();
      return;
    }
    const first = items[0],
      last = items[items.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first || !containsLayer(element, document.activeElement))
    ) {
      e.preventDefault();
      last.focus();
    } else if (
      !e.shiftKey &&
      (document.activeElement === last || !containsLayer(element, document.activeElement))
    ) {
      e.preventDefault();
      first.focus();
    }
  }
  function remove() {
    clearTimeout(timer);
    document.removeEventListener("keydown", keydown);
    const i = stack.indexOf(owner);
    if (i >= 0) stack.splice(i, 1);
  }
  return {
    isTop,
    activate(el) {
      remove();
      element = el;
      previous = document.activeElement;
      stack.push(owner);
      element.setAttribute("tabindex", "-1");
      document.addEventListener("keydown", keydown);
      timer = setTimeout(() => {
        // Toast actions join Tab navigation but must not steal a new window's initial focus.
        if (isTop() && element) {
          const local = focusables().filter(item => element.contains(item));
          (local.find(item => item.hasAttribute('autofocus')) || local[0] || element).focus();
        }
      }, 0);
    },
    deactivate(restore = true) {
      const wasTop = isTop();
      remove();
      if (restore && wasTop && previous?.isConnected && !previous.closest('[inert]')) previous.focus();
      element = null;
      previous = null;
    },
  };
}
