import { tokens } from "@kjun/tokens";
import { useLayoutEffect, useRef, useState } from 'react';

// Only presentation is delayed. The caller's value and event timing stay synchronous.
export function usePresence(open: boolean, reduced: boolean, exitDuration: number = tokens.motion.layerExit) {
  const [retained, setRetained] = useState(open);
  const [active, setActive] = useState(false);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    let first = 0, second = 0, timer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      setRetained(true);
      if (reduced || mounted.current) setActive(true);
      else first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setActive(true)); });
      mounted.current = true;
    } else {
      setActive(false);
      const finish = () => { mounted.current = false; setRetained(false); };
      if (reduced) finish(); else timer = setTimeout(finish, exitDuration);
    }
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  }, [open, reduced, exitDuration]);
  return { present: open || retained, active: open && active };
}
