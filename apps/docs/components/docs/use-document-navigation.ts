'use client';
import { useLayoutEffect, useState, type MouseEvent } from 'react';
import type { DiscoveryDocument } from '@/lib/discovery';

export function followDocumentAnchor(event: MouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(event.currentTarget.hash.slice(1));
  target?.focus({ preventScroll: true });
  // Native anchors own history. This also re-arms alignment for the same hash.
  window.dispatchEvent(new Event('kjun:document-anchor'));
}

export function useDocumentNavigation(page: DiscoveryDocument) {
  const [active, setActive] = useState(page.sections[0]?.[0] || '');
  useLayoutEffect(() => {
    const main = document.getElementById('main-content');
    const body = main?.closest<HTMLElement>('.doc-body');
    const header = document.querySelector<HTMLElement>('.topbar');
    const navigation = document.querySelector<HTMLElement>('.document-shortcuts');
    if (!main || !body || !header) return;
    let frame = 0;
    const originals = new Map<HTMLElement, string | null>();
    const update = () => {
      frame = 0;
      const headerHeight = header.getBoundingClientRect().height;
      const offset = headerHeight + (navigation?.getBoundingClientRect().height || 0) + 16;
      body.style.setProperty('--document-header-height', headerHeight + 'px');
      body.style.setProperty('--document-offset', offset + 'px');
      const targets = page.sections.flatMap(([id]) => {
        const element = document.getElementById(id);
        if (!element) return [];
        if (!originals.has(element)) {
          originals.set(element, element.getAttribute('tabindex'));
          element.setAttribute('tabindex', '-1');
          element.classList.add('document-anchor');
        }
        return [element];
      });
      let current = targets[0]?.id || '';
      for (const target of targets) if (target.getBoundingClientRect().top <= offset + 2) current = target.id;
      if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2) current = targets.at(-1)?.id || current;
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(main); observer.observe(header);
    if (navigation) observer.observe(navigation);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
      for (const [element, tabIndex] of originals) {
        element.classList.remove('document-anchor');
        if (tabIndex === null) element.removeAttribute('tabindex'); else element.setAttribute('tabindex', tabIndex);
      }
    };
  }, [page]);
  return active;
}
