import { Teleport, defineComponent, onBeforeUnmount, onMounted, provide, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type ButtonVariant, type InputSize } from "@kjun-ui/tokens";
import { observeFormActions } from "../../../shared/package-runtime/form-actions";
import { KjunButton, KjunIcon } from "./button";
import { usePortalTarget } from "./floating-panel";
import { useKjunId } from "./input";
import { FeedbackLayerOutlet } from "./overlay-host";
import { kjunLayerScopeKey, useLayer, type Layer } from "./runtime/layers";
import { useModalOverlay } from "./runtime/modal";
import { usePresence, useReducedMotion } from "./runtime/presence";
import { hasContent } from "./runtime/slots";

const kjunFormActionsProps = {
  size: { type: String as PropType<InputSize>, default: "lg" },
  cancelText: { type: String, default: "취소" },
  confirmText: { type: String, default: "저장" },
  showCancel: { type: Boolean, default: true },
  showConfirm: { type: Boolean, default: true },
  cancelDisabled: { type: Boolean, default: false },
  confirmDisabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  variant: { type: String as PropType<Extract<ButtonVariant, "primary" | "danger" | "success">>, default: "primary" },
  cancelVariant: { type: String as PropType<"ghost" | "secondary">, default: "ghost" },
} as const;
export type KjunFormActionsProps = ExtractPublicPropTypes<typeof kjunFormActionsProps>;
export const KjunFormActions = defineComponent({
  name: "KjunFormActions",
  props: kjunFormActionsProps,
  emits: { cancel: () => true, confirm: () => true },
  setup(props, { emit }) {
    const root = ref<HTMLElement | null>(null);
    let stop: (() => void) | undefined;
    onMounted(() => { stop = observeFormActions(root.value!); });
    onBeforeUnmount(() => stop?.());
    return () => (
      <div class="kjun-form-actions" ref={root}>
        {props.showCancel && <KjunButton size={props.size} variant={props.cancelVariant} disabled={props.cancelDisabled} onClick={() => emit("cancel")}>{props.cancelText}</KjunButton>}
        {props.showConfirm && <KjunButton size={props.size} variant={props.variant} disabled={props.confirmDisabled} loading={props.loading} onClick={() => emit("confirm")}>{props.confirmText}</KjunButton>}
      </div>
    );
  },
});

/** react-aria's visually hidden Dismiss button that screen reader users can reach. */
export const DismissButton = defineComponent({
  name: "KjunDismissButton",
  props: { onDismiss: { type: Function as PropType<() => void>, required: true } },
  setup: props => () => (
    <div style={{ border: 0, clip: "rect(0px, 0px, 0px, 0px)", clipPath: "inset(50%)", height: "1px", margin: "-1px", overflow: "hidden", padding: 0, position: "absolute", width: "1px", whiteSpace: "nowrap" }}>
      <button aria-label="Dismiss" tabindex={-1} style={{ width: "1px", height: "1px" }} onClick={() => props.onDismiss()} />
    </div>
  ),
});

/** Shared by Modal and Drawer: the window's layer, presence and dismissal wiring. */
export function useWindowLayer(open: () => boolean, close: () => void, closeOnEsc: () => boolean, exit?: number) {
  const reduced = useReducedMotion();
  const motion = usePresence(open, () => reduced.value, exit);
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc()) close(); });
  provide(kjunLayerScopeKey, layer.id);
  // Without a Provider the shared Escape handling is not installed.
  const onKeydown = (event: KeyboardEvent) => { if (event.key === "Escape" && open() && layer.active.value && closeOnEsc()) close(); };
  if (!layer.keyboardManaged) {
    onMounted(() => document.addEventListener("keydown", onKeydown));
    onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
  }
  return { motion, layer };
}
export const bindWindowRoot = (layer: Layer) => (node: unknown) => {
  const entry = layer.state.entries.get(layer.id);
  if (entry) entry.root = node instanceof HTMLElement ? node : null;
};
/** react-aria's isDismissable: a press that starts and ends outside the window content closes it. */
export function useOutsidePress(content: () => HTMLElement | null, enabled: () => boolean, close: () => void) {
  let started = false;
  const outside = (target: EventTarget | null) => target instanceof Node && !content()?.contains(target);
  return {
    onPointerdown: (event: PointerEvent) => { started = enabled() && outside(event.target); },
    onPointerup: (event: PointerEvent) => { if (started && enabled() && outside(event.target)) close(); started = false; },
  };
}

