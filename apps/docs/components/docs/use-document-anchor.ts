'use client';
import { useEffect } from 'react';

/** Keep a requested section in place while preceding async content settles. */
export function useDocumentAnchor(pageId: string) {
  useEffect(() => {
    let following = true;
    let frame = 0;
    const jump = () => {
      frame = 0;
      if (!following || !location.hash) return;
      let id: string;
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      document
        .getElementById(id)
        ?.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    const schedule = () => {
      if (following && !frame) frame = requestAnimationFrame(jump);
    };
    const begin = () => {
      following = true;
      schedule();
    };
    const release = () => {
      following = false;
    };
    const observer = new ResizeObserver(schedule);
    const main = document.getElementById('main-content');
    if (main) observer.observe(main);
    // Events inside preview documents do not bubble to this window.
    const previewInteraction = (event: MessageEvent) => {
      if (event.origin !== location.origin || !['kjun:catalog-focus', 'kjun:catalog-event'].includes(event.data?.type)) return;
      if (Array.from(main?.querySelectorAll('iframe') || []).some(frame => frame.contentWindow === event.source)) release();
    };
    window.addEventListener('message', previewInteraction);
    window.addEventListener('hashchange', begin);
    window.addEventListener('kjun:document-anchor', begin);
    for (const element of document.querySelectorAll('.topbar, .document-shortcuts')) observer.observe(element);
    // Never pull a reader back after scrolling, focusing or operating the page.
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
      window.addEventListener(event, release, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('message', previewInteraction);
      window.removeEventListener('hashchange', begin);
      window.removeEventListener('kjun:document-anchor', begin);
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown'])
        window.removeEventListener(event, release);
    };
  }, [pageId]);
}
