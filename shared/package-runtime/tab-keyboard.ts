// Browser-only adapter shared by Vue and Native Web. Selection stays controlled.
export function manageTabList(list: HTMLElement, select: (name: string) => void, keyboard = true) {
  const doc = list.ownerDocument;
  const tabs = () => Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
  const enabled = (tab: HTMLElement) => !tab.hasAttribute('disabled') && tab.getAttribute('aria-disabled') !== 'true';
  let previous = tabs(), focused: HTMLElement | null = null;
  list.tabIndex = -1;
  function reveal(tab: HTMLElement) {
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }
  function sync() {
    const current = tabs(), available = current.filter(enabled);
    const entry = available.find(tab => tab.getAttribute('aria-selected') === 'true') || available[0];
    current.forEach(tab => { tab.tabIndex = tab === entry ? 0 : -1; });
    if (focused && (!current.includes(focused) || !enabled(focused))) {
      const index = previous.indexOf(focused);
      const next = previous.slice(index + 1).find(tab => current.includes(tab) && enabled(tab)) ||
        previous.slice(0, index).reverse().find(tab => current.includes(tab) && enabled(tab)) || available[0];
      // Removing the active node sends focus to body without a focusin event.
      if (doc.activeElement === focused || doc.activeElement === doc.body || doc.activeElement === list) {
        (next || list).focus();
        if (next) reveal(next);
      }
      focused = next || null;
    }
    previous = current;
  }
  function focus(event: FocusEvent) {
    const target = event.target as HTMLElement;
    focused = tabs().includes(target) ? target : null;
    if (focused) reveal(focused);
  }
  function key(event: KeyboardEvent) {
    const available = tabs().filter(enabled), target = event.target as HTMLElement;
    const index = available.indexOf(target);
    // Native Web's generic press responder only handles Space for button roles.
    // Own activation for its div tabs and stop the responder from emitting twice.
    if (index >= 0 && target.tagName !== 'BUTTON' && ['Enter', ' '].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat) select(target.dataset.tabName!);
      return;
    }
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1)! :
      available[(index + (event.key === 'ArrowRight' ? 1 : -1) + available.length) % available.length];
    next.focus();
    reveal(next);
    select(next.dataset.tabName!);
  }
  const observer = new MutationObserver(sync);
  observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'aria-selected'] });
  doc.addEventListener('focusin', focus);
  if (keyboard) list.addEventListener('keydown', key);
  sync();
  return () => { observer.disconnect(); doc.removeEventListener('focusin', focus); list.removeEventListener('keydown', key); };
}

// A panel starts with either readable content or a control. Text needs its own
// keyboard stop; a first control already provides one. Ignore decorative nodes.
export function panelNeedsFocus(panel: HTMLElement): boolean {
  function visit(node: Node): boolean | undefined {
    if (node.nodeType === 3) return node.textContent?.trim() ? true : undefined;
    if (!(node instanceof HTMLElement)) return undefined;
    if (node.hidden || node.getAttribute('aria-hidden') === 'true' || getComputedStyle(node).display === 'none') return undefined;
    if (node.tabIndex >= 0 && !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true') return false;
    for (const child of node.childNodes) { const result = visit(child); if (result !== undefined) return result; }
    return undefined;
  }
  for (const child of panel.childNodes) { const result = visit(child); if (result !== undefined) return result; }
  return true;
}
