import { Teleport, cloneVNode, computed, defineComponent, isVNode, onBeforeUnmount, onMounted, onUpdated, reactive, ref, watch,
  type ExtractPublicPropTypes, type PropType, type VNode } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { computeFloatingPosition } from "../../../shared/package-runtime/floating-position";
import { installFocusVisible, isFocusVisible } from "../../../shared/package-runtime/focus-visible";
import { FloatingPanel, usePortalTarget } from "./floating-panel";
import { useKjunId } from "./input";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useLayer, usePopupExpanded } from "./runtime/layers";
import { usePresence, useReducedMotion } from "./runtime/presence";

const kjunPopoverProps = {
  noPadding: { type: Boolean, default: false },
  open: { type: Boolean, default: undefined },
  manualTrigger: { type: Boolean, default: false },
  matchTriggerWidth: { type: Boolean, default: false },
  maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
  flip: { type: Boolean, default: true },
  focusOnOpen: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  placement: { type: String as PropType<"top" | "bottom" | "left" | "right">, default: "bottom" },
} as const;
export type KjunPopoverProps = ExtractPublicPropTypes<typeof kjunPopoverProps>;
/** v-model:open (optional). Slots: trigger({ open }), default({ close }). */
export const KjunPopover = defineComponent({
  name: "KjunPopover",
  props: kjunPopoverProps,
  emits: { "update:open": (_open: boolean) => true },
  setup(props, { slots, emit }) {
    const internal = ref(false);
    const open = computed(() => props.open ?? internal.value);
    const trigger = ref<HTMLElement | null>(null);
    const id = useKjunId("kjun-");
    const expanded = usePopupExpanded(() => open.value, () => trigger.value);
    const change = (value: boolean) => { internal.value = value; emit("update:open", value); };
    // Like react-aria's Dialog: the dialog takes focus when it mounts unless something inside already has it.
    const dialog = (element: unknown) => {
      if (element instanceof HTMLElement && !element.contains(document.activeElement)) element.focus({ preventScroll: true });
    };
    return () => (
      <>
        <div ref={trigger} class="kjun-layer-trigger"
          {...{ onClickCapture: () => { if (!props.manualTrigger) change(!open.value); } }}
          onKeydown={(event: KeyboardEvent) => {
            if (!props.manualTrigger && ["Enter", " "].includes(event.key) && event.target === event.currentTarget) {
              event.preventDefault();
              change(!open.value);
            }
          }}
          aria-haspopup="dialog" aria-expanded={expanded.value} aria-controls={expanded.value ? id : undefined}>
          {slots.trigger?.({ open: open.value })}
        </div>
        <FloatingPanel open={open.value} onOpenChange={change} trigger={() => trigger.value} panelClass="kjun-content-popover" dialog={false}
          placement={props.placement} matchTriggerWidth={props.matchTriggerWidth} maxHeight={props.maxHeight} flip={props.flip}>
          {{ default: () => (
            <section ref={dialog} id={id} aria-label={props.ariaLabel || "상세 정보"} class="kjun-popover-dialog" role="dialog" tabindex={-1}
              style={{ maxHeight: typeof props.maxHeight === "number" ? props.maxHeight + "px" : props.maxHeight ?? `min(60vh, ${tokens.extensions.floating.maxHeight}px)`, overflowY: "auto" }}>
              <div class="kjun-popover-content" data-no-padding={String(props.noPadding)}>{slots.default?.({ close: () => change(false) })}</div>
              <FeedbackLayerOutlet />
            </section>
          ) }}
        </FloatingPanel>
      </>
    );
  },
});

