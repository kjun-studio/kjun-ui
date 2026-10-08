import { Fragment, isValidElement, type ReactNode } from 'react';

/** Empty arrays and fragments should not create a padded content section. */
export function hasContent(node: ReactNode): boolean {
  if (node == null || typeof node === 'boolean') return false;
  if (typeof node === 'string') return node.trim().length > 0;
  if (Array.isArray(node)) return node.some(hasContent);
  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment)
    return hasContent(node.props.children);
  return true;
}
