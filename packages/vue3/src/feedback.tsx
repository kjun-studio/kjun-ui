import type { ToastPlacement } from "../../../shared/package-runtime/toast-placement";
import { ToastStack, usePresentedToasts } from "./toast-stack";
import { useKjunMessages } from "./runtime/messages";
import { computed, defineComponent, inject, nextTick, onBeforeUnmount, provide, reactive, ref, shallowRef, watch,
  type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { createFeedbackController, feedbackControllerOf, tokens, type ConfirmOptions, type FeedbackRequest, type KjunFeedback, type PromptOptions } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { KjunInput, useKjunId } from "./input";
import { createFeedbackSession, graphemeCount, splitAround, type FeedbackDialogState } from "../../../shared/package-runtime/feedback-prompt";
import { KjunTextarea } from "./textarea";
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
    const options = props.request.options as PromptOptions & Omit<ConfirmOptions, "onConfirm">;
    const state = reactive<FeedbackDialogState>({ value: options.initialValue || "", error: "", busy: false });
    // Like React and Native: the behaviour is the shared framework-free session; Vue only keeps the state.
    const session = createFeedbackSession({ kind: props.request.kind, id: props.request.id, options: options as never, controller: props.controller,
      messages: m.value, get: () => state, set: (patch) => Object.assign(state, patch) });
    onBeforeUnmount(session.dispose);
    const prompt = props.request.kind === "prompt", ids = useKjunId("kjun-feedback-");
    const field = ref<{ el?: HTMLInputElement | HTMLTextAreaElement | null } | null>(null);
    // Renaming: the starting text opens selected, so typing replaces it.
    watch(() => props.open, open => { if (open && prompt && options.initialValue) nextTick(() => field.value?.el?.select()); }, { immediate: true });
    return () => {
      const title = options.title || (prompt ? m.value.promptTitle : m.value.confirmTitle), danger = options.type === "danger";
      const required = options.requiredValue != null ? splitAround(m.value.typeToConfirm(options.requiredValue), options.requiredValue) : null;
      const messageId = options.message ? ids + "-message" : undefined, errorId = ids + "-error";
      const describe = (...list: (string | false | undefined)[]) => list.filter(Boolean).join(" ") || undefined;
      const shared = { id: ids + "-input", autofocus: true, maxlength: options.maxLength, placeholder: options.placeholder,
        inputmode: options.inputMode, autocomplete: options.autoComplete, "onUpdate:modelValue": session.edit };
      return (
        <KjunModal open={props.open} {...{ "onUpdate:open": (open: boolean) => { if (!open) session.cancel(); } }}
          size="sm" ariaLabel={title} ariaDescribedBy={prompt ? undefined : describe(messageId, !!state.error && errorId)}
          showHeader={false} closeOnEsc={!state.busy} closeOnOverlay={!state.busy}>
          <div class="kjun-feedback-dialog">
            <h2>{title}</h2>
            {options.message && (
              <p id={messageId} class="kjun-feedback-dialog-message" data-tone={danger ? "danger" : undefined}>
                {danger && <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} filled />}
                <span>{options.message}</span>
              </p>
            )}
            {!prompt && state.error && <p id={errorId} class="kjun-feedback-dialog-error" role="alert">{state.error}</p>}
            {prompt && (
              <div class="kjun-feedback-dialog-field">
                <div class="kjun-feedback-dialog-label">
                  <label for={ids + "-input"}>{required ? <>{required[0]}<strong>{required[1]}</strong>{required[2]}</> : options.label || title}</label>
                  {options.maxLength != null && <span class="kjun-feedback-dialog-count" aria-hidden="true">{graphemeCount(state.value)} / {options.maxLength}</span>}
                </div>
                {options.multiline ? <>
                  <KjunTextarea ref={field} modelValue={state.value} error={!!state.error} maxLength={options.maxLength}
                    {...{ ...shared, "aria-describedby": describe(messageId, !!state.error && errorId), onSubmit: session.submit }} />
                  {state.error && <p id={errorId} class="kjun-feedback-dialog-error" role="alert">{state.error}</p>}
                </> : (
                  <KjunInput ref={field} modelValue={state.value} errorMessage={state.error}
                    {...{ ...shared, "aria-describedby": messageId, onEnter: session.submit }} />
                )}
              </div>
            )}
            <div class="kjun-feedback-dialog-actions">
              <KjunButton variant="secondary" disabled={state.busy} onClick={session.cancel}>{options.cancelText || m.value.cancel}</KjunButton>
              <KjunButton variant={danger ? "danger" : "primary"} loading={state.busy} disabled={!session.ready(state)} onClick={session.submit}>{options.confirmText || m.value.confirm}</KjunButton>
            </div>
          </div>
        </KjunModal>
      );
    };
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
