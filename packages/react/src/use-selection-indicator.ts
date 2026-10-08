import { tokens } from '@kjun-ui/tokens';
import { useLayoutEffect, useRef } from 'react';

// The controlled value remains the source of truth. Only the decorative background moves.
export function useSelectionIndicator(tabs = false) {
  const group = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const sync = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const root = group.current!, marker = indicator.current!;
    if (!root || !marker) return;
    let selected: HTMLElement | null = null;
    let bounds = '';
    let disposed = false;
    const observer = new ResizeObserver(() => update());
    // A hide/show within one frame can leave ResizeObserver's final size unchanged.
    const visibility = new MutationObserver(() => update());
    for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
      visibility.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'hidden', 'data-variant', 'data-density'] });
    }
    const observed = new Set<Element>();
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
    sync.current = update;
    update();
    if (!tabs) root.addEventListener('scroll', edges, { passive: true });
    document.fonts?.addEventListener('loadingdone', update);
    return () => {
      disposed = true; observer.disconnect(); visibility.disconnect(); sync.current = () => {};
      root.removeEventListener('scroll', edges);
      document.fonts?.removeEventListener('loadingdone', update);
    };
  }, [tabs]);
  useLayoutEffect(() => sync.current());
  return { group, indicator };
}
