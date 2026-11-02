import { useEffect, useRef } from "react";
import { skeletonPhase } from "../../../shared/package-runtime/skeleton-text";
/** Puts a skeleton on the shared pulse clock once it mounts, so skeletons that appear later still pulse together. */
export function useSkeletonPhase(active = true) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) ref.current?.style.setProperty("--_kjun-skeleton-delay", skeletonPhase());
  }, [active]);
  return ref;
}
