import { useLayoutEffect, useRef } from 'react';
import { selectionIndicator } from '../../../shared/package-runtime/selection-indicator';

// The controlled value remains the source of truth. Only the decorative background moves.
export function useSelectionIndicator(tabs = false) {
  const group = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const sync = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const root = group.current, marker = indicator.current;
    if (!root || !marker) return;
    const handle = selectionIndicator(root, marker, tabs);
    sync.current = handle.update;
    return () => { handle.destroy(); sync.current = () => {}; };
  }, [tabs]);
  useLayoutEffect(() => sync.current());
  return { group, indicator };
}
