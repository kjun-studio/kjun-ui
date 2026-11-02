import { toastEdgeShift, type ToastPlacement } from "../../../shared/package-runtime/toast-placement";
import { orderToasts } from "../../../shared/package-runtime/toast-presentation";
import { restoreToastFocus } from "../../../shared/package-runtime/toast-swipe";
import { createToastLayout } from "../../../shared/package-runtime/toast-layout";
import { defineComponent, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, watch, type PropType } from "vue";
import { createFeedbackController, tokens, type ToastItem } from "@kjun-ui/tokens";
import { useLayerContext } from "./runtime/layers";
import { useReducedMotion } from "./runtime/presence";
import { ToastView } from "./toast";

type Controller = ReturnType<typeof createFeedbackController>;
export interface PresentedToast { toast: ToastItem; exiting: boolean; born: number }
export function usePresentedToasts(toasts: () => ToastItem[], reduced: () => boolean) {
  const items = shallowRef<PresentedToast[]>([]);
  const removals = new Map<number, ReturnType<typeof setTimeout>>();
  watch([toasts, reduced], ([current, isReduced]) => {
    const ids = new Set(current.map(toast => toast.id));
    const old = new Map(items.value.map(item => [item.toast.id, item]));
    const next = current.map(toast => ({ toast, exiting: false, born: old.get(toast.id)?.born ?? Date.now() }));
    for (const item of items.value) if (!ids.has(item.toast.id) && !isReduced) {
      next.push({ ...item, exiting: true });
      if (!removals.has(item.toast.id)) removals.set(item.toast.id, setTimeout(() => {
        removals.delete(item.toast.id);
        items.value = items.value.filter(value => value.toast.id !== item.toast.id);
      }, tokens.motion.toastExit));
    }
    items.value = next;
    if (isReduced) { for (const timer of removals.values()) clearTimeout(timer); removals.clear(); }
  }, { immediate: true });
  onBeforeUnmount(() => { for (const timer of removals.values()) clearTimeout(timer); removals.clear(); });
  return items;
}
const ToastSurface = defineComponent({
  name: "KjunToastSurface",
  props: { item: { type: Object as PropType<PresentedToast>, required: true }, controller: { type: Object as PropType<Controller>, required: true },
    placement: { type: String as PropType<ToastPlacement>, default: "top" } },
  setup(props) {
    const el = ref<HTMLElement | null>(null), reduced = useReducedMotion();
    let current: { opacity: string; transform: string } | null = null, entryFinished = false, animations: Animation[] = [];
    // Where focus was when the toast appeared; it goes back there if the toast leaves while holding focus.
    const previous = document.activeElement;
    watch(() => props.item.exiting, exiting => { if (exiting) restoreToastFocus(el.value, previous); }, { flush: "post" });
    const run = () => {
      const node = el.value;
      if (!node) return;
      if (reduced.value) { entryFinished = true; return; }
      const { exiting, born } = props.item, elapsed = Date.now() - born;
      if (!exiting && (elapsed >= tokens.motion.toastEnter || entryFinished)) return;
      const hidden = `translateY(${toastEdgeShift(props.placement)}px)`, from = current;
      // Exit opacity fades linearly and ends before the movement, matching layer exits.
      animations = exiting ? [
        node.animate([{ opacity: from?.opacity ?? "1" }, { opacity: 0 }], { duration: tokens.motion.fadeExit, easing: tokens.motion.easeLinear, fill: "both" }),
        node.animate([{ transform: from?.transform ?? "translateY(0)" }, { transform: hidden }], { duration: tokens.motion.toastExit, easing: tokens.motion.easeIn, fill: "both" }),
      ] : [node.animate([{ opacity: 0, transform: hidden }, { opacity: 1, transform: "translateY(0)" }], {
        duration: tokens.motion.toastEnter, delay: -elapsed, easing: tokens.motion.easeOut, fill: "both" })];
      animations[0].onfinish = () => { if (!props.item.exiting) entryFinished = true; };
    };
    const cleanup = () => {
      if (el.value && animations.length) { const style = getComputedStyle(el.value); current = { opacity: style.opacity, transform: style.transform }; }
      for (const animation of animations) animation.cancel();
      animations = [];
    };
    watch(() => [props.item.exiting, props.item.born, reduced.value], () => { cleanup(); run(); }, { flush: "post" });
    onMounted(run);
    // Reduced motion removes a toast without an exit phase, so its unmount restores focus too.
    onBeforeUnmount(() => { restoreToastFocus(el.value, previous); cleanup(); });
    return () => (
      <div ref={el} inert={props.item.exiting} aria-hidden={props.item.exiting ? "true" : undefined}>
        <ToastView toast={props.item.toast} controller={props.controller} />
      </div>
    );
  },
});

export const ToastStack = defineComponent({
  name: "KjunToastStack",
  props: { items: { type: Array as PropType<PresentedToast[]>, required: true }, controller: { type: Object as PropType<Controller>, required: true },
    placement: { type: String as PropType<ToastPlacement>, default: "top" }, offset: { type: Number, default: 0 } },
  setup(props) {
    const { state, version } = useLayerContext();
    const root = ref<HTMLElement | null>(null), layout = createToastLayout(), reduced = useReducedMotion();
    const update = () => { if (root.value) layout.update(root.value, reduced.value); };
    onMounted(update);
    onUpdated(update);
    onBeforeUnmount(() => layout.destroy());
    return () => {
      void version.value;
      return (
        <div ref={root} class="kjun-toast-stack" data-placement={props.placement}
          style={{ zIndex: state.zIndex(state.topWindow()?.id, "toast"), "--_kjun-toast-offset": `${Math.max(0, props.offset)}px` }}>
          {orderToasts(props.items, props.placement).map(item => (
            <div key={item.toast.id} data-toast-id={item.toast.id} data-exiting={String(item.exiting)} class="kjun-toast-slot">
              <ToastSurface item={item} controller={props.controller} placement={props.placement} />
            </div>
          ))}
        </div>
      );
    };
  },
});