const kjunTooltipProps = {
  content: { type: String, default: "" },
  placement: { type: String as PropType<"top" | "bottom" | "left" | "right">, default: "top" },
  delay: { type: Number, default: 0 },
} as const;
export type KjunTooltipProps = ExtractPublicPropTypes<typeof kjunTooltipProps>;
/** Default slot: the one focusable element the tooltip describes (it gets the hover, focus and aria-describedby wiring). */
export const KjunTooltip = defineComponent({
  name: "KjunTooltip",
  props: kjunTooltipProps,
  setup(props, { slots }) {
    const open = ref(false);
    const layer = useLayer(() => open.value, () => open.value, "tooltip", () => { open.value = false; });
    const reduced = useReducedMotion();
    const motion = usePresence(() => open.value && !layer.blocked.value, () => reduced.value, tokens.motion.tooltipExit);
    const target = usePortalTarget();
    const id = useKjunId("kjun-tooltip-");
    const anchor = ref<HTMLElement | null>(null), tip = ref<HTMLElement | null>(null);
    const position = reactive({ top: 0, left: 0, side: props.placement as string, arrow: 0 });
    const disabled = () => !props.content || !layer.scopeActive.value;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (immediate: boolean) => {
      if (disabled()) return;
      clearTimeout(timer);
      if (immediate || !props.delay) open.value = true;
      else timer = setTimeout(() => { open.value = true; }, props.delay);
    };
    const hide = () => { clearTimeout(timer); open.value = false; };
    watch(disabled, value => { if (value) hide(); });
    let uninstall: (() => void) | undefined;
    onMounted(() => { uninstall = installFocusVisible(document); });
    onBeforeUnmount(() => { clearTimeout(timer); uninstall?.(); });
    const update = () => {
      if (!anchor.value || !tip.value) return;
      const next = computeFloatingPosition(anchor.value.getBoundingClientRect(), { width: tip.value.offsetWidth, height: tip.value.offsetHeight },
        { placement: props.placement, gap: tokens.extensions.floating.anchorGap });
      const arrow = next.side === "top" || next.side === "bottom" ? next.arrow.left! : next.arrow.top!;
      if (position.top !== next.top || position.left !== next.left || position.side !== next.side || position.arrow !== arrow)
        Object.assign(position, { top: next.top, left: next.left, side: next.side, arrow });
    };
    watch(tip, element => { if (element) update(); }, { flush: "post" });
    onUpdated(update);
    const handlers = {
      onMouseenter: () => show(false),
      onMouseleave: hide,
      // Pointer focus does not open it: react-aria shows a tooltip on focus only for keyboard users.
      onFocus: () => { if (isFocusVisible()) show(true); },
      onBlur: hide,
      onPointerdown: hide,
    };
    return () => {
      const [child, ...rest] = (slots.default?.() ?? []).filter(node => isVNode(node));
      const shown = open.value && !layer.blocked.value;
      // The tooltip joins any description the app already gave the control.
      const described = [(child as VNode | undefined)?.props?.["aria-describedby"], shown ? id : undefined].filter(Boolean).join(" ") || undefined;
      const trigger = child && cloneVNode(child as VNode, { ...handlers, "aria-describedby": described,
        ref: (el: unknown) => {
          const next = el instanceof HTMLElement ? el : (el as { $el?: HTMLElement } | null)?.$el ?? null;
          // A replaced or removed control keeps only the app's own description.
          if (anchor.value && anchor.value !== next) {
            const kept = (anchor.value.getAttribute("aria-describedby") || "").split(" ").filter(token => token && token !== id).join(" ");
            if (kept) anchor.value.setAttribute("aria-describedby", kept); else anchor.value.removeAttribute("aria-describedby");
          }
          anchor.value = next;
        } }, true);
      const to = target();
      const vertical = position.side === "top" || position.side === "bottom";
      const arrowSize = tokens.extensions.tooltip.arrowSize;
      return (
        <>
          {trigger}{rest}
          {to !== null && motion.present() && (
            <Teleport to={to}>
              <div ref={tip} id={id} role="tooltip" class="kjun-scope kjun-tooltip" data-placement={position.side}
                data-entering={shown && !motion.active() ? "true" : undefined} data-exiting={!shown ? "true" : undefined}
                style={{ position: "fixed", zIndex: layer.zIndex.value, top: position.top + "px", left: position.left + "px" }}>
                <div style={{ position: "absolute", ...(vertical
                  ? { left: position.arrow + "px", transform: "translateX(-50%)", [position.side === "top" ? "top" : "bottom"]: "100%" }
                  : { top: position.arrow + "px", transform: "translateY(-50%)", [position.side === "left" ? "left" : "right"]: "100%" }) }}>
                  <svg width={arrowSize} height={arrowSize} viewBox="0 0 8 8"><path d="M0 0L4 4L8 0" fill="currentColor" /></svg>
                </div>
                {props.content}
              </div>
            </Teleport>
          )}
        </>
      );
    };
  },
});
