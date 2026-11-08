// Radio-group keyboard rules for DOM groups (Native Web's RadioGroup and single-choice list sections on every web
// platform): one Tab stop per group, and arrow keys move focus and select, skipping disabled radios.
const enabled = (node: HTMLElement) => !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true';

/** Wires the keyboard to a `role="radiogroup"` element; returns the cleanup. */
export function bindRadioKeyboard(group: HTMLElement) {
  const doc = group.ownerDocument;
  const radios = () => Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))
    .filter(node => node.closest('[role="radiogroup"]') === group);
  let previous = radios(), focused: HTMLElement | null = null;
  // Each element's own tabindex before the group took it over, restored on cleanup so a list that stops being a
  // group (or a radio that leaves it) is reachable by Tab again.
  const original = new Map<HTMLElement, string | null>();
  const setTabIndex = (node: HTMLElement, value: number) => {
    if (!original.has(node)) original.set(node, node.getAttribute('tabindex'));
    node.tabIndex = value;
  };
  const restore = (node: HTMLElement) => {
    const value = original.get(node);
    if (value === null) node.removeAttribute('tabindex'); else if (value !== undefined) node.setAttribute('tabindex', value);
    original.delete(node);
  };
  setTabIndex(group, -1);
  const sync = () => {
    const current = radios(), available = current.filter(enabled);
    const entry = available.find(node => node === doc.activeElement) ||
      available.find(node => node.getAttribute('aria-checked') === 'true') || available[0];
    original.forEach((_, node) => { if (node !== group && !current.includes(node)) restore(node); });
    current.forEach(node => setTabIndex(node, node === entry ? 0 : -1));
    if (focused && (!current.includes(focused) || !enabled(focused))) {
      const index = previous.indexOf(focused);
      const next = previous.slice(index + 1).find(node => current.includes(node) && enabled(node)) ||
        previous.slice(0, index).reverse().find(node => current.includes(node) && enabled(node)) || available[0];
      if ([focused, doc.body, group].includes(doc.activeElement as HTMLElement)) (next || group).focus();
      focused = next || null;
    }
    previous = current;
  };
  const focus = (event: FocusEvent) => {
    focused = radios().includes(event.target as HTMLElement) ? event.target as HTMLElement : null;
    sync();
  };
  const keydown = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || event.defaultPrevented) return;
    const available = radios().filter(enabled), index = available.indexOf(event.target as HTMLElement);
    if (index < 0) return;
    event.preventDefault(); event.stopPropagation();
    const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
    const next = available[(index + step + available.length) % available.length];
    next.focus(); next.click();
  };
  const observer = new MutationObserver(sync);
  observer.observe(group, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'aria-checked'] });
  doc.addEventListener('focusin', focus);
  group.addEventListener('keydown', keydown);
  sync();
  return () => {
    observer.disconnect(); doc.removeEventListener('focusin', focus); group.removeEventListener('keydown', keydown);
    Array.from(original.keys()).forEach(restore);
  };
}
