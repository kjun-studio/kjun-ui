import { useLayoutEffect, type RefObject } from 'react';
import type { View } from 'react-native';

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
    if (!group) return;
    const doc = group.ownerDocument;
    const radios = () => Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))
      .filter(node => node.closest('[role="radiogroup"]') === group);
    let previous = radios(), focused: HTMLElement | null = null;
    group.tabIndex = -1;
    const sync = () => {
      const current = radios(), available = current.filter(enabled);
      const entry = available.find(node => node === doc.activeElement) ||
        available.find(node => node.getAttribute('aria-checked') === 'true') || available[0];
      current.forEach(node => { node.tabIndex = node === entry ? 0 : -1; });
      if (focused && (!current.includes(focused) || !enabled(focused))) {
        const index = previous.indexOf(focused);
        const next = previous.slice(index + 1).find(node => current.includes(node) && enabled(node)) ||
          previous.slice(0, index).reverse().find(node => current.includes(node) && enabled(node)) || available[0];
        if ([focused, doc.body, group].includes(doc.activeElement as HTMLElement)) (next || group).focus();
        focused = next || null;
      }
      previous = current;
    };
    const focus = (event: FocusEvent) => {
      focused = radios().includes(event.target as HTMLElement) ? event.target as HTMLElement : null;
      sync();
    };
    const keydown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || event.defaultPrevented) return;
      const available = radios().filter(enabled), index = available.indexOf(event.target as HTMLElement);
      if (index < 0) return;
      event.preventDefault(); event.stopPropagation();
      const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = available[(index + step + available.length) % available.length];
      next.focus(); next.click();
    };
    const observer = new MutationObserver(sync);
    observer.observe(group, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'aria-checked'] });
    doc.addEventListener('focusin', focus);
    group.addEventListener('keydown', keydown);
    sync();
    return () => { observer.disconnect(); doc.removeEventListener('focusin', focus); group.removeEventListener('keydown', keydown); };
  }, [root]);
}
