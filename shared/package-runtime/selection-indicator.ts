import { tokens } from '@kjun-ui/tokens';
// The controlled value remains the source of truth. Only the decorative background moves; the
// framework owns the lifecycle and calls update after each render.
export function selectionIndicator(root: HTMLElement, marker: HTMLElement, tabs = false) {
  let selected: HTMLElement | null = null, bounds = '', disposed = false;
  const observed = new Set<Element>();
  const observer = new ResizeObserver(() => update());
  // A hide/show within one frame can leave ResizeObserver's final size unchanged.
  const visibility = new MutationObserver(() => update());
  for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
    visibility.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'hidden', 'data-variant', 'data-density'] });
  }
  // Mark which edges clip options so CSS can fade them instead of cutting a label silently.
  function edges() {
    const start = root.scrollLeft > 1, end = root.scrollLeft + root.clientWidth < root.scrollWidth - 1;
    const next = start && end ? 'both' : start ? 'start' : end ? 'end' : '';
    if (next) root.dataset.overflow = next; else root.removeAttribute('data-overflow');
  }
  function update() {
    if (disposed) return;
    if (!tabs) edges();
    const buttons = [...root.querySelectorAll<HTMLElement>(tabs ? '[role="tab"]' : 'button')];
    for (const node of observed) if (!buttons.includes(node as HTMLElement) && node !== root) {
      observer.unobserve(node); observed.delete(node);
    }
    for (const node of [root, ...buttons]) if (!observed.has(node)) {
      // Padding changes can leave the content box unchanged.
      observer.observe(node, { box: 'border-box' }); observed.add(node);
    }
    const next = buttons.find(button => button.getAttribute(tabs ? 'aria-selected' : 'aria-pressed') === 'true') || null;
    if (!next || !next.offsetWidth || !next.offsetHeight) {
      root.removeAttribute('data-indicator'); marker.hidden = true;
      selected = null; bounds = ''; return;
    }
    const underline = tabs && root.closest('[data-variant="underline"]');
    const style = getComputedStyle(next);
    const left = underline ? parseFloat(style.paddingLeft) : 0;
    const right = underline ? parseFloat(style.paddingRight) : 0;
    const height = underline ? tokens.extensions.tabs.indicatorHeight : next.offsetHeight;
    const key = [!!underline, left, right, next.offsetLeft, next.offsetTop, next.offsetWidth, next.offsetHeight].join(',');
    if (key !== bounds) {
      marker.dataset.animate = String(!!selected && selected !== next);
      marker.style.transform = `translateX(${next.offsetLeft + left}px)`;
      marker.style.top = (underline ? next.offsetTop + next.offsetHeight - height : next.offsetTop) + 'px';
      marker.style.width = Math.max(0, next.offsetWidth - left - right) + 'px';
      marker.style.height = height + 'px';
    }
    marker.hidden = false; root.dataset.indicator = 'true';
    selected = next; bounds = key;
  }
  update();
  if (!tabs) root.addEventListener('scroll', edges, { passive: true });
  document.fonts?.addEventListener('loadingdone', update);
  return { update, destroy() {
    disposed = true; observer.disconnect(); visibility.disconnect();
    root.removeEventListener('scroll', edges);
    document.fonts?.removeEventListener('loadingdone', update);
  } };
}
