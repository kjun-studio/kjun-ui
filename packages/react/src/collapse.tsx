import { tokens } from "@kjun-ui/tokens";
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from './use-reduced-motion';

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [retained, setRetained] = useState(open);
  const root = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const previous = useRef(open);
  const interrupted = useRef<number | null>(null);
  const present = open || retained;
  useLayoutEffect(() => {
    const el = root.current, inner = body.current;
    if (!el || !inner) return;
    let disposed = false;
    const wasOpen = previous.current;
    previous.current = open;
    let lastHeight = inner.getBoundingClientRect().height;
    const run = (from?: number) => {
      const start = from ?? interrupted.current ?? (animation.current ? el.getBoundingClientRect().height : wasOpen ? el.getBoundingClientRect().height : 0);
      interrupted.current = null;
      animation.current?.cancel();
      const end = open ? inner.getBoundingClientRect().height : 0;
      const finish = () => {
        if (disposed) return;
        el.style.height = open ? 'auto' : '0px'; animation.current = null;
        setRetained(open);
      };
      if (reduced || start === end) { finish(); return; }
      el.style.height = end + 'px';
      const transition = el.animate([{ height: start + 'px' }, { height: end + 'px' }], {
        duration: tokens.motion.collapse, easing: tokens.motion.easeOut,
      });
      animation.current = transition;
      transition.onfinish = finish;
    };
    if (open) setRetained(true);
    run(wasOpen === open && !animation.current && interrupted.current === null ? lastHeight : undefined);
    const observer = new ResizeObserver(() => {
      const height = inner.getBoundingClientRect().height;
      if (open && height !== lastHeight) run(animation.current ? undefined : lastHeight);
      lastHeight = height;
    });
    observer.observe(inner);
    return () => {
      disposed = true; observer.disconnect();
      if (animation.current) {
        const height = el.getBoundingClientRect().height;
        interrupted.current = height;
        animation.current.cancel(); animation.current = null; el.style.height = height + 'px';
      }
    };
  }, [open, reduced, present]);
  return present ? <div ref={root} className="kjun-motion-collapse" inert={!open} aria-hidden={!open || undefined}>
    <div ref={body}>{children}</div>
  </div> : null;
}
