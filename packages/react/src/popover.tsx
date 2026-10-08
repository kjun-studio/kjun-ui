import { tokens } from "@kjun/tokens";
import { usePopupExpanded } from "../../../shared/package-runtime/use-layer";
import { useLayer } from "../../../shared/package-runtime/use-layer";
import { useCallback, useId, useRef, useState, type CSSProperties, type ReactNode, type ComponentProps } from "react";
import { Dialog, Focusable, OverlayArrow, Tooltip, TooltipTrigger } from "react-aria-components";
import { FloatingPanel } from "./floating-panel";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useKjunPortalContainer } from "./provider";
export interface DsPopoverProps {
  noPadding?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  manualTrigger?: boolean;
  matchTriggerWidth?: boolean;
  maxHeight?: CSSProperties["maxHeight"];
  flip?: boolean;
  focusOnOpen?: boolean;
  ariaLabel?: string;
  placement?: "top" | "bottom" | "left" | "right";
  trigger: ReactNode | ((open: boolean) => ReactNode);
  children: ReactNode | ((close: () => void) => ReactNode);
}
export function DsPopover({
  noPadding = false,
  open: controlled,
  onOpenChange,
  manualTrigger = false,
  matchTriggerWidth = false,
  maxHeight,
  flip = true,
  focusOnOpen = false,
  ariaLabel,
  placement = "bottom",
  trigger,
  children,
}: DsPopoverProps) {
  const [internal, setInternal] = useState(false),
    open = controlled ?? internal,
    ref = useRef<HTMLDivElement>(null),
    id = useId();
  const expanded = usePopupExpanded(open, ref);
  const focusOnMount = useRef(focusOnOpen);
  focusOnMount.current = focusOnOpen;
  // Focus the newly mounted dialog, without taking focus back during editing.
  const focusContent = useCallback((node: HTMLElement | null) => {
    if (node && focusOnMount.current) node.focus();
  }, []);
  const change = (v: boolean) => {
    setInternal(v);
    onOpenChange?.(v);
  };
  return (
    <>
      <div
        ref={ref}
        className="kjun-layer-trigger"
        onClickCapture={() => {
          if (!manualTrigger) change(!open);
        }}
        onKeyDown={(event) => {
          if (
            !manualTrigger &&
            ["Enter", " "].includes(event.key) &&
            event.target === event.currentTarget
          ) {
            event.preventDefault();
            change(!open);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
      >
        {typeof trigger === "function" ? trigger(open) : trigger}
      </div>
      <FloatingPanel
        open={open}
        onOpenChange={change}
        triggerRef={ref}
        className="kjun-content-popover"
        placement={placement}
        matchTriggerWidth={matchTriggerWidth}
        maxHeight={maxHeight}
        flip={flip}
      >
        <Dialog
          id={id}
          aria-label={ariaLabel || "상세 정보"}
          className="kjun-popover-dialog"
          style={{ maxHeight: maxHeight ?? `min(60vh, ${tokens.extensions.floating.maxHeight}px)`, overflowY: "auto" }}
          ref={focusContent}
        >
          <div className="kjun-popover-content" data-no-padding={noPadding}>{typeof children === "function"
            ? children(() => change(false))
            : children}</div>
          <FeedbackLayerOutlet />
        </Dialog>
      </FloatingPanel>
    </>
  );
}
export interface DsTooltipProps {
  content?: string;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: ReactNode;
}
export function DsTooltip({
  content = "",
  placement = "top",
  delay = 0,
  children,
}: DsTooltipProps) {
  const container = useKjunPortalContainer();
  const [open, setOpen] = useState(false);
  const layer = useLayer(open, open, "tooltip", () => setOpen(false));
  return (
    <TooltipTrigger isOpen={open && !layer.blocked} onOpenChange={setOpen} delay={delay} closeDelay={0} isDisabled={!content || !layer.scopeActive}>
      <Focusable>
        {children as ComponentProps<typeof Focusable>["children"]}
      </Focusable>
      {container !== null && (
        <Tooltip
          style={{ zIndex: layer.zIndex }}
          UNSTABLE_portalContainer={container}
          placement={placement}
          offset={tokens.extensions.floating.anchorGap}
          className="kjun-scope kjun-tooltip"
        >
          <OverlayArrow>
            <svg width={tokens.extensions.tooltip.arrowSize} height={tokens.extensions.tooltip.arrowSize} viewBox="0 0 8 8">
              <path d="M0 0L4 4L8 0" fill="currentColor" />
            </svg>
          </OverlayArrow>
          {content}
        </Tooltip>
      )}
    </TooltipTrigger>
  );
}
