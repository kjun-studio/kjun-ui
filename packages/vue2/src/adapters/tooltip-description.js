/** Keep the description on slotted controls, preserving descriptions owned by the app. */
export function connectTooltipDescription(root, id, active) {
  let connected = new Set();
  const update = (node, include) => {
    const before = node.getAttribute('aria-describedby');
    const ids = (before || '').split(/\s+/).filter(value => value && (include || value !== id));
    if (include && !ids.includes(id)) ids.push(id);
    const after = ids.join(' ') || null;
    if (before === after) return;
    if (after) node.setAttribute('aria-describedby', after);
    else node.removeAttribute('aria-describedby');
  };
  const sync = () => {
    const controls = [...root.querySelectorAll('button,a[href],input,select,textarea,[tabindex],[role="button"]')]
      .filter(node => !node.closest('[role="tooltip"]'));
    if (root.tabIndex >= 0) controls.unshift(root);
    const fallback = root.firstElementChild;
    const candidates = controls.length ? controls : fallback && fallback.getAttribute('role') !== 'tooltip' ? [fallback] : [];
    const targets = new Set(active() ? candidates : []);
    for (const node of connected) if (!targets.has(node)) update(node, false);
    for (const node of targets) update(node, true);
    connected = targets;
  };
  const observer = new MutationObserver(sync);
  observer.observe(root, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['aria-describedby', 'tabindex', 'href', 'role'] });
  sync();
  return { sync, destroy() {
    observer.disconnect();
    for (const node of connected) update(node, false);
    connected.clear();
  } };
}
