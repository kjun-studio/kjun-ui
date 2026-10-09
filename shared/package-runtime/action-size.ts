import { createContext, useContext } from 'react';
import type { ButtonSize } from '@kjun-ui/tokens';

export { alertActionSizes } from './alert-action-size';

/** A container's default size for buttons that leave `size` unset; an explicit size always wins. */
export const ActionSizeContext = createContext<ButtonSize | null>(null);
export function useActionSize(requested: ButtonSize | undefined, fallback: ButtonSize): ButtonSize {
  const inherited = useContext(ActionSizeContext);
  return requested ?? inherited ?? fallback;
}
