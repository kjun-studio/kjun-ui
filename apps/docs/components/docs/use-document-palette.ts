'use client';
import { useSyncExternalStore } from 'react';

// Previews follow the document's light/dark mode. The docs app owns this mapping;
// the packages only receive the demo palette the docs chose.
const darkQuery = '(prefers-color-scheme: dark)';
const subscribe = (change: () => void) => {
  const query = matchMedia(darkQuery);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};
export const useDocumentPalette = () => useSyncExternalStore(subscribe,
  () => matchMedia(darkQuery).matches ? 'dark' as const : 'default' as const,
  () => 'default' as const);

/** Narrow-viewport flag for layouts that change structure, not only styling. */
export function useMediaQuery(query: string, server = false) {
  return useSyncExternalStore(change => {
    const list = matchMedia(query);
    list.addEventListener('change', change);
    return () => list.removeEventListener('change', change);
  }, () => matchMedia(query).matches, () => server);
}
