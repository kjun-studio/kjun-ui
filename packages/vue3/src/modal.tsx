import { useKjunMessages } from "./runtime/messages";
import { Teleport, onBeforeUnmount, onMounted, provide, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type ButtonVariant, type InputSize } from "@kjun-ui/tokens";
import { observeFormActions } from "../../../shared/package-runtime/form-actions";
import { KjunButton, KjunIcon, useActionSize } from "./button";
import { focusReturnProp, readFocusReturn, usePortalTarget } from "./floating-panel";
import { useKjunId } from "./input";
import { FeedbackLayerOutlet } from "./overlay-host";
import { kjunLayerScopeKey, useLayer, type Layer } from "./runtime/layers";
import { useModalOverlay } from "./runtime/modal";
import { usePresence, useReducedMotion } from "./runtime/presence";
import { hasContent } from "./runtime/slots";
import { modalCloseStyle } from "../../../shared/package-runtime/modal-geometry";
import { css } from "./runtime/style";

const kjunFormActionsProps = {
  size: { type: String as PropType<InputSize>, default: undefined },
  cancelText: { type: String, default: undefined },
  confirmText: { type: String, default: undefined },
  showCancel: { type: Boolean, default: true },
  showConfirm: { type: Boolean, default: true },
  cancelDisabled: { type: Boolean, default: false },
  /** The id of a form elsewhere on the page: the confirm button then submits it (Enter in a field submits it too), so a form in a
   * modal body needs no hidden submit button. Handle the save in the form's submit event. */
  form: { type: String, default: undefined },
  confirmDisabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  variant: { type: String as PropType<Extract<ButtonVariant, "primary" | "danger" | "success">>, default: "primary" },
  cancelVariant: { type: String as PropType<"ghost" | "secondary">, default: "ghost" },
  /** The buttons fill the row: true gives each the same width, "primary" makes the confirm button twice as wide as cancel.
   * Stacked rows are full width either way. */
  fill: { type: [Boolean, String] as PropType<boolean | "primary">, default: false },
} as const;
export type KjunFormActionsProps = ExtractPublicPropTypes<typeof kjunFormActionsProps>;
export const KjunFormActions = defineComponent({
  name: "KjunFormActions",
  props: kjunFormActionsProps,
  emits: { cancel: () => true, confirm: () => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    // Unset, the buttons take the size of the container they sit in (a Popover, an Alert), else lg.
    const size = useActionSize(() => props.size, "lg");
    const root = ref<HTMLElement | null>(null);
    let stop: (() => void) | undefined;
    onMounted(() => { stop = observeFormActions(root.value!); });
    onBeforeUnmount(() => stop?.());
    return () => (
      <div class="kjun-form-actions" ref={root} data-fill={props.fill === "primary" ? "primary" : props.fill ? "equal" : undefined}>
        {props.showCancel && <KjunButton size={size.value} variant={props.cancelVariant} disabled={props.cancelDisabled} onClick={() => emit("cancel")}>{(props.cancelText ?? m.value.cancel)}</KjunButton>}
        {props.showConfirm && <KjunButton size={size.value} variant={props.variant} disabled={props.confirmDisabled} loading={props.loading} type={props.form ? "submit" : "button"} {...{ form: props.form }} onClick={() => emit("confirm")}>{(props.confirmText ?? m.value.save)}</KjunButton>}
      </div>
    );
  },
});

/** react-aria's visually hidden Dismiss button that screen reader users can reach. */
export const DismissButton = defineComponent({
  name: "KjunDismissButton",
  props: { onDismiss: { type: Function as PropType<() => void>, required: true } },
  setup: props => {
    const m = useKjunMessages();
    return () => (
    <div class="kjun-sr-only">
      <button aria-label={m.value.dismiss} tabindex={-1} onClick={() => props.onDismiss()} />
    </div>
    );
  },
});

