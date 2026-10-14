import { computed, defineComponent, inject, onBeforeUnmount, onMounted, onUpdated, provide, ref, shallowRef, watch,
  type InjectionKey, type PropType } from "vue";
import { createFeedbackController, tokens, type ConfirmOptions, type FeedbackRequest, type KjunFeedback, type PromptOptions, type ToastItem } from "@kjun-ui/tokens";
import { createToastLayout } from "../../../shared/package-runtime/toast-layout";
import { KjunIcon } from "./button";
import { KjunInput } from "./input";
import { KjunModal } from "./modal";
import { kjunFeedbackOverlayKey } from "./overlay-host";
import { useLayerContext } from "./runtime/layers";
import { useReducedMotion } from "./runtime/presence";
import { css } from "./runtime/style";

type Controller = ReturnType<typeof createFeedbackController>;
const kjunFeedbackKey: InjectionKey<KjunFeedback> = Symbol("kjunFeedback");
export function useKjunFeedback(): KjunFeedback {
  const value = inject(kjunFeedbackKey, null);
  if (!value) throw Error("useKjunFeedback requires KjunFeedbackProvider.");
  return value;
}
export const useOptionalKjunFeedback = () => inject(kjunFeedbackKey, null);

interface PresentedToast { toast: ToastItem; exiting: boolean; born: number }
function usePresentedToasts(toasts: () => ToastItem[], reduced: () => boolean) {
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
// Retain the request being painted without postponing controller.settle or its Promise.
function usePresentedRequest(current: () => FeedbackRequest | null, reduced: () => boolean) {
  const request = shallowRef(current());
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch([current, reduced], ([next, isReduced]) => {
    clearTimeout(timer);
    if (!request.value || request.value.id === next?.id || isReduced) { request.value = next; return; }
    timer = setTimeout(() => { request.value = current(); }, tokens.motion.layerExit);
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return computed(() => ({ request: request.value, open: !!request.value && current()?.id === request.value.id }));
}

export const ToastView = defineComponent({
  name: "KjunToastView",
  props: { toast: { type: Object as PropType<ToastItem>, required: true }, controller: { type: Object as PropType<Controller>, required: true } },
  setup(props) {
    let previous: HTMLElement | null = null;
    const reasons = { hover: Symbol("kjunToastHover"), focus: Symbol("kjunToastFocus") };
    onMounted(() => { previous = document.activeElement as HTMLElement; });
    onBeforeUnmount(() => { props.controller.resumeToast(props.toast.id, reasons.hover); props.controller.resumeToast(props.toast.id, reasons.focus); });
    const dismiss = () => { if (previous?.isConnected) previous.focus(); props.controller.api.toast.dismiss(props.toast.id); };
    return () => {
      const toast = props.toast, tone = toast.type === "error" ? "danger" : toast.type || "info";
      const icon = { success: "circle-check", danger: "alert-circle", warning: "alert-triangle", info: "info-circle" }[tone];
      return (
        <div class="kjun-toast" data-tone={tone} data-title={String(!!toast.title)} role="alert" aria-live={tone === "danger" ? "assertive" : "polite"}
          onMouseenter={() => props.controller.pauseToast(toast.id, reasons.hover)}
          onMouseleave={() => props.controller.resumeToast(toast.id, reasons.hover)}
          onFocusin={() => props.controller.pauseToast(toast.id, reasons.focus)}
          onFocusout={(event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) props.controller.resumeToast(toast.id, reasons.focus); }}>
          <span class="kjun-toast-icon" style={{ color: `var(--_kjun-color-${tone}-accent)` }}><KjunIcon name={icon} /></span>
          <div class="kjun-toast-content">
            {toast.title && <strong>{toast.title}</strong>}
            <span class="kjun-toast-message">{toast.message}</span>
            {toast.action && (
              <button type="button" class="kjun-toast-action" onClick={() => { try { toast.action?.onClick(); } finally { dismiss(); } }}>{toast.action.label}</button>
            )}
          </div>
          {toast.closable !== false && <button type="button" class="kjun-toast-close" aria-label="알림 닫기" onClick={dismiss}><KjunIcon name="x" /></button>}
          {toast.showProgress !== false && !!toast.duration && (
            <div key={toast.startedAt + ":" + toast.paused} aria-hidden="true" class="kjun-toast-progress" style={{
              "--_kjun-toast-start": `${(toast.remaining / toast.duration) * 100}%`, animationDuration: `${toast.remaining}ms`,
              animationPlayState: toast.paused ? "paused" : "running", background: `var(--_kjun-color-${tone})`,
            }} />
          )}
        </div>
      );
    };
  },
});

const ToastSurface = defineComponent({
  name: "KjunToastSurface",
  props: { item: { type: Object as PropType<PresentedToast>, required: true }, controller: { type: Object as PropType<Controller>, required: true } },
  setup(props) {
    const el = ref<HTMLElement | null>(null), reduced = useReducedMotion();
    let current: { opacity: string; transform: string } | null = null, entryFinished = false, animations: Animation[] = [];
    const run = () => {
      const node = el.value;
      if (!node) return;
      if (reduced.value) { entryFinished = true; return; }
      const { exiting, born } = props.item, elapsed = Date.now() - born;
      if (!exiting && (elapsed >= tokens.motion.toastEnter || entryFinished)) return;
      const hidden = `translateY(${-tokens.motionDistance.toast}px)`, from = current;
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
    onBeforeUnmount(cleanup);
    return () => (
      <div ref={el} inert={props.item.exiting} aria-hidden={props.item.exiting ? "true" : undefined}>
        <ToastView toast={props.item.toast} controller={props.controller} />
      </div>
    );
  },
});

const ToastStack = defineComponent({
  name: "KjunToastStack",
  props: { items: { type: Array as PropType<PresentedToast[]>, required: true }, controller: { type: Object as PropType<Controller>, required: true } },
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
        <div ref={root} class="kjun-toast-stack" style={{ zIndex: state.zIndex(state.topWindow()?.id, "toast") }}>
          {props.items.map(item => (
            <div key={item.toast.id} data-toast-id={item.toast.id} data-exiting={String(item.exiting)} class="kjun-toast-slot">
              <ToastSurface item={item} controller={props.controller} />
            </div>
          ))}
        </div>
      );
    };
  },
});

