import { useLayerState } from "../../../shared/package-runtime/use-layer";
import { tokens } from "@kjun/tokens";
import { useLayoutEffect, useRef } from 'react';
import type { createFeedbackController } from '@kjun/tokens';
import { type PresentedToast } from '../../../shared/package-runtime/feedback-motion';
import { createToastLayout } from '../../../shared/package-runtime/toast-layout';
import { ToastView } from './toast';
import { useReducedMotion } from './use-reduced-motion';

function ToastSurface({ item, controller }: { item: PresentedToast; controller: ReturnType<typeof createFeedbackController> }) {
  const ref = useRef<HTMLDivElement>(null), reduced = useReducedMotion();
  const current = useRef<{ opacity: string; transform: string } | null>(null);
  const entryFinished = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) { entryFinished.current = true; return; }
    const elapsed = Date.now() - item.born;
    if (!item.exiting && (elapsed >= tokens.motion.toastEnter || entryFinished.current)) return;
    const hidden = `translateY(${-tokens.motionDistance.toast}px)`, from = current.current;
    // Exit opacity fades linearly and ends before the movement, matching layer exits.
    const animations = item.exiting ? [
      el.animate([{ opacity: from?.opacity ?? '1' }, { opacity: 0 }], { duration: tokens.motion.fadeExit, easing: tokens.motion.easeLinear, fill: 'both' }),
      el.animate([{ transform: from?.transform ?? 'translateY(0)' }, { transform: hidden }], { duration: tokens.motion.toastExit, easing: tokens.motion.easeIn, fill: 'both' }),
    ] : [el.animate([{ opacity: 0, transform: hidden }, { opacity: 1, transform: 'translateY(0)' }], {
      duration: tokens.motion.toastEnter, delay: -elapsed, easing: tokens.motion.easeOut, fill: 'both',
    })];
    animations[0].onfinish = () => { if (!item.exiting) entryFinished.current = true; };
    return () => {
      const style = getComputedStyle(el);
      current.current = { opacity: style.opacity, transform: style.transform };
      for (const animation of animations) animation.cancel();
    };
  }, [item.exiting, item.born, reduced]);
  return <div ref={ref} inert={item.exiting} aria-hidden={item.exiting || undefined}>
    <ToastView toast={item.toast} controller={controller} />
  </div>;
}
export function ToastStack({ items, controller }: { items: PresentedToast[]; controller: ReturnType<typeof createFeedbackController> }) {
  const layers = useLayerState();
  const root = useRef<HTMLDivElement>(null), layout = useRef(createToastLayout());
  const reduced = useReducedMotion();
  useLayoutEffect(() => { if (root.current) layout.current.update(root.current, reduced); });
  useLayoutEffect(() => () => layout.current.destroy(), []);
  return <div ref={root} className="kjun-toast-stack" style={{ zIndex: layers.zIndex(layers.topWindow()?.id, "toast") }}>{items.map(item => <div key={item.toast.id}
    data-toast-id={item.toast.id} data-exiting={item.exiting} className="kjun-toast-slot">
    <ToastSurface item={item} controller={controller} />
  </div>)}</div>;
}