const kjunModalProps = {
  open: { type: Boolean, required: true },
  title: { type: String, default: "" },
  size: { type: String as PropType<"sm" | "md" | "lg" | "xl" | "full">, default: "md" },
  closable: { type: Boolean, default: true },
  closeOnOverlay: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: false },
  showConfirmButton: { type: Boolean, default: true },
  showCancelButton: { type: Boolean, default: true },
  confirmText: { type: String, default: "확인" },
  cancelText: { type: String, default: "취소" },
  confirmDisabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  noPadding: { type: Boolean, default: false },
  height: { type: String, default: undefined },
  confirmVariant: { type: String as PropType<"primary" | "danger" | "success">, default: "primary" },
  footerSize: { type: String as PropType<InputSize>, default: "md" },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunModalProps = ExtractPublicPropTypes<typeof kjunModalProps>;
/** v-model:open. Slots: default (body), header (replaces the title), footer (replaces the actions). Events: close, cancel, confirm. */
export const KjunModal = defineComponent({
  name: "KjunModal",
  props: kjunModalProps,
  emits: { "update:open": (_open: boolean) => true, close: () => true, cancel: () => true, confirm: () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const target = usePortalTarget();
    const id = useKjunId("kjun-");
    const close = () => { if (!props.open) return; emit("update:open", false); emit("close"); };
    const { motion, layer } = useWindowLayer(() => props.open, close, () => props.closeOnEsc);
    const overlay = ref<HTMLElement | null>(null), modal = ref<HTMLElement | null>(null), dialog = ref<HTMLElement | null>(null);
    useModalOverlay(overlay, dialog, () => props.open && layer.active.value);
    const press = useOutsidePress(() => modal.value, () => props.closeOnOverlay && props.open && layer.active.value, close);
    const rootRef = bindWindowRoot(layer);
    return () => {
      const to = target();
      if (to === null || !motion.present()) return null;
      const header = slots.header?.();
      const explicitLabel = props.ariaLabel?.trim();
      const labelledByHeading = props.showHeader && !explicitLabel && (hasContent(header) || !!props.title.trim());
      const footer = slots.footer?.();
      return (
        <Teleport to={to}>
          <div ref={overlay} data-motion="modal" data-motion-open={String(motion.active())} data-entering={props.open && !motion.active() ? "true" : undefined}
            class="kjun-scope kjun-modal-overlay"
            style={{ zIndex: layer.zIndex.value }} inert={!props.open || !layer.active.value} {...press}>
            <div ref={modal} class="kjun-modal" data-size={props.size} data-fixed={String(!!props.height)} style={{
              zIndex: layer.state.zIndex(layer.id, "content"),
              width: props.size === "full" ? "calc(100vw - 2 * var(--_kjun-geometry-modal-mobile-inset))" : tokens.modal.widths[props.size] + "px",
              height: props.height || (props.size === "full" ? "calc(100dvh - 2 * var(--_kjun-geometry-modal-mobile-inset))" : undefined),
            }}>
              <DismissButton onDismiss={close} />
              <section ref={(node: unknown) => { dialog.value = node as HTMLElement | null; rootRef(node); }} class="kjun-modal-dialog" role="dialog" tabindex={-1}
                aria-label={explicitLabel || (labelledByHeading ? undefined : props.title.trim() || "대화상자")} aria-labelledby={labelledByHeading ? id : undefined}>
                {props.showHeader && (
                  <div class="kjun-modal-header">
                    <h2 id={id} class="kjun-modal-title">{hasContent(header) ? header : props.title}</h2>
                    {props.closable && <button type="button" class="kjun-modal-close" aria-label="닫기" onClick={close}><KjunIcon name="x" size={tokens.modal.closeIconSize} /></button>}
                  </div>
                )}
                <div class="kjun-modal-body" style={props.noPadding ? { padding: 0 } : undefined}>{slots.default?.()}</div>
                {(props.showFooter || hasContent(footer)) && (
                  <div class="kjun-modal-footer">
                    {hasContent(footer) ? footer : (
                      <KjunFormActions size={props.footerSize} cancelVariant="secondary" showCancel={props.showCancelButton} showConfirm={props.showConfirmButton}
                        cancelText={props.cancelText} confirmText={props.confirmText} confirmDisabled={props.confirmDisabled} loading={props.loading}
                        variant={props.confirmVariant} onConfirm={() => emit("confirm")} onCancel={() => { emit("cancel"); close(); }} />
                    )}
                  </div>
                )}
                <FeedbackLayerOutlet />
              </section>
            </div>
          </div>
        </Teleport>
      );
    };
  },
});
