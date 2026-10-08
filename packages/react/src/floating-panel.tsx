import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { isComposingKey, tokens } from "@kjun/tokens";
import { usePresence } from "../../../shared/package-runtime/use-presence";
import { useReducedMotion } from "./use-reduced-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Popover as AriaPopover } from "react-aria-components";
import { useKjunPortalContainer } from "./provider";
export type Placement =   | "top"
  | "bottom"
  | "left"
  | "right"
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end";
export function FloatingPanel({
  open,
  onOpenChange,
  triggerRef,
  children,
  placement = "bottom",
  className = "",
  matchTriggerWidth = false,
  maxHeight,
  field = false,
  flip = true,
  nonModal = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  placement?: Placement;
  className?: string;
  matchTriggerWidth?: boolean;
  maxHeight?: CSSProperties["maxHeight"];
  field?: boolean;
  flip?: boolean;
  nonModal?: boolean;
}) {
  const motion = usePresence(open, useReducedMotion(), tokens.motion.popupExit);
  const layer = useLayer(open, motion.present, "popup", () => onOpenChange(false), triggerRef);
  const container = useKjunPortalContainer();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const document = triggerRef.current?.ownerDocument;
    if (!open || nonModal || !document || layer.keyboardManaged) return;
    // Making the trigger inert can leave focus on the body until popup autofocus runs.
    // Only bridge that gap; focused children and higher overlays own their keyboard events.
    const dismissBeforeFocus = (event: KeyboardEvent) => {
      const popup = panel.current, focused = document.activeElement;
      if (event.key !== "Escape" || event.defaultPrevented || event.repeat || isComposingKey(event) ||
          !popup || popup.closest('[inert], [aria-hidden="true"]')) return;
      if (focused !== document.body && focused !== document.documentElement &&
          !triggerRef.current?.contains(focused)) return;
      event.preventDefault();
      event.stopPropagation();
      // Activate this focus scope so its normal cleanup restores the opening control.
      (popup.querySelector<HTMLElement>('[role="dialog"]') ?? popup).focus({ preventScroll: true });
      onOpenChange(false);
    };
    document.addEventListener("keydown", dismissBeforeFocus, true);
    return () => document.removeEventListener("keydown", dismissBeforeFocus, true);
  }, [open, nonModal, triggerRef, onOpenChange, layer.keyboardManaged]);
  if (container === null || layer.blocked) return null;
  return (
    <LayerScope.Provider value={layer.id}>
    <AriaPopover
      ref={panel}
      isNonModal={nonModal}
      isKeyboardDismissDisabled={layer.keyboardManaged}
      isOpen={motion.present}
      onOpenChange={onOpenChange}
      triggerRef={triggerRef}
      UNSTABLE_portalContainer={container}
      placement={placement.replace("-", " ") as "bottom start"}
      shouldFlip={flip}
      // The positioning engine writes max-height directly; pass its numeric cap too.
      maxHeight={typeof maxHeight === "number" ? maxHeight : maxHeight == null ? field ? tokens.extensions.menu.listMaxHeight : tokens.extensions.floating.maxHeight : undefined}
      offset={field ? tokens.extensions.floating.fieldGap : tokens.extensions.floating.anchorGap}
      containerPadding={tokens.extensions.floating.viewportInset}
      className={"kjun-scope kjun-floating " + className}
      data-motion="popup" data-motion-open={String(motion.active)} inert={!open}
      style={{
        zIndex: layer.zIndex,
        width: matchTriggerWidth ? "var(--trigger-width)" : undefined,
      }}
    >
      {children}
    </AriaPopover>
    </LayerScope.Provider>
  );
}
