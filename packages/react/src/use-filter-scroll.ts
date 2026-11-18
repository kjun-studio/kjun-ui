import { useLayoutEffect, useRef } from "react";
import { trackFilterScroll } from "../../../shared/package-runtime/filter-scroll";

/**
 * Scroll mode: fades the row's clipped edges and keeps the selected chip in view. In single mode it follows the value;
 * in multiple mode it reveals only on mount, so turning a chip off does not pull the row elsewhere.
 */
export function useFilterScroll(scroll: boolean, multiple: boolean, value: unknown) {
  const root = useRef<HTMLDivElement>(null), tracker = useRef<ReturnType<typeof trackFilterScroll> | undefined>(undefined);
  useLayoutEffect(() => {
    const row = root.current;
    if (!scroll || !row) return;
    tracker.current = trackFilterScroll(row);
    tracker.current.reveal();
    return () => { tracker.current?.destroy(); tracker.current = undefined; };
  }, [scroll]);
  useLayoutEffect(() => {
    if (!multiple) tracker.current?.reveal();
  }, [multiple ? null : value]);
  return root;
}
