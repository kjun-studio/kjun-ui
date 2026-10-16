import { useEffect, useState } from "react";

/** True once a loading state has lasted `delay` ms, so a fast result never flashes the loading display. Always true without a delay. */
export function useLoadingReveal(active: boolean, delay = 0) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    if (!active || delay <= 0) return;
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);
  return delay <= 0 || revealed;
}
