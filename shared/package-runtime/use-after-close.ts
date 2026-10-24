import { useCallback, useEffect, useRef } from "react";

/** Calls onAfterClose once when a layer leaves the screen (present true → false). A reopen during the exit keeps
 * present true, so it reports nothing; a layer mounted closed reports nothing either. */
export function useAfterClose(present: boolean, onAfterClose?: () => void, enabled = true) {
  const was = useRef(present), callback = useRef(onAfterClose);
  callback.current = onAfterClose;
  useEffect(() => {
    if (was.current && !present && enabled) callback.current?.();
    was.current = present;
  }, [present, enabled]);
}

/** Web overlays can outlive present by a render (react-aria finishes its exit first), so this reports when the
 * overlay element itself leaves the DOM while closed. Attach the returned ref to the overlay. */
export function useAfterCloseRef(open: boolean, onAfterClose?: () => void) {
  const state = useRef({ open, mounted: false, callback: onAfterClose });
  state.current.open = open;
  state.current.callback = onAfterClose;
  return useCallback((node: Element | null) => {
    const current = state.current;
    if (node) current.mounted = true;
    else if (current.mounted) {
      current.mounted = false;
      // React detaches the ref before it removes the node in the same commit; report after the commit.
      queueMicrotask(() => { if (!current.open && !current.mounted) current.callback?.(); });
    }
  }, []);
}
