import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { usePopupExpanded } from "../../../shared/package-runtime/use-layer";
import { useLayer } from "../../../shared/package-runtime/use-layer";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type ComponentProps, type RefObject } from "react";
import { Dialog, Focusable, OverlayArrow, Tooltip, TooltipTrigger } from "react-aria-components";
import { FloatingPanel, resolveFocusReturn } from "./floating-panel";
import { installNonModalPopover } from "../../../shared/package-runtime/popover-nonmodal";
import { FeedbackLayerOutlet } from "./overlay-host";
import { useKjunPortalContainer } from "./provider";
export interface KjunPopoverProps {
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
  /** Where focus goes when the Popover closes. Defaults to the trigger, also when the target is gone. */
  returnFocus?: HTMLElement | RefObject<HTMLElement | null> | (() => HTMLElement | null);
  /** Fixed header above the body; only the body scrolls and maxHeight covers both. Names the dialog without ariaLabel. */
  header?: ReactNode;
  /** false keeps the page usable: Tab can leave, and an outside press or focus move closes without returning focus. */
  modal?: boolean;
  trigger: ReactNode | ((open: boolean) => ReactNode);
  children: ReactNode | ((close: () => void) => ReactNode);
}
export function KjunPopover({
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
  returnFocus,
  header,
  modal = true,
  trigger,
  children,
}: KjunPopoverProps) {
  const m = useKjunMessages();
  const [internal, setInternal] = useState(false),
    open = controlled ?? internal,
    ref = useRef<HTMLDivElement>(null),
    id = "kjun-" + useId();
  const expanded = usePopupExpanded(open, ref);
  const focusOnMount = useRef(focusOnOpen);
  focusOnMount.current = focusOnOpen;
  // Focus the newly mounted dialog, without taking focus back during editing.
  const focusContent = useCallback((node: HTMLElement | null) => {
    if (node && focusOnMount.current) node.focus();
  }, []);
  const resolveReturn = resolveFocusReturn(returnFocus);
  const change = (v: boolean) => {
    setInternal(v);
    onOpenChange?.(v);
  };
  // A non-modal Popover closed by an outside press or focus move leaves focus where the user put it.
  const skipReturn = useRef(false);
  useEffect(() => {
    if (!open || modal) return;
    skipReturn.current = false;
    return installNonModalPopover({
      panel: () => document.getElementById(id)?.closest<HTMLElement>(".kjun-floating") ?? null,
      trigger: () => ref.current,
      close: () => { skipReturn.current = true; change(false); },
    });
  });
  const content = (
    <div className="kjun-popover-content" data-no-padding={noPadding}>
      {typeof children === "function" ? children(() => change(false)) : children}
    </div>
  );
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
        className={"kjun-content-popover" + (header != null ? " kjun-popover-has-header" : "")}
        placement={placement}
        matchTriggerWidth={matchTriggerWidth}
        maxHeight={maxHeight}
        flip={flip}
        returnFocus={() => (skipReturn.current ? false : resolveReturn?.())}
        nonModal={!modal}
        ownsDismiss={!modal}
      >
        {(() => {
          const dialogProps = {
            id,
            "aria-label": header != null && !ariaLabel ? undefined : ariaLabel || m.details,
            "aria-labelledby": header != null && !ariaLabel ? id + "-header" : undefined,
            className: "kjun-popover-dialog",
            style: { maxHeight: maxHeight ?? `min(60vh, ${tokens.extensions.floating.maxHeight}px)`, overflowY: header != null ? undefined : "auto" } as CSSProperties,
          };
          const body = (
            <>
              {header != null && <div id={id + "-header"} className="kjun-popover-header">{header}</div>}
              {header != null ? <div className="kjun-popover-body">{content}</div> : content}
              <FeedbackLayerOutlet />
            </>
          );
          // react-aria contains focus inside any popover holding its Dialog, so a non-modal one uses a plain dialog element.
          return modal
            ? <Dialog {...dialogProps} ref={focusContent}>{body}</Dialog>
            : <section {...dialogProps} role="dialog" tabIndex={-1} ref={focusContent}>{body}</section>;
        })()}
      </FloatingPanel>
    </>
  );
}
export interface KjunTooltipProps {
  content?: string;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  /** Controlled visibility; omit to let hover and focus drive it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}
export function KjunTooltip({
  content = "",
  placement = "top",
  delay = 0,
  open: controlled,
  onOpenChange,
  children,
}: KjunTooltipProps) {
  const container = useKjunPortalContainer();
  const [internal, setInternal] = useState(false),
    open = controlled ?? internal;
  const setOpen = (value: boolean) => { setInternal(value); onOpenChange?.(value); };
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
