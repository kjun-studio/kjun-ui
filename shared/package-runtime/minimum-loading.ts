import { useEffect, useRef, useState } from "react";
import { tokens } from "@kjun-ui/tokens";

/** Keeps a loading state visible for the token minimum so a fast request does not flash. React and Native; Vue 3 keeps
 * its own form in packages/vue3/src/button.tsx. */
export function useMinimumLoading(loading: boolean) {
  const [active, setActive] = useState(loading);
  const began = useRef(loading ? Date.now() : 0);
  useEffect(() => {
    if (loading) {
      began.current = Date.now();
      setActive(true);
      return;
    }
    const timer = setTimeout(() => setActive(false), Math.max(0, tokens.button.loadingMinimum - (Date.now() - began.current)));
    return () => clearTimeout(timer);
  }, [loading]);
  return loading || active;
}
