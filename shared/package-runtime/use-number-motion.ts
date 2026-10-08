import { useLayoutEffect, useRef, useState } from 'react';
import { createNumberMotion } from './number-motion';

export function useNumberMotion(value: number | string, animated: boolean, fromPrevious: boolean, reduced: boolean) {
  const [display, setDisplay] = useState<number | string>(typeof value === 'string' || fromPrevious || !animated || reduced ? value : 0);
  const motion = useRef<ReturnType<typeof createNumberMotion> | null>(null);
  if (!motion.current) motion.current = createNumberMotion(setDisplay);
  useLayoutEffect(() => {
    if (!motion.current) motion.current = createNumberMotion(setDisplay);
    motion.current!.update(value, animated, fromPrevious, reduced);
  }, [value, animated, fromPrevious, reduced]);
  useLayoutEffect(() => () => { motion.current?.cancel(); motion.current = null; }, []);
  return display;
}
