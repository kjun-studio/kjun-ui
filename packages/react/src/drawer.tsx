import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { tokens } from "@kjun-ui/tokens";
import { drawerOverlayVars } from "../../../shared/package-runtime/drawer-geometry";
import { useAfterCloseRef } from "../../../shared/package-runtime/use-after-close";
import { usePresence } from "../../../shared/package-runtime/use-presence";
import { useReducedMotion } from "./use-reduced-motion";
import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { KjunButton, KjunIcon } from "./button";
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
  footer?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  /** Called once after the close finishes and the layer has left the screen (not when it mounts closed or reopens during the exit). */
  onAfterClose?: () => void;
  ariaLabel?: string;
  /** Top safe area in px, padded inside top and side drawers and kept clear above a bottom sheet. */
  safeAreaTop?: number;
  /** Bottom safe area in px, padded inside bottom and side drawers and kept clear below a top sheet. */
  safeAreaBottom?: number;
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
  footer,
  children,
  onClose,
  onAfterClose,
  ariaLabel,
  safeAreaTop = 0,
  safeAreaBottom = 0,
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
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); });
  if (container === null) return null;
  return (
    <LayerScope.Provider value={layer.id}>
    <ModalOverlay
      ref={afterCloseRef}
      style={{ zIndex: layer.zIndex, ...drawerOverlayVars({ safeAreaTop, safeAreaBottom, maxHeight }) }}
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
        className="kjun-drawer"
        style={{
          zIndex: layer.state.zIndex(layer.id, "content"),
          width: position === "left" || position === "right" ? width : "100%",
        }}
      >
        <Dialog
          aria-label={ariaLabel || title || m.panel}
          className="kjun-drawer-dialog"
          ref={node => { const entry = layer.state.entries.get(layer.id); if (entry) entry.root = node; }}
        >
          {(title || header || closable) && (
            <div className="kjun-drawer-header">
              <div>{header || <h2>{title}</h2>}</div>
              {closable && (
                <KjunButton
                  size="sm"
                  variant="ghost"
                  ariaLabel={m.close}
                  onClick={close}
                  style={{ borderRadius: tokens.extensions.drawer.closeRadius, width: tokens.extensions.drawer.closeSize, height: tokens.extensions.drawer.closeSize, padding: 0 }}
                ><KjunIcon name="x" size={tokens.extensions.drawer.closeIconSize} /></KjunButton>
              )}
            </div>
          )}
          <div
            className="kjun-drawer-body"
            style={{ padding: noPadding ? 0 : tokens.extensions.drawer.bodyPadding }}
          >
            {children}
          </div>
          {footer && <div className="kjun-drawer-footer">{footer}</div>}
          <FeedbackLayerOutlet />
        </Dialog>
      </Modal>
    </ModalOverlay>
    </LayerScope.Provider>
  );
}
