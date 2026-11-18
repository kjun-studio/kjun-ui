import { useCallback, useEffect, useRef, useState } from "react";
import { isPending } from "./clipboard";

/** Runs a handler and stays pending until a returned promise settles (RefreshButton's automatic loading).
 * A plain handler result leaves it idle. Vue keeps its own form in runtime/pending-action.ts. */
export function usePendingAction() {
  const [pending, setPending] = useState(false),
    mounted = useRef(true),
    runs = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const run = useCallback((action: (() => unknown) | undefined) => {
    const result = action?.();
    if (!isPending(result)) return;
    const id = ++runs.current;
    setPending(true);
    const settle = () => { if (mounted.current && id === runs.current) setPending(false); };
    // A rejection stops the spinner and is rethrown, so it still reaches the app's unhandled-rejection report.
    result.then(settle, error => { settle(); throw error; });
  }, []);
  return { pending, run };
}
