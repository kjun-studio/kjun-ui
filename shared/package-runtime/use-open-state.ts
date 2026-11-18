import { useState } from "react";

/** A popup's open state: controlled when `open` is a boolean, otherwise kept here; a disabled field reads closed. */
export function useOpenState(controlled: boolean | undefined, disabled: boolean, onOpenChange?: (open: boolean) => void) {
  const [internal, setInternal] = useState(false);
  const isControlled = typeof controlled === "boolean";
  const open = !disabled && (isControlled ? controlled : internal);
  const change = (next: boolean) => {
    if (next === open || (next && disabled)) return;
    if (!isControlled) setInternal(next);
    onOpenChange?.(next);
  };
  return [open, change] as const;
}
