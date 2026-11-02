import { toastEdgeShift, type ToastPlacement } from "../../../shared/package-runtime/toast-placement";
import { toastPeekDepth, toastPresentation, toastStackLayout } from "../../../shared/package-runtime/toast-presentation";
import { attachToastStack, restoreToastFocus } from "../../../shared/package-runtime/toast-swipe";
import { createToastPresence, type PresentedToast } from "../../../shared/package-runtime/toast-presence";
import { createToastLayout } from "../../../shared/package-runtime/toast-layout";
import { computed, defineComponent, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, watch, type PropType } from "vue";
import { createFeedbackController, tokens, type ToastItem } from "@kjun-ui/tokens";
import { useLayerContext } from "./runtime/layers";
import { useReducedMotion } from "./runtime/presence";
import { useKjunMessages } from "./runtime/messages";
import { ToastView } from "./toast";

type Controller = ReturnType<typeof createFeedbackController>;
export type { PresentedToast };
export function usePresentedToasts(toasts: () => ToastItem[], reduced: () => boolean) {
  const items = shallowRef<PresentedToast[]>([]);
  const presence = createToastPresence(next => { items.value = next; });
  watch([toasts, reduced], ([current, isReduced]) => presence.sync(current, isReduced), { immediate: true });
  onBeforeUnmount(() => presence.destroy());
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

const narrowQuery = `(width <= ${tokens.responsive.toast}px)`;
const expandedHold = Symbol("kjunToastExpanded");
export const ToastStack = defineComponent({
  name: "KjunToastStack",
  props: { items: { type: Array as PropType<PresentedToast[]>, required: true }, controller: { type: Object as PropType<Controller>, required: true },
    placement: { type: String as PropType<ToastPlacement>, default: "top" }, offset: { type: Number, default: 0 } },
  setup(props) {
    const { state, version } = useLayerContext(), m = useKjunMessages();
    const root = ref<HTMLElement | null>(null), toggle = ref<HTMLButtonElement | null>(null), layout = createToastLayout(), reduced = useReducedMotion();
    const narrow = ref(false), expanded = ref(false), announcement = ref("");
    const media = typeof matchMedia === "function" ? matchMedia(narrowQuery) : null;
    const syncNarrow = () => { narrow.value = !!media?.matches; };
    syncNarrow();
    media?.addEventListener("change", syncNarrow);
    const stack = computed(() => toastStackLayout(props.items, { placement: props.placement, narrow: narrow.value, expanded: expanded.value }));
    let detach: (() => void) | undefined;
    const update = () => { if (root.value) layout.update(root.value, reduced.value); };
    onMounted(() => {
      update();
      if (root.value) detach = attachToastStack(root.value, {
        hold: reason => props.controller.holdAll(reason),
        release: reason => props.controller.releaseAll(reason),
        outside: () => { expanded.value = false; },
        // Escape folds an expanded stack and leaves focus on its toggle, which stays in place.
        escape: () => {
          if (!expanded.value) return false;
          expanded.value = false;
          toggle.value?.focus();
          return true;
        },
      });
    });
    onUpdated(update);
    onBeforeUnmount(() => { layout.destroy(); detach?.(); media?.removeEventListener("change", syncNarrow); props.controller.releaseAll(expandedHold); });
    // An expanded stack folds again once a single toast is left; while open, every toast holds still.
    watch(() => props.items.filter(item => !item.exiting).length, total => { if (total <= 1) expanded.value = false; });
    watch(expanded, open => { if (open) props.controller.holdAll(expandedHold); else props.controller.releaseAll(expandedHold); });
    // A drawn card announces itself; an unseen (folded or waiting) toast is spoken once, the first time it arrives unseen.
    const heard = new Set<number>();
    watch(stack, current => {
      const fresh = current.unseen.filter(item => !heard.has(item.toast.id));
      for (const item of [...current.items, ...current.unseen]) heard.add(item.toast.id);
      const ids = new Set(props.items.map(item => item.toast.id));
      for (const id of heard) if (!ids.has(id)) heard.delete(id);
      if (fresh.length) announcement.value = fresh.map(item => toastPresentation(item.toast).spoken).join(" ");
    }, { immediate: true });
    return () => {
      void version.value;
      const layoutNow = stack.value, open = expanded.value, depth = open ? 0 : toastPeekDepth(layoutNow.behind);
      const more = layoutNow.toggle && (
        <button key="more" ref={toggle} type="button" class="kjun-toast-more" data-toast-more="" data-depth={depth} data-expanded={open ? "true" : undefined}
          aria-expanded={open} aria-label={open ? m.value.collapseNotifications : `${m.value.showNotifications}, ${m.value.moreNotifications(layoutNow.behind)}`}
          onClick={() => { expanded.value = !open; }} style={{ "--_kjun-toast-peek-depth": Math.max(1, depth) }}>
          <span class="kjun-toast-more-count" aria-hidden="true">{open ? m.value.collapseNotifications : `+${layoutNow.behind}`}</span>
        </button>
      );
      const slots = layoutNow.items.map(item => (
        <div key={item.toast.id} data-toast-id={item.toast.id} data-exiting={String(item.exiting)} class="kjun-toast-slot">
          <ToastSurface item={item} controller={props.controller} placement={props.placement} />
        </div>
      ));
      return (
        <div ref={root} class="kjun-toast-stack" data-placement={props.placement} data-uniform={String(layoutNow.uniform)}
          data-folded={layoutNow.folded ? "true" : undefined} data-expanded={open ? "true" : undefined}
          {...(props.items.length ? { role: "region", "aria-label": m.value.notifications } : {})}
          style={{ zIndex: state.zIndex(state.topWindow()?.id, "toast"), "--_kjun-toast-offset": `${Math.max(0, props.offset)}px` }}>
          {props.placement === "bottom" && more}{slots}{props.placement !== "bottom" && more}
          {!!props.items.length && <div class="kjun-sr-only" role="status" aria-live="polite">{announcement.value}</div>}
        </div>
      );
    };
  },
});
