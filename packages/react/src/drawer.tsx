import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { tokens } from "@kjun-ui/tokens";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { drawerCloseStyle, drawerOverlayVars } from "../../../shared/package-runtime/drawer-geometry";
import { sheetDragStart } from "../../../shared/package-runtime/sheet-drag";
import { useAfterCloseRef } from "../../../shared/package-runtime/use-after-close";
import { usePresence } from "../../../shared/package-runtime/use-presence";
import { useReducedMotion } from "./use-reduced-motion";
import { useCallback, useId, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { KjunButton, KjunIcon } from "./button";
import { resolveFocusReturn, type FocusReturn } from "./floating-panel";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useKjunPortalContainer } from "./provider";
export interface KjunDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  position?: "left" | "right" | "top" | "bottom";
  width?: number | string;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  noPadding?: boolean;
  header?: ReactNode;
  /** Secondary actions in the title row, before the close button (such as a reset button). */
  headerActions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  /** Called once after the close finishes and the layer has left the screen (not when it mounts closed or reopens during the exit). */
  onAfterClose?: () => void;
  ariaLabel?: string;
  /** Id of the element that describes the drawer, read after its name. */
  ariaDescribedBy?: string;
  /** Read after the exit finishes; a missing target falls back to the opener or parent window. */
  returnFocus?: FocusReturn;
  /** Bottom drawers: a grab handle above the header; dragging the handle or header down closes the drawer. */
  handle?: boolean;
  /** Keeps clear of KjunProvider's safe area (default true): padded inside the panel and kept clear beyond a sheet. */
  safeArea?: boolean;
  /** Height limit in px for top and bottom drawers; by default they stop a sheet gap short of the opposite edge. */
  maxHeight?: number;
}
export function KjunDrawer({
  open,
  onOpenChange,
  title,
  position = "right",
  width = tokens.extensions.drawer.width,
  closable = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  noPadding = false,
  header,
  headerActions,
  footer,
  children,
  onClose,
  onAfterClose,
  ariaLabel,
  ariaDescribedBy,
  returnFocus,
  handle = false,
  safeArea = true,
  maxHeight,
}: KjunDrawerProps) {
  const m = useKjunMessages();
  const motion = usePresence(open, useReducedMotion(), tokens.motion.layerExit);
  const afterCloseRef = useAfterCloseRef(open, onAfterClose);
  const container = useKjunPortalContainer();
  const close = () => {
    if (!open) return;
    onOpenChange(false);
    onClose?.();
  };
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); }, undefined, resolveFocusReturn(returnFocus));
  const titleId = "kjun-" + useId();
  const overlayRef = useRef<HTMLDivElement | null>(null), panelRef = useRef<HTMLDivElement | null>(null);
  const overlayNode = useCallback((node: HTMLDivElement | null) => { overlayRef.current = node; afterCloseRef(node); }, [afterCloseRef]);
  // Without a title or header only the close button remains: no title band, no empty heading.
  const titled = !!title || hasContent(header), actions = hasContent(headerActions);
  const explicitLabel = ariaLabel?.trim();
  const grab = handle && position === "bottom";
  const drag = sheetDragStart({ overlay: () => overlayRef.current, panel: () => panelRef.current,
    distance: tokens.extensions.drawer.dismissDistance, enabled: () => open && layer.active, onDismiss: close });
  const dragProps = grab ? { onPointerDown: (event: ReactPointerEvent) => drag(event.nativeEvent, event.currentTarget as HTMLElement), "data-drag": "" } : {};
  if (container === null) return null;
  return (
    <LayerScope.Provider value={layer.id}>
    <ModalOverlay
      ref={overlayNode}
      style={{ zIndex: layer.zIndex, ...drawerOverlayVars({ safeArea, maxHeight }) }}
      // Retain inactive content without retaining its focus trap or outside isolation.
      isOpen={motion.present && layer.active}
      isExiting={motion.present && !layer.active}
      onOpenChange={(v) => {
        if (!v) close();
      }}
      isDismissable={closeOnOverlay}
      isKeyboardDismissDisabled={layer.keyboardManaged || !closeOnEsc}
      UNSTABLE_portalContainer={container}
      className="kjun-scope kjun-drawer-overlay"
      data-motion="drawer" data-motion-open={String(motion.active)} inert={!open || !layer.active}
      data-position={position}
    >
      <Modal
        ref={panelRef}
        className="kjun-drawer"
        style={{
          zIndex: layer.state.zIndex(layer.id, "content"),
          width: position === "left" || position === "right" ? width : "100%",
        }}
      >
        <Dialog
          aria-label={explicitLabel || (titled ? undefined : m.panel)}
          aria-labelledby={explicitLabel || !titled ? undefined : titleId}
          aria-describedby={ariaDescribedBy}
          className="kjun-drawer-dialog"
          ref={node => { const entry = layer.state.entries.get(layer.id); if (entry) entry.root = node; }}
        >
          {grab && <div className="kjun-drawer-handle" aria-hidden="true" {...dragProps}><span /></div>}
          {(titled || closable || actions) && (
            <div className="kjun-drawer-header" data-bare={titled ? undefined : ""} {...dragProps}>
              {titled && <div className="kjun-drawer-title" id={titleId}>{hasContent(header) ? header : <h2>{title}</h2>}</div>}
              {(actions || closable) && (
                <div className="kjun-drawer-actions">
                  {actions && headerActions}
                  {closable && (
                    <KjunButton size="sm" variant="ghost" ariaLabel={m.close} onClick={close} className="kjun-drawer-close" style={drawerCloseStyle}>
                      <KjunIcon name="x" size={tokens.extensions.drawer.closeIconSize} />
                    </KjunButton>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="kjun-drawer-body" data-no-padding={noPadding ? "" : undefined}>
            {children}
          </div>
          {hasContent(footer) && <div className="kjun-drawer-footer">{footer}</div>}
          <FeedbackLayerOutlet />
        </Dialog>
      </Modal>
    </ModalOverlay>
    </LayerScope.Provider>
  );
}
