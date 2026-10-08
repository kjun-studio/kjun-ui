import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { usePresence } from "../../../shared/package-runtime/use-presence";
import { useReducedMotion } from "./use-reduced-motion";
import { tokens,type ButtonVariant,type InputSize } from "@kjun/tokens";
import { useId,useLayoutEffect,useRef,type ReactNode } from "react";
import { observeFormActions } from "../../../shared/package-runtime/form-actions";
import { Dialog,Heading,Modal,ModalOverlay } from "react-aria-components";
import { DsButton,DsIcon } from "./button";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useKjunPortalContainer } from "./provider";
export interface DsFormActionsProps {
  size?: InputSize;
  cancelText?: string;
  confirmText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  loading?: boolean;
  variant?: Extract<ButtonVariant, "primary" | "danger" | "success">;
  cancelVariant?: "ghost" | "secondary";
  onCancel?: () => void;
  onConfirm?: () => void;
}
export function DsFormActions({
  size = "lg",
  cancelText = "취소",
  confirmText = "저장",
  showCancel = true,
  showConfirm = true,
  cancelDisabled = false,
  confirmDisabled = false,
  loading = false,
  variant = "primary",
  cancelVariant = "ghost",
  onCancel,
  onConfirm,
}: DsFormActionsProps) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => observeFormActions(ref.current!), []);
  return (
    <div className="kjun-form-actions" ref={ref}>
      {showCancel && (
        <DsButton
          size={size}
          variant={cancelVariant}
          disabled={cancelDisabled}
          onClick={onCancel}
        >
          {cancelText}
        </DsButton>
      )}
      {showConfirm && (
        <DsButton
          size={size}
          variant={variant}
          disabled={confirmDisabled}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmText}
        </DsButton>
      )}
    </div>
  );
}
export interface DsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  loading?: boolean;
  noPadding?: boolean;
  height?: string;
  confirmVariant?: "primary" | "danger" | "success";
  footerSize?: InputSize;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
}
export function DsModal({
  open,
  onOpenChange,
  onClose,
  onCancel,
  onConfirm,
  title = "",
  size = "md",
  closable = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  showHeader = true,
  showFooter = false,
  showConfirmButton = true,
  showCancelButton = true,
  confirmText = "확인",
  cancelText = "취소",
  confirmDisabled = false,
  loading = false,
  noPadding = false,
  height,
  confirmVariant = "primary",
  footerSize = "md",
  header,
  footer,
  children,
  ariaLabel,
}: DsModalProps) {
  const motion = usePresence(open, useReducedMotion());
  const portalContainer = useKjunPortalContainer();
  const id = useId();
  const explicitLabel = ariaLabel?.trim();
  const heading = header || title;
  const labelledByHeading = showHeader && !explicitLabel &&
    (typeof heading === "string" ? !!heading.trim() : !!heading);
  const close = () => {
    if (!open) return;
    onOpenChange(false);
    onClose?.();
  };
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); });
  if (portalContainer === null) return null;
  return (
    <LayerScope.Provider value={layer.id}>
    <ModalOverlay
      style={{ zIndex: layer.zIndex }}
      // Retain inactive content without retaining its focus trap or outside isolation.
      isOpen={motion.present && layer.active}
      isExiting={motion.present && !layer.active}
      onOpenChange={(value) => {
        if (value) onOpenChange(true);
        else close();
      }}
      isDismissable={closeOnOverlay}
      isKeyboardDismissDisabled={layer.keyboardManaged || !closeOnEsc}
      className="kjun-scope kjun-modal-overlay"
      data-motion="modal" data-motion-open={String(motion.active)}
      inert={!open || !layer.active}
      UNSTABLE_portalContainer={portalContainer}
    >
      <Modal
        className="kjun-modal"
        data-size={size}
        data-fixed={!!height}
        style={{
          zIndex: layer.state.zIndex(layer.id, "content"),
          width:
            size === "full" ? "calc(100vw - 2 * var(--_kjun-geometry-modal-mobile-inset))" : tokens.modal.widths[size],
          height:
            height || (size === "full" ? "calc(100dvh - 2 * var(--_kjun-geometry-modal-mobile-inset))" : undefined),
        }}
      >
        <Dialog
          className="kjun-modal-dialog"
          ref={node => { const entry = layer.state.entries.get(layer.id); if (entry) entry.root = node; }}
          aria-label={explicitLabel || (labelledByHeading ? undefined : title.trim() || "대화상자")}
          aria-labelledby={labelledByHeading ? id : undefined}
        >
          {showHeader && (
            <div className="kjun-modal-header">
              <Heading slot="title" id={id} className="kjun-modal-title">
                {heading}
              </Heading>
              {closable && (
                <button
                  type="button"
                  className="kjun-modal-close"
                  aria-label="닫기"
                  onClick={close}
                >
                  <DsIcon name="x" size={tokens.modal.closeIconSize} />
                </button>
              )}
            </div>
          )}
          <div
            className="kjun-modal-body"
            style={noPadding ? { padding: 0 } : undefined}
          >
            {children}
          </div>
          {(showFooter || footer) && (
            <div className="kjun-modal-footer">
              {footer || (
                <DsFormActions
                  size={footerSize}
                  cancelVariant="secondary"
                  showCancel={showCancelButton}
                  showConfirm={showConfirmButton}
                  cancelText={cancelText}
                  confirmText={confirmText}
                  confirmDisabled={confirmDisabled}
                  loading={loading}
                  variant={confirmVariant}
                  onConfirm={onConfirm}
                  onCancel={() => {
                    onCancel?.();
                    close();
                  }}
                />
              )}
            </div>
          )}
          <FeedbackLayerOutlet />
        </Dialog>
      </Modal>
    </ModalOverlay>
    </LayerScope.Provider>
  );
}
