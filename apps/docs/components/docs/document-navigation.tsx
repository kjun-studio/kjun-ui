'use client';
import { useLayoutEffect, useRef } from 'react';
import type { DiscoveryDocument } from '@/lib/discovery';
import { followDocumentAnchor } from './use-document-navigation';

export function DocumentShortcuts({ page, active }: { page: DiscoveryDocument; active: string }) {
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    // Reveal the active link without moving the document's vertical position.
    const reveal = () => {
      const link = element.querySelector<HTMLElement>('[aria-current]');
      if (!link || element.scrollWidth <= element.clientWidth) return;
      const bounds = element.getBoundingClientRect(), target = link.getBoundingClientRect();
      if (target.left < bounds.left + 4) element.scrollLeft -= bounds.left + 4 - target.left;
      else if (target.right > bounds.right - 4) element.scrollLeft += target.right - bounds.right + 4;
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, page]);
  if (!page.sectionGroups) return null;
  return <nav className="document-shortcuts" aria-label="상세 문서 바로가기">
    <div className="document-shortcuts-list" ref={list}>
      {page.sectionGroups.map(group => <a key={group.id} href={'#' + group.sections[0]} onClick={followDocumentAnchor}
        aria-current={group.sections.includes(active) ? 'location' : undefined}>
        {group.title}
      </a>)}
    </div>
  </nav>;
}