/** Shared by Modal and Drawer: the window's layer, presence and dismissal wiring. */
export function useWindowLayer(open: () => boolean, close: () => void, closeOnEsc: () => boolean, exit?: number, afterClose?: () => void,
  returnFocus?: () => HTMLElement | null | undefined) {
  const reduced = useReducedMotion();
  const motion = usePresence(open, () => reduced.value, exit);
  // Like React useAfterClose: once when the window leaves the screen; a reopen during the exit keeps it present.
  watch(motion.present, (now, before) => { if (before && !now) afterClose?.(); }, { flush: "post" });
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc()) close(); }, undefined, returnFocus);
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
  confirmText: { type: String, default: undefined },
  cancelText: { type: String, default: undefined },
  /** The id of a form elsewhere on the page: the confirm button then submits it (Enter in a field submits it too), so a form in a
   * modal body needs no hidden submit button. Handle the save in the form's submit event. */
  form: { type: String, default: undefined },
  confirmDisabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  noPadding: { type: Boolean, default: false },
  height: { type: String, default: undefined },
  confirmVariant: { type: String as PropType<"primary" | "danger" | "success">, default: "primary" },
  footerSize: { type: String as PropType<InputSize>, default: "md" },
  ariaLabel: { type: String, default: undefined },
  /** Id of the element that describes the dialog (e.g. its message), read after its name. */
  ariaDescribedBy: { type: String, default: undefined },
  /** Read after the exit finishes; a missing target falls back to the opener or parent window. */
  returnFocus: focusReturnProp,
} as const;
export type KjunModalProps = ExtractPublicPropTypes<typeof kjunModalProps>;
/** v-model:open. Slots: default (body), header (replaces the title), footer (replaces the actions). Events: close, after-close, cancel, confirm. */
export const KjunModal = defineComponent({
  name: "KjunModal",
  props: kjunModalProps,
  emits: { "update:open": (_open: boolean) => true, close: () => true, "after-close": () => true, cancel: () => true, confirm: () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const target = usePortalTarget();
    const id = useKjunId("kjun-");
    // While the confirm action runs the window stays open (as Confirm and Prompt do while busy).
    const close = () => { if (!props.open || props.loading) return; emit("update:open", false); emit("close"); };
    const { motion, layer } = useWindowLayer(() => props.open, close, () => props.closeOnEsc, undefined, () => emit("after-close"),
      () => readFocusReturn(props.returnFocus));
    const overlay = ref<HTMLElement | null>(null), modal = ref<HTMLElement | null>(null), dialog = ref<HTMLElement | null>(null);
    // Keep the page isolated until the exit finishes; only the dialog content becomes inert on close.
    useModalOverlay(overlay, dialog, () => motion.present() && layer.active.value);
    const press = useOutsidePress(() => modal.value, () => props.closeOnOverlay && props.open && layer.active.value, close);
    const rootRef = bindWindowRoot(layer);
    return () => {
      const to = target();
      if (to === null || !motion.present()) return null;
      const header = slots.header?.();
      const explicitLabel = props.ariaLabel?.trim();
      // Without a title or header only the close button remains: no title band, no empty heading.
      const custom = hasContent(header), titled = props.showHeader && (custom || !!props.title.trim());
      const labelledByHeading = titled && !explicitLabel;
      const footer = slots.footer?.();
      return (
        <Teleport to={to}>
          <div ref={overlay} data-motion="modal" data-motion-open={String(motion.active())} data-entering={props.open && !motion.active() ? "true" : undefined}
            class="kjun-scope kjun-modal-overlay"
            style={{ zIndex: layer.zIndex.value }} inert={!layer.active.value} {...press}>
            <div ref={modal} class="kjun-modal" inert={!props.open} data-size={props.size} data-fixed={String(!!props.height)} style={{
              zIndex: layer.state.zIndex(layer.id, "content"),
              width: props.size === "full" ? "calc(100vw - 2 * var(--_kjun-geometry-modal-mobile-inset))" : tokens.modal.widths[props.size] + "px",
              height: props.height || (props.size === "full" ? "calc(100dvh - 2 * var(--_kjun-geometry-modal-mobile-inset))" : undefined),
            }}>
              <DismissButton onDismiss={close} />
              <section ref={(node: unknown) => { dialog.value = node as HTMLElement | null; rootRef(node); }} class="kjun-modal-dialog" role="dialog" tabindex={-1}
                aria-label={explicitLabel || (labelledByHeading ? undefined : props.title.trim() || m.value.dialog)} aria-labelledby={labelledByHeading ? id : undefined} aria-describedby={props.ariaDescribedBy}>
                {props.showHeader && (titled || props.closable) && (
                  <div class="kjun-modal-header" data-bare={titled ? undefined : ""}>
                    {/* A header slot may hold buttons or badges, so it gets a plain labelled box, not the heading. */}
                    {titled && (custom ? <div id={id} class="kjun-modal-title">{header}</div> : <h2 id={id} class="kjun-modal-title">{props.title}</h2>)}
                    {props.closable && <KjunButton size="sm" variant="ghost" ariaLabel={m.value.close} onClick={close} disabled={props.loading}
                      class="kjun-modal-close" style={css(modalCloseStyle)}><KjunIcon name="x" size={tokens.modal.closeIconSize} /></KjunButton>}
                  </div>
                )}
                <div class="kjun-modal-body" data-no-padding={props.noPadding ? "" : undefined}>{slots.default?.()}</div>
                {(props.showFooter || hasContent(footer)) && (
                  <div class="kjun-modal-footer">
                    {hasContent(footer) ? footer : (
                      <KjunFormActions size={props.footerSize} cancelVariant="secondary" showCancel={props.showCancelButton} showConfirm={props.showConfirmButton}
                        cancelText={(props.cancelText ?? m.value.cancel)} confirmText={(props.confirmText ?? m.value.confirm)} cancelDisabled={props.loading} form={props.form} confirmDisabled={props.confirmDisabled} loading={props.loading}
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
