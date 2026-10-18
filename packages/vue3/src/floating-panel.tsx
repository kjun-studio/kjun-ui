import { Teleport, defineComponent, inject, onBeforeUnmount, onUpdated, provide, reactive, ref, watch, type PropType } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { computeFloatingPosition, type Placement } from "../../../shared/package-runtime/floating-position";
import { kjunPortalKey } from "./runtime/keys";
import { kjunLayerScopeKey, useLayer } from "./runtime/layers";
import { usePresence, useReducedMotion } from "./runtime/presence";

export type { Placement };

/** Where a layer's DOM goes: the Provider's layer host, or document.body without a Provider. null waits for the host. */
export function usePortalTarget() {
  const portal = inject(kjunPortalKey, undefined);
  return () => portal === undefined ? "body" as const : portal.value;
}

/**
 * The react-aria Popover's role in React: a fixed panel beside its trigger that flips to the roomier side,
 * caps its height to the viewport, closes on an outside press (unless non-modal) and joins the layer stack.
 */
export const FloatingPanel = defineComponent({
  name: "KjunFloatingPanel",
  props: {
    open: { type: Boolean, required: true },
    trigger: { type: Function as PropType<() => HTMLElement | null>, required: true },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, required: true },
    placement: { type: String as PropType<Placement>, default: "bottom" },
    panelClass: { type: String, default: "" },
    matchTriggerWidth: { type: Boolean, default: false },
    maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
    field: { type: Boolean, default: false },
    flip: { type: Boolean, default: true },
    nonModal: { type: Boolean, default: false },
    returnFocus: { type: Function as PropType<() => HTMLElement | null | false | undefined>, default: undefined },
    /** The panel is itself the dialog unless its content renders one (Popover). */
    dialog: { type: Boolean, default: true },
  },
  setup(props, { slots, expose }) {
    const reduced = useReducedMotion();
    const motion = usePresence(() => props.open, () => reduced.value, tokens.motion.popupExit);
    // Read returnFocus at close time so a prop set or cleared after mount is honoured.
    const layer = useLayer(() => props.open, motion.present, "popup", () => props.onOpenChange(false), () => props.trigger(),
      () => props.returnFocus?.());
    provide(kjunLayerScopeKey, layer.id);
    const target = usePortalTarget();
    const panel = ref<HTMLElement | null>(null);
    const position = reactive({ top: 0, left: 0, side: "bottom" as string, maxHeight: undefined as number | undefined, triggerWidth: 0 });
    const cap = () => typeof props.maxHeight === "number" ? props.maxHeight
      : props.maxHeight == null ? props.field ? tokens.extensions.menu.listMaxHeight : tokens.extensions.floating.maxHeight : undefined;
    const update = () => {
      const trigger = props.trigger(), element = panel.value;
      if (!trigger || !element) return;
      const rect = trigger.getBoundingClientRect();
      const next = computeFloatingPosition(rect, { width: element.offsetWidth, height: element.scrollHeight }, {
        placement: props.placement, flip: props.flip, maxHeight: cap(),
        gap: props.field ? tokens.extensions.floating.fieldGap : tokens.extensions.floating.anchorGap,
      });
      if (position.top !== next.top) position.top = next.top;
      if (position.left !== next.left) position.left = next.left;
      if (position.side !== next.side) position.side = next.side;
      if (position.maxHeight !== next.maxHeight) position.maxHeight = next.maxHeight;
      if (position.triggerWidth !== rect.width) position.triggerWidth = rect.width;
    };
    let frame = 0, observer: ResizeObserver | undefined, pressedOutside = false;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    // Only the topmost layer reacts: a child menu is portaled outside this panel, so its presses look "outside".
    const topmost = () => layer.state.topPopup()?.id === layer.id;
    const outside = (node: EventTarget | null) => node instanceof Node && !panel.value?.contains(node) && !props.trigger()?.contains(node);
    const onPointerDown = (event: PointerEvent) => { pressedOutside = props.open && topmost() && outside(event.target); };
    const onPointerUp = (event: PointerEvent) => {
      if (pressedOutside && props.open && topmost() && outside(event.target)) props.onOpenChange(false);
      pressedOutside = false;
    };
    // Without a Provider the shared Escape handling is not installed.
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && props.open && topmost()) props.onOpenChange(false); };
    const attach = () => {
      detach();
      if (!panel.value) return;
      update();
      observer = new ResizeObserver(schedule);
      observer.observe(panel.value);
      const trigger = props.trigger();
      if (trigger) observer.observe(trigger);
      window.addEventListener("scroll", schedule, true);
      window.addEventListener("resize", schedule);
      if (!props.nonModal) { document.addEventListener("pointerdown", onPointerDown, true); document.addEventListener("pointerup", onPointerUp, true); }
      if (!layer.keyboardManaged) document.addEventListener("keydown", onKeyDown);
    };
    const detach = () => {
      cancelAnimationFrame(frame);
      observer?.disconnect(); observer = undefined;
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("keydown", onKeyDown);
    };
    watch(panel, element => { if (element) attach(); else detach(); }, { flush: "post" });
    onUpdated(update);
    onBeforeUnmount(detach);
    expose({ panel });
    const dismiss = () => (
      <div class="kjun-sr-only"><button aria-label="Dismiss" tabindex={-1} onClick={() => props.onOpenChange(false)} /></div>
    );
    return () => {
      const to = target();
      if (to === null || layer.blocked.value || !motion.present()) return null;
      return (
        <Teleport to={to}>
          <div ref={panel} data-motion="popup" data-motion-open={String(motion.active())} class={["kjun-scope kjun-floating", props.panelClass]}
            data-placement={position.side} inert={!props.open}
            role={props.dialog && !props.nonModal ? "dialog" : undefined} tabindex={props.dialog && !props.nonModal ? -1 : undefined}
            style={{
              position: "fixed", zIndex: layer.zIndex.value, top: position.top + "px", left: position.left + "px",
              maxHeight: position.maxHeight != null ? position.maxHeight + "px" : undefined,
              "--trigger-width": position.triggerWidth + "px",
              width: props.matchTriggerWidth ? "var(--trigger-width)" : undefined,
            }}>
            {!props.nonModal && dismiss()}
            {slots.default?.()}
            {dismiss()}
          </div>
        </Teleport>
      );
    };
  },
});
