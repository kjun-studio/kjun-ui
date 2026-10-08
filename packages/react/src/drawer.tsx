import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { tokens } from "@kjun-ui/tokens";
import { usePresence } from "../../../shared/package-runtime/use-presence";
import { useReducedMotion } from "./use-reduced-motion";
import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { DsButton, DsIcon } from "./button";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useKjunPortalContainer } from "./provider";
export interface DsDrawerProps {
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
  ariaLabel?: string;
}
export function DsDrawer({
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
  ariaLabel,
}: DsDrawerProps) {
  const motion = usePresence(open, useReducedMotion(), tokens.motion.layerExit);
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
      style={{ zIndex: layer.zIndex }}
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
          aria-label={ariaLabel || title || "패널"}
          className="kjun-drawer-dialog"
          ref={node => { const entry = layer.state.entries.get(layer.id); if (entry) entry.root = node; }}
        >
          {(title || header || closable) && (
            <div className="kjun-drawer-header">
              <div>{header || <h2>{title}</h2>}</div>
              {closable && (
                <DsButton
                  size="sm"
                  variant="ghost"
                  ariaLabel="닫기"
                  onClick={close}
                  style={{ borderRadius: tokens.extensions.drawer.closeRadius, width: tokens.extensions.drawer.closeSize, height: tokens.extensions.drawer.closeSize, padding: 0 }}
                ><DsIcon name="x" size={tokens.extensions.drawer.closeIconSize} /></DsButton>
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
