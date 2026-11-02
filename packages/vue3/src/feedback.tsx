import type { ToastPlacement } from "../../../shared/package-runtime/toast-placement";
import { ToastStack, usePresentedToasts } from "./toast-stack";
import { useKjunMessages } from "./runtime/messages";
import { computed, defineComponent, inject, onBeforeUnmount, provide, ref, shallowRef, watch,
  type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { createFeedbackController, feedbackControllerOf, tokens, type ConfirmOptions, type FeedbackRequest, type KjunFeedback, type PromptOptions } from "@kjun-ui/tokens";
import { KjunInput } from "./input";
import { KjunModal } from "./modal";
import { kjunFeedbackOverlayKey } from "./overlay-host";
import { useReducedMotion } from "./runtime/presence";

type Controller = ReturnType<typeof createFeedbackController>;
const kjunFeedbackKey: InjectionKey<KjunFeedback> = Symbol("kjunFeedback");
export function useKjunFeedback(): KjunFeedback {
  const value = inject(kjunFeedbackKey, null);
  if (!value) throw Error("useKjunFeedback requires KjunFeedbackProvider.");
  return value;
}
export const useOptionalKjunFeedback = () => inject(kjunFeedbackKey, null);

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

const FeedbackDialog = defineComponent({
  name: "KjunFeedbackDialog",
  props: { controller: { type: Object as PropType<Controller>, required: true }, request: { type: Object as PropType<FeedbackRequest>, required: true }, open: { type: Boolean, required: true } },
  setup(props) {
    const m = useKjunMessages();
    const options = props.request.options as PromptOptions & ConfirmOptions;
    const value = ref(options.initialValue || ""), error = ref(""), busy = ref(false);
    let working = false;
    const active = () => props.controller.getSnapshot().current?.id === props.request.id;
    const cancel = () => { if (!working && active()) props.controller.settle(props.request.kind === "confirm" ? false : null, undefined, props.request.id); };
    const submit = async () => {
      if (working || !active()) return;
      if (props.request.kind === "prompt") {
        const valid = options.validator?.(value.value);
        if (valid === false || typeof valid === "string") { error.value = typeof valid === "string" ? valid : m.value.invalidInput; return; }
        props.controller.settle(value.value, undefined, props.request.id);
        return;
      }
      working = true; busy.value = true;
      try { await options.onConfirm?.(); props.controller.settle(true, undefined, props.request.id); }
      catch (reason) { props.controller.settle(false, reason, props.request.id); }
    };
    return () => (
      <KjunModal open={props.open} {...{ "onUpdate:open": (open: boolean) => { if (!open) cancel(); } }}
        title={options.title || (props.request.kind === "prompt" ? m.value.promptTitle : m.value.confirmTitle)} showFooter confirmText={options.confirmText || m.value.confirm}
        cancelText={options.cancelText || m.value.cancel} loading={busy.value} closable={!busy.value} closeOnEsc={!busy.value} closeOnOverlay={!busy.value}
        onConfirm={submit} confirmVariant={options.type === "danger" ? "danger" : "primary"}>
        {options.message && <p>{options.message}</p>}
        {props.request.kind === "prompt" && (
          <KjunInput modelValue={value.value} ariaLabel={options.title || m.value.promptTitle} errorMessage={error.value}
            {...{ autofocus: true, placeholder: options.placeholder, "onUpdate:modelValue": (next: string) => { value.value = next; error.value = ""; }, onEnter: submit }} />
        )}
      </KjunModal>
    );
  },
});

/** Provides toast, confirm and prompt (useKjunFeedback) to its subtree. */
export const KjunFeedbackProvider = defineComponent({
  name: "KjunFeedbackProvider",
  props: {
    /** A feedback API from createKjunFeedback(), for calls outside components. */
    controller: { type: Object as PropType<KjunFeedback>, default: undefined },
    /** Stacks toasts at the top or the bottom of the screen, right-aligned on wide screens; both keep clear of the safe area. */
    placement: { type: String as PropType<ToastPlacement>, default: "top" },
    /** Extra px between the toasts and their edge, e.g. a bottom navigation's height. */
    offset: { type: Number, default: 0 },
    /** How many toasts stay on screen at once (default 3); a fuller stack closes the oldest self-closing toast first. */
    maxToasts: { type: Number, default: 3 },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    // An app-made controller (createKjunFeedback) outlives this Provider; only one the Provider made is disposed.
    const external = props.controller;
    const controller = external ? feedbackControllerOf(external) : createFeedbackController();
    const detach = controller.attach();
    watch(() => props.maxToasts, value => controller.setToastLimit(value), { immediate: true });
    const snapshot = shallowRef(controller.getSnapshot());
    const unsubscribe = controller.subscribe(() => { snapshot.value = controller.getSnapshot(); });
    onBeforeUnmount(() => { unsubscribe(); detach(); if (!external) controller.dispose(); });
    provide(kjunFeedbackKey, controller.api);
    const reduced = useReducedMotion();
    const toasts = usePresentedToasts(() => snapshot.value.toasts, () => reduced.value);
    const dialog = usePresentedRequest(() => snapshot.value.current, () => reduced.value);
    const layers = shallowRef<{ id: string; order: number }[]>([]);
    const top = computed(() => [...layers.value].sort((a, b) => a.order - b.order).at(-1)?.id);
    const renderToasts = () => <ToastStack items={toasts.value} controller={controller} placement={props.placement} offset={props.offset} />;
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
export type { ConfirmOptions, KjunFeedback, PromptOptions, ToastOptions, ToastDismissReason, ToastPromiseMessages } from "@kjun-ui/tokens";
