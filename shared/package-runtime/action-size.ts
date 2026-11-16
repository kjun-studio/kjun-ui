import { createContext, useContext } from 'react';
import type { ButtonSize } from '@kjun-ui/tokens';

export { alertActionSizes, popoverActionSize } from './alert-action-size';

/** A container's default size for buttons that leave `size` unset; an explicit size always wins. */
export const ActionSizeContext = createContext<ButtonSize | null>(null);
export function useActionSize(requested: ButtonSize | undefined, fallback: ButtonSize): ButtonSize {
  const inherited = useContext(ActionSizeContext);
  return requested ?? inherited ?? fallback;
}

/** A container that draws its buttons as pills (a floating action bar); a button's own circle or pill shape is unaffected. */
export const ActionShapeContext = createContext<"pill" | null>(null);
/** Whether a button rounds to a pill: by its own shape, or because its container says so. */
export function useActionPill(shape: "default" | "circle" | "pill"): boolean {
  return useContext(ActionShapeContext) === "pill" || shape !== "default";
}
