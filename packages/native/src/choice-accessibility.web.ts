import { useLayoutEffect, type RefObject } from 'react';
import type { View } from 'react-native';
import { bindRadioKeyboard } from '../../../shared/package-runtime/radio-keyboard';

const enabled = (node: HTMLElement) => !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true';

/** RN Web handles Enter, but its generic press responder omits Space for these roles. */
export function useChoiceSpace(root: RefObject<View | null>, role?: string, disabled?: boolean) {
  useLayoutEffect(() => {
    const node = root.current as unknown as HTMLElement | null;
    if (!node || disabled || !['checkbox', 'radio', 'switch'].includes(role || '') || /^(BUTTON|INPUT)$/.test(node.tagName)) return;
    let armed = false;
    const cancel = () => { armed = false; };
    const keydown = (event: KeyboardEvent) => {
      if (event.target !== node || event.key !== ' ' || event.defaultPrevented) return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat && enabled(node)) armed = true;
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.target !== node || event.key !== ' ') return;
      event.preventDefault(); event.stopPropagation();
      const activate = armed && enabled(node) && node.ownerDocument.activeElement === node;
      cancel();
      // Reuse the press responder's click path so pointer and keyboard have one callback.
      if (activate) node.click();
    };
    node.addEventListener('keydown', keydown, true);
    node.addEventListener('keyup', keyup, true);
    node.addEventListener('blur', cancel);
    return () => {
      cancel();
      node.removeEventListener('keydown', keydown, true);
      node.removeEventListener('keyup', keyup, true);
      node.removeEventListener('blur', cancel);
    };
  }, [root, role, disabled]);
}

/** One Tab stop per group; arrow navigation follows focus even if selection is refused. */
export function useRadioKeyboard(root: RefObject<View | null>) {
  useLayoutEffect(() => {
    const group = root.current as unknown as HTMLElement | null;
    return group ? bindRadioKeyboard(group) : undefined;
  }, [root]);
}
