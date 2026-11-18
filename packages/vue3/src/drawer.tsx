import { useKjunMessages } from "./runtime/messages";
import { Teleport, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { drawerCloseStyle, drawerOverlayVars } from "../../../shared/package-runtime/drawer-geometry";
import { sheetDragStart } from "../../../shared/package-runtime/sheet-drag";
import { KjunButton, KjunIcon } from "./button";
import { focusReturnProp, readFocusReturn, usePortalTarget } from "./floating-panel";
import { useKjunId } from "./input";
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
  /** Id of the element that describes the drawer, read after its name. */
  ariaDescribedBy: { type: String, default: undefined },
  /** Read after the exit finishes; a missing target falls back to the opener or parent window. */
  returnFocus: focusReturnProp,
  /** Bottom drawers: a grab handle above the header; dragging the handle or header down closes the drawer. */
  handle: { type: Boolean, default: false },
  /** Keeps clear of KjunProvider's safe area: padded inside the panel and kept clear beyond a sheet. */
  safeArea: { type: Boolean, default: true },
  /** Height limit in px for top and bottom drawers; by default they stop a sheet gap short of the opposite edge. */
  maxHeight: { type: Number, default: undefined },
} as const;
export type KjunDrawerProps = ExtractPublicPropTypes<typeof kjunDrawerProps>;
/** v-model:open. Slots: default (body), header (replaces the title), headerActions (before the close button), footer. Events: close, after-close. */
export const KjunDrawer = defineComponent({
  name: "KjunDrawer",
  props: kjunDrawerProps,
  emits: { "update:open": (_open: boolean) => true, close: () => true, "after-close": () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    headerActions?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const target = usePortalTarget();
    const close = () => { if (!props.open) return; emit("update:open", false); emit("close"); };
    const { motion, layer } = useWindowLayer(() => props.open, close, () => props.closeOnEsc, tokens.motion.layerExit, () => emit("after-close"),
      () => readFocusReturn(props.returnFocus));
    const titleId = useKjunId("kjun-");
    const overlay = ref<HTMLElement | null>(null), drawer = ref<HTMLElement | null>(null), dialog = ref<HTMLElement | null>(null);
    // Keep the page isolated until the exit finishes; only the panel content becomes inert on close.
    useModalOverlay(overlay, dialog, () => motion.present() && layer.active.value);
    const press = useOutsidePress(() => drawer.value, () => props.closeOnOverlay && props.open && layer.active.value, close);
    const rootRef = bindWindowRoot(layer);
    const drag = sheetDragStart({ overlay: () => overlay.value, panel: () => drawer.value,
      distance: tokens.extensions.drawer.dismissDistance, enabled: () => props.open && layer.active.value, onDismiss: close });
    return () => {
      const to = target();
      if (to === null || !motion.present()) return null;
      const header = slots.header?.(), footer = slots.footer?.(), headerActions = slots.headerActions?.();
      const sideways = props.position === "left" || props.position === "right";
      // Without a title or header only the close button remains: no title band, no empty heading.
      const titled = !!props.title || hasContent(header), actions = hasContent(headerActions);
      const explicitLabel = props.ariaLabel?.trim();
      const dragProps = props.handle && props.position === "bottom"
        ? { onPointerdown: (event: PointerEvent) => drag(event, event.currentTarget as HTMLElement), "data-drag": "" } : null;
      return (
        <Teleport to={to}>
          <div ref={overlay} class="kjun-scope kjun-drawer-overlay" data-motion="drawer" data-motion-open={String(motion.active())}
            inert={!layer.active.value} data-position={props.position} style={{ zIndex: layer.zIndex.value, ...drawerOverlayVars(props) }} {...press}>
            <div ref={drawer} class="kjun-drawer" inert={!props.open} style={css({ zIndex: layer.state.zIndex(layer.id, "content"), width: sideways ? props.width : "100%" })}>
              <DismissButton onDismiss={close} />
              <section ref={(node: unknown) => { dialog.value = node as HTMLElement | null; rootRef(node); }} class="kjun-drawer-dialog" role="dialog" tabindex={-1}
                aria-label={explicitLabel || (titled ? undefined : m.value.panel)} aria-labelledby={explicitLabel || !titled ? undefined : titleId}
                aria-describedby={props.ariaDescribedBy}>
                {dragProps && <div class="kjun-drawer-handle" aria-hidden="true" {...dragProps}><span /></div>}
                {(titled || props.closable || actions) && (
                  <div class="kjun-drawer-header" data-bare={titled ? undefined : ""} {...dragProps}>
                    {titled && <div class="kjun-drawer-title" id={titleId}>{hasContent(header) ? header : <h2>{props.title}</h2>}</div>}
                    {(actions || props.closable) && (
                      <div class="kjun-drawer-actions">
                        {actions && headerActions}
                        {props.closable && (
                          <KjunButton size="sm" variant="ghost" ariaLabel={m.value.close} onClick={close} class="kjun-drawer-close" style={css(drawerCloseStyle)}>
                            <KjunIcon name="x" size={tokens.extensions.drawer.closeIconSize} />
                          </KjunButton>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div class="kjun-drawer-body" data-no-padding={props.noPadding ? "" : undefined}>{slots.default?.()}</div>
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