const FeedbackDialog = defineComponent({
  name: "KjunFeedbackDialog",
  props: { controller: { type: Object as PropType<Controller>, required: true }, request: { type: Object as PropType<FeedbackRequest>, required: true }, open: { type: Boolean, required: true } },
  setup(props) {
    const options = props.request.options as PromptOptions & ConfirmOptions;
    const value = ref(options.initialValue || ""), error = ref(""), busy = ref(false);
    let working = false;
    const active = () => props.controller.getSnapshot().current?.id === props.request.id;
    const cancel = () => { if (!working && active()) props.controller.settle(props.request.kind === "confirm" ? false : null, undefined, props.request.id); };
    const submit = async () => {
      if (working || !active()) return;
      if (props.request.kind === "prompt") {
        const valid = options.validator?.(value.value);
        if (valid === false || typeof valid === "string") { error.value = typeof valid === "string" ? valid : "입력 내용을 확인하세요."; return; }
        props.controller.settle(value.value, undefined, props.request.id);
        return;
      }
      working = true; busy.value = true;
      try { await options.onConfirm?.(); props.controller.settle(true, undefined, props.request.id); }
      catch (reason) { props.controller.settle(false, reason, props.request.id); }
    };
    return () => (
      <KjunModal open={props.open} {...{ "onUpdate:open": (open: boolean) => { if (!open) cancel(); } }}
        title={options.title || (props.request.kind === "prompt" ? "입력" : "확인")} showFooter confirmText={options.confirmText || "확인"}
        cancelText={options.cancelText || "취소"} loading={busy.value} closable={!busy.value} closeOnEsc={!busy.value} closeOnOverlay={!busy.value}
        onConfirm={submit} confirmVariant={options.type === "danger" ? "danger" : "primary"}>
        {options.message && <p>{options.message}</p>}
        {props.request.kind === "prompt" && (
          <KjunInput modelValue={value.value} ariaLabel={options.title || "입력"} errorMessage={error.value}
            {...{ autofocus: true, placeholder: options.placeholder, "onUpdate:modelValue": (next: string) => { value.value = next; error.value = ""; }, onEnter: submit }} />
        )}
      </KjunModal>
    );
  },
});

/** Provides toast, confirm and prompt (useKjunFeedback) to its subtree. */
export const KjunFeedbackProvider = defineComponent({
  name: "KjunFeedbackProvider",
  setup(_, { slots }) {
    const controller = createFeedbackController();
    const snapshot = shallowRef(controller.getSnapshot());
    const unsubscribe = controller.subscribe(() => { snapshot.value = controller.getSnapshot(); });
    onBeforeUnmount(() => { unsubscribe(); controller.dispose(); });
    provide(kjunFeedbackKey, controller.api);
    const reduced = useReducedMotion();
    const toasts = usePresentedToasts(() => snapshot.value.toasts, () => reduced.value);
    const dialog = usePresentedRequest(() => snapshot.value.current, () => reduced.value);
    const layers = shallowRef<{ id: string; order: number }[]>([]);
    const top = computed(() => [...layers.value].sort((a, b) => a.order - b.order).at(-1)?.id);
    const renderToasts = () => <ToastStack items={toasts.value} controller={controller} />;
    provide(kjunFeedbackOverlayKey, {
      top,
      register: (id, order) => {
        layers.value = [...layers.value, { id, order }];
        return () => { layers.value = layers.value.filter(value => value.id !== id); };
      },
      render: renderToasts,
    });
    return () => (
      <>
        {slots.default?.()}
        {!layers.value.length && renderToasts()}
        {dialog.value.request && <FeedbackDialog key={dialog.value.request.id} request={dialog.value.request} open={dialog.value.open} controller={controller} />}
      </>
    );
  },
});
export type { ConfirmOptions, KjunFeedback, PromptOptions, ToastOptions } from "@kjun-ui/tokens";
