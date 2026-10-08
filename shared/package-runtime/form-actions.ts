/** Keep the row only while both intrinsic button widths fit in its container. */
export function formActionsNeedStack(width: number, widths: number[], gap: number) {
  return width > 0 && widths.length > 1 && widths.every(value => value > 0) &&
    widths.reduce((sum, value) => sum + value, gap * (widths.length - 1)) > width + 0.5;
}

export function observeFormActions(root: HTMLElement) {
  const doc = root.ownerDocument, view = doc.defaultView!;
  let disposed = false;
  const measure = () => {
    if (disposed || !root.isConnected) return;
    const buttons = Array.from(root.children).filter((node): node is HTMLElement => node instanceof view.HTMLElement);
    const probe = doc.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap', width: 'max-content', left: '0', top: '0' });
    doc.body.appendChild(probe);
    const widths = buttons.map(button => {
      const label = button.querySelector('.kjun-button-label') || button;
      const text = view.getComputedStyle(label), box = view.getComputedStyle(button);
      for (const key of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'fontVariant', 'fontFeatureSettings', 'fontVariationSettings', 'letterSpacing', 'wordSpacing', 'textTransform'] as const)
        probe.style[key] = text[key];
      probe.textContent = label.textContent;
      return Math.max(parseFloat(box.minWidth) || 0, probe.getBoundingClientRect().width + ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
        .reduce((sum, key) => sum + (parseFloat(box.getPropertyValue(key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()))) || 0), 0));
    });
    probe.remove();
    const stack = formActionsNeedStack(root.clientWidth, widths, parseFloat(view.getComputedStyle(root).columnGap) || 0);
    root.toggleAttribute('data-stacked', stack);
  };
  const resize = new ResizeObserver(measure);
  resize.observe(root);
  const content = new MutationObserver(measure);
  content.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'data-size', 'data-variant'] });
  // Consumer font values may change without changing the container's width.
  const ancestors = new MutationObserver(measure);
  for (let node = root.parentElement; node; node = node.parentElement)
    ancestors.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
  doc.fonts?.addEventListener('loadingdone', measure);
  void doc.fonts?.ready.then(measure);
  measure();
  return () => {
    disposed = true;
    resize.disconnect(); content.disconnect(); ancestors.disconnect();
    doc.fonts?.removeEventListener('loadingdone', measure);
  };
}
