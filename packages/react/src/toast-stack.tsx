import { useLayerState } from "../../../shared/package-runtime/use-layer";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import type { createFeedbackController } from '@kjun-ui/tokens';
import { type PresentedToast } from '../../../shared/package-runtime/feedback-motion';
import { createToastLayout } from '../../../shared/package-runtime/toast-layout';
import { toastEdgeShift, type ToastPlacement } from '../../../shared/package-runtime/toast-placement';
import { toastPeekDepth } from '../../../shared/package-runtime/toast-presentation';
import { useToastStack } from '../../../shared/package-runtime/use-toast-stack';
import { attachToastStack, restoreToastFocus } from '../../../shared/package-runtime/toast-swipe';
import { ToastView } from './toast';
import { useReducedMotion } from './use-reduced-motion';

type Controller = ReturnType<typeof createFeedbackController>;
function ToastSurface({ item, controller, placement }: { item: PresentedToast; controller: Controller; placement: ToastPlacement }) {
  const ref = useRef<HTMLDivElement>(null), reduced = useReducedMotion();
  const current = useRef<{ opacity: string; transform: string } | null>(null);
  const entryFinished = useRef(false);
  // Where focus was when the toast appeared; it goes back there if the toast leaves while holding focus.
  const previous = useRef<Element | null>(null);
  useLayoutEffect(() => {
    previous.current = document.activeElement;
    // Reduced motion removes a toast without an exit phase, so its unmount restores focus too.
    const el = ref.current;
    return () => restoreToastFocus(el, previous.current);
  }, []);
  useLayoutEffect(() => { if (item.exiting) restoreToastFocus(ref.current, previous.current); }, [item.exiting]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) { entryFinished.current = true; return; }
    const elapsed = Date.now() - item.born;
    if (!item.exiting && (elapsed >= tokens.motion.toastEnter || entryFinished.current)) return;
    const hidden = `translateY(${toastEdgeShift(placement)}px)`, from = current.current;
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
  }, [item.exiting, item.born, reduced, placement]);
  return <div ref={ref} inert={item.exiting} aria-hidden={item.exiting || undefined}>
    <ToastView toast={item.toast} controller={controller} />
  </div>;
}
// One media query list for every stack, read on each render without creating a new one.
let narrowMedia: MediaQueryList | undefined;
const narrowList = () => (narrowMedia ??= matchMedia(`(width <= ${tokens.responsive.toast}px)`));
const subscribeNarrow = (notify: () => void) => {
  narrowList().addEventListener("change", notify);
  return () => narrowList().removeEventListener("change", notify);
};
export function ToastStack({ items, controller, placement = "top", offset = 0 }: { items: PresentedToast[]; controller: Controller; placement?: ToastPlacement; offset?: number }) {
  const layers = useLayerState(), m = useKjunMessages();
  const root = useRef<HTMLDivElement>(null), toggle = useRef<HTMLButtonElement>(null), layout = useRef(createToastLayout());
  const reduced = useReducedMotion();
  const narrow = useSyncExternalStore(subscribeNarrow, () => narrowList().matches, () => false);
  const { stack, expanded, setExpanded, announcement } = useToastStack(items, controller, { placement, narrow });
  const live = useRef({ expanded }); live.current.expanded = expanded;
  useEffect(() => root.current ? attachToastStack(root.current, {
    hold: reason => controller.holdAll(reason),
    release: reason => controller.releaseAll(reason),
    outside: () => setExpanded(false),
    // Escape folds an expanded stack and leaves focus on its toggle, which stays in place.
    escape: () => {
      if (!live.current.expanded) return false;
      setExpanded(false);
      toggle.current?.focus();
      return true;
    },
  }) : undefined, [controller, setExpanded]);
  useLayoutEffect(() => { if (root.current) layout.current.update(root.current, reduced); });
  useLayoutEffect(() => () => layout.current.destroy(), []);
  const depth = expanded ? 0 : toastPeekDepth(stack.behind);
  const more = stack.toggle && <button key="more" ref={toggle} type="button" className="kjun-toast-more" data-toast-more=""
    data-depth={depth} data-expanded={expanded || undefined} aria-expanded={expanded}
    aria-label={expanded ? m.collapseNotifications : `${m.showNotifications}, ${m.moreNotifications(stack.behind)}`}
    onClick={() => setExpanded(!expanded)} style={{ "--_kjun-toast-peek-depth": Math.max(1, depth) } as CSSProperties}>
    <span className="kjun-toast-more-count" aria-hidden="true">{expanded ? m.collapseNotifications : `+${stack.behind}`}</span>
  </button>;
  const slots = stack.items.map(item => <div key={item.toast.id}
    data-toast-id={item.toast.id} data-exiting={item.exiting} className="kjun-toast-slot">
    <ToastSurface item={item} controller={controller} placement={placement} />
  </div>);
  return <div ref={root} className="kjun-toast-stack" data-placement={placement} data-uniform={stack.uniform}
    data-folded={stack.folded || undefined} data-expanded={expanded || undefined}
    {...(items.length ? { role: "region", "aria-label": m.notifications } : {})}
    style={{ zIndex: layers.zIndex(layers.topWindow()?.id, "toast"), "--_kjun-toast-offset": `${Math.max(0, offset)}px` } as CSSProperties}>
    {placement === "bottom" && more}{slots}{placement !== "bottom" && more}
    {!!items.length && <div className="kjun-sr-only" role="status" aria-live="polite">{announcement}</div>}
  </div>;
}
