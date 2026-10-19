import { Teleport, defineComponent, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { drawerOverlayVars } from "../../../shared/package-runtime/drawer-geometry";
import { KjunButton, KjunIcon } from "./button";
import { usePortalTarget } from "./floating-panel";
import { DismissButton, bindWindowRoot, useOutsidePress, useWindowLayer } from "./modal";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useModalOverlay } from "./runtime/modal";
import { hasContent } from "./runtime/slots";
import { css } from "./runtime/style";

const kjunDrawerProps = {
  open: { type: Boolean, required: true },
  title: { type: String, default: undefined },
  position: { type: String as PropType<"left" | "right" | "top" | "bottom">, default: "right" },
  width: { type: [Number, String] as PropType<number | string>, default: tokens.extensions.drawer.width },
  closable: { type: Boolean, default: true },
  closeOnOverlay: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
  noPadding: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  /** Top safe area in px, padded inside top and side drawers and kept clear above a bottom sheet. */
  safeAreaTop: { type: Number, default: 0 },
  /** Bottom safe area in px, padded inside bottom and side drawers and kept clear below a top sheet. */
  safeAreaBottom: { type: Number, default: 0 },
  /** Height limit in px for top and bottom drawers; by default they stop a sheet gap short of the opposite edge. */
  maxHeight: { type: Number, default: undefined },
} as const;
export type KjunDrawerProps = ExtractPublicPropTypes<typeof kjunDrawerProps>;
/** v-model:open. Slots: default (body), header (replaces the title), footer. Event: close. */
export const KjunDrawer = defineComponent({
  name: "KjunDrawer",
  props: kjunDrawerProps,
  emits: { "update:open": (_open: boolean) => true, close: () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const target = usePortalTarget();
    const close = () => { if (!props.open) return; emit("update:open", false); emit("close"); };
    const { motion, layer } = useWindowLayer(() => props.open, close, () => props.closeOnEsc, tokens.motion.layerExit);
    const overlay = ref<HTMLElement | null>(null), drawer = ref<HTMLElement | null>(null), dialog = ref<HTMLElement | null>(null);
    useModalOverlay(overlay, dialog, () => props.open && layer.active.value);
    const press = useOutsidePress(() => drawer.value, () => props.closeOnOverlay && props.open && layer.active.value, close);
    const rootRef = bindWindowRoot(layer);
    return () => {
      const to = target();
      if (to === null || !motion.present()) return null;
      const header = slots.header?.(), footer = slots.footer?.();
      const sideways = props.position === "left" || props.position === "right";
      return (
        <Teleport to={to}>
          <div ref={overlay} class="kjun-scope kjun-drawer-overlay" data-motion="drawer" data-motion-open={String(motion.active())}
            inert={!props.open || !layer.active.value} data-position={props.position} style={{ zIndex: layer.zIndex.value, ...drawerOverlayVars(props) }} {...press}>
            <div ref={drawer} class="kjun-drawer" style={css({ zIndex: layer.state.zIndex(layer.id, "content"), width: sideways ? props.width : "100%" })}>
              <DismissButton onDismiss={close} />
              <section ref={(node: unknown) => { dialog.value = node as HTMLElement | null; rootRef(node); }} class="kjun-drawer-dialog" role="dialog" tabindex={-1}
                aria-label={props.ariaLabel || props.title || "패널"}>
                {(props.title || hasContent(header) || props.closable) && (
                  <div class="kjun-drawer-header">
                    <div>{hasContent(header) ? header : <h2>{props.title}</h2>}</div>
                    {props.closable && (
                      <KjunButton size="sm" variant="ghost" ariaLabel="닫기" onClick={close} style={css({ borderRadius: tokens.extensions.drawer.closeRadius,
                        width: tokens.extensions.drawer.closeSize, height: tokens.extensions.drawer.closeSize, padding: 0 })}>
                        <KjunIcon name="x" size={tokens.extensions.drawer.closeIconSize} />
                      </KjunButton>
                    )}
                  </div>
                )}
                <div class="kjun-drawer-body" style={css({ padding: props.noPadding ? 0 : tokens.extensions.drawer.bodyPadding })}>{slots.default?.()}</div>
                {hasContent(footer) && <div class="kjun-drawer-footer">{footer}</div>}
                <FeedbackLayerOutlet />
              </section>
            </div>
          </div>
        </Teleport>
      );
    };
  },
});
