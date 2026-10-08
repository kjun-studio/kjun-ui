import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';
import { createToastLayout } from '../../../shared/package-runtime/toast-layout';

// Native Web's onLayout observes size changes, so position-only reflow needs DOM measurement.
export function useToastReflow(root: RefObject<View | null>, reduced: boolean) {
  const layout = useRef(createToastLayout()).current;
  useLayoutEffect(() => {
    if (root.current) layout.update(root.current as unknown as HTMLElement, reduced);
  });
  useLayoutEffect(() => () => layout.destroy(), [layout]);
}
