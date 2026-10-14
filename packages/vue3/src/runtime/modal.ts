import { onBeforeUnmount, watch, type Ref } from "vue";

// What react-aria's ModalOverlay/Modal/Dialog give React windows: page scroll lock, hiding the rest of
// the page from assistive technology, Tab containment and initial focus. Active only for the top window.
const tabbable = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])';
let locks = 0, previousOverflow = "";
function lockScroll() {
  if (locks++ === 0) { previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden"; }
  return () => { if (--locks === 0) document.documentElement.style.overflow = previousOverflow; };
}
function hideOutside(root: HTMLElement) {
  const hidden: HTMLElement[] = [];
  for (let node: HTMLElement | null = root; node && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
      // Live regions keep announcing, as with react-aria's ariaHideOutside.
      if (sibling.matches('[aria-live], [role="alert"], [role="status"], script, style')) continue;
      // Like react-aria's ModalOverlay: inert hides the page from assistive technology and blocks input.
      sibling.inert = true;
      hidden.push(sibling);
    }
  }
  return () => { for (const node of hidden) node.inert = false; };
}

export function useModalOverlay(root: Ref<HTMLElement | null>, dialog: Ref<HTMLElement | null>, active: () => boolean) {
  let release: (() => void)[] = [];
  const contain = (event: KeyboardEvent) => {
    const scope = dialog.value;
    if (event.key !== "Tab" || !scope) return;
    const nodes = [...scope.querySelectorAll<HTMLElement>(tabbable)].filter(node => node.offsetParent !== null || node === document.activeElement);
    if (!nodes.length) { event.preventDefault(); scope.focus(); return; }
    const first = nodes[0], last = nodes[nodes.length - 1], current = document.activeElement;
    if (event.shiftKey && (current === first || current === scope || !scope.contains(current))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (current === last || !scope.contains(current))) { event.preventDefault(); first.focus(); }
  };
  const keepFocus = (event: FocusEvent) => {
    const scope = dialog.value, target = event.target as Node | null;
    // Focus may move into a higher layer (popup, nested window) portaled elsewhere; only the page outside is refused.
    if (!scope || !target || scope.contains(target) || (target instanceof Element && target.closest(".kjun-scope.kjun-floating, .kjun-scope.kjun-modal-overlay, .kjun-scope.kjun-drawer-overlay, .kjun-tooltip"))) return;
    scope.focus({ preventScroll: true });
  };
  const stop = () => { for (const undo of release) undo(); release = []; };
  watch([active, root, dialog], ([isActive, element, scope]) => {
    stop();
    if (!isActive || !element || !scope) return;
    release.push(lockScroll(), hideOutside(element));
    document.addEventListener("keydown", contain, true);
    document.addEventListener("focusin", keepFocus);
    release.push(() => { document.removeEventListener("keydown", contain, true); document.removeEventListener("focusin", keepFocus); });
    // Like react-aria's Dialog: an [autofocus] child, otherwise the dialog itself.
    if (!scope.contains(document.activeElement))
      (scope.querySelector<HTMLElement>("[autofocus]") ?? scope).focus({ preventScroll: true });
  }, { flush: "post", immediate: true });
  onBeforeUnmount(stop);
}
