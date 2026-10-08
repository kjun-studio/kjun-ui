import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';
import { manageTabList, panelNeedsFocus } from '../../../shared/package-runtime/tab-keyboard';
export function useTabKeyboard(root: RefObject<View | null>, select: (name: string) => void) {
  const callback = useRef(select);
  callback.current = select;
  useLayoutEffect(() => {
    const list = (root.current as unknown as HTMLElement)?.querySelector<HTMLElement>('[role="tablist"]');
    if (list) return manageTabList(list, name => callback.current(name));
  }, [root]);
}
export function usePanelFocus(root: RefObject<View | null>) {
  useLayoutEffect(() => {
    const panel = root.current as unknown as HTMLElement | null;
    if (panel) panel.tabIndex = panelNeedsFocus(panel) ? 0 : -1;
  });
}
