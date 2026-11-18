import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useActiveLayerScope } from "../../../shared/package-runtime/use-layer";
import { typeStyle } from "./typography";
import {
cloneElement,
isValidElement,
useEffect,
useRef,
useState,
type ReactElement,
type ReactNode
} from "react";
import {
Platform,
View,
type TextStyle,
type PressableProps
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { FloatingPanel,LayerTrigger } from "./floating-panel";
import { KText,content } from "./internal";
import { tokens } from "@kjun-ui/tokens";
import { useKjunStyles } from "./provider";
import { ActionSizeContext, popoverActionSize } from "../../../shared/package-runtime/action-size";
import { installFocusVisible, isFocusVisible } from "../../../shared/package-runtime/focus-visible";
import { isTooltipWarm, tooltipClosed, tooltipOpened } from "../../../shared/package-runtime/tooltip-warmup";
export interface KjunPopoverProps {
  noPadding?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  manualTrigger?: boolean;
  matchTriggerWidth?: boolean;
  maxHeight?: number;
  flip?: boolean;
  focusOnOpen?: boolean;
  ariaLabel?: string;
  /** A side, or a side with an aligned edge: "bottom-start" lines the panel up with the trigger's start edge. */
  placement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end";
  /** Fixed header above the body; only the body scrolls and maxHeight covers both. A function receives close. */
  header?: ReactNode | ((close: () => void) => ReactNode);
  /** Fixed footer below the body (actions such as FormActions); only the body scrolls and fades above it. A function receives close. */
  footer?: ReactNode | ((close: () => void) => ReactNode);
  /** Width step (popover.widths): sm 192, md 240 (default), lg 320. matchTriggerWidth takes the trigger's width instead. */
  width?: "sm" | "md" | "lg";
  /** false stops confining screen readers to the panel; Native has no Tab order to release. */
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
  header,
  footer,
  width = "md",
  modal = true,
  trigger,
  children,
}: KjunPopoverProps) {
  const { colors } = useKjunStyles(), m = useKjunMessages();
  const [internal, setInternal] = useState(false),
    open = controlled ?? internal,
    ref = useRef<View>(null);
  const change = (v: boolean) => {
    setInternal(v);
    onOpenChange?.(v);
  };
  return (
    <>
      <View ref={ref} collapsable={false}>
        <LayerTrigger
          trigger={typeof trigger === "function" ? trigger(open) : trigger}
          expanded={open}
          popup="dialog"
          onPress={() => {
            if (!manualTrigger) change(!open);
          }}
        />
      </View>
      <FloatingPanel
        open={open}
        onOpenChange={change}
        triggerRef={ref}
        placement={placement}
        matchTriggerWidth={matchTriggerWidth}
        maxHeight={maxHeight}
        flip={flip}
        popover
        focusOnOpen={focusOnOpen}
        // Named like the web dialog: the label, else a text header, else "details" (never the select default).
        ariaLabel={ariaLabel ?? (typeof header === "string" ? header : m.details)}
        header={header != null ? content(typeof header === "function" ? header(() => change(false)) : header, { ...typeStyle("control"), color: colors.text }) : undefined}
        footer={footer != null ? <ActionSizeContext.Provider value={popoverActionSize}>{typeof footer === "function" ? footer(() => change(false)) : footer}</ActionSizeContext.Provider> : undefined}
        popoverWidth={tokens.extensions.popover.widths[width]}
        nonModal={!modal}
      >
        {/* Under a header the body starts right after the header's short gap, like Web. */}
        <View style={{ padding: noPadding ? 0 : tokens.extensions.popover.padding, ...(header != null && !noPadding ? { paddingTop: 0 } : {}), ...(footer != null && !noPadding ? { paddingBottom: 0 } : {}), gap: noPadding ? 0 : tokens.extensions.popover.gap }}>
          <ActionSizeContext.Provider value={popoverActionSize}>
            {content(typeof children === "function" ? children(() => change(false)) : children,
              Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } as TextStyle : undefined)}
          </ActionSizeContext.Provider>
        </View>
      </FloatingPanel>
    </>
  );
}
export interface KjunTooltipProps
  extends Pick<PressableProps, "onPress" | "disabled"> {
  content?: string;
  /** A bolder line above content (a file name above its path). Read together with content. */
  title?: string;
  align?: "start" | "center";
  /** Maximum width step (tooltip.maxWidths); default is md, the earlier width. */
  width?: "sm" | "md" | "lg";
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  /** Controlled visibility; omit to let hover and focus drive it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}
// Like the web tooltip: Korean breaks between words, long paths anywhere.
const tooltipWrap = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as TextStyle;
export function KjunTooltip({
  content: body = "",
  title,
  align,
  width,
  placement = "top",
  delay = 0,
  children,
  onPress,
  disabled,
  open: controlled,
  onOpenChange,
}: KjunTooltipProps) {
  // Screen readers hear the title and body together, as on Web.
  const message = [title, body].filter(Boolean).join(", ");
  const { colors } = useKjunStyles(),
    [internal, setInternal] = useState(false),
    open = controlled ?? internal,
    // Timers read the latest state and handler; hide() while closed reports nothing.
    latest = useRef({ open, onOpenChange }),
    setOpen = (value: boolean) => {
      if (latest.current.open === value) return;
      latest.current.open = value;
      setInternal(value); latest.current.onOpenChange?.(value);
    },
    ref = useRef<View>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  latest.current = { open, onOpenChange };
  const scopeActive = useActiveLayerScope();
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  const show = (immediate = false) => {
    if (!scopeActive) return;
    clearTimeout(timer.current);
    // Like react-aria, a delay waits only until one tooltip has opened (the warm-up).
    if (immediate || delay <= 0 || isTooltipWarm()) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  };
  const shown = open && !!message;
  useEffect(() => {
    if (!shown) return;
    tooltipOpened();
    return tooltipClosed;
  }, [shown]);
  // Web shows the hint on keyboard focus only; a pointer press focuses too and must not flash it.
  useEffect(() => Platform.OS === "web" ? installFocusVisible(document) : undefined, []);
  useEffect(() => { if (!scopeActive) hide(); }, [scopeActive]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (Platform.OS !== "web" || !open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const child = isValidElement(children)
    ? (children as ReactElement<PressableProps>)
    : null;
  const childProps = child?.props as (PressableProps & { ariaLabel?: string }) | undefined;
  const handlers: PressableProps = {
    // A hint that repeats the trigger's name would be read twice (icon-only RefreshButton, IconToggle).
    accessibilityHint: message && ![childProps?.accessibilityLabel, childProps?.ariaLabel].includes(message)
      ? message : childProps?.accessibilityHint,
    disabled: disabled || child?.props.disabled,
    onPress: (event) => {
      hide();
      child?.props.onPress?.(event);
      onPress?.(event);
    },
    onLongPress: (event) => {
      child?.props.onLongPress?.(event);
      // The long press already waited; it opens at once.
      show(true);
    },
    delayLongPress: 500,
    onHoverIn: (event) => {
      child?.props.onHoverIn?.(event);
      show();
    },
    onHoverOut: (event) => {
      child?.props.onHoverOut?.(event);
      hide();
    },
    onFocus: (event) => {
      child?.props.onFocus?.(event);
      if (Platform.OS !== "web" || isFocusVisible()) show(true);
    },
    onBlur: (event) => {
      child?.props.onBlur?.(event);
      hide();
    },
    onPressOut: (event) => {
      child?.props.onPressOut?.(event);
      hide();
    },
  };
  return (
    <>
      {/* Content width like Web's inline-block wrapper, so the tooltip anchors to the trigger, not the row.
          A block trigger (RefreshButton block) fills the row, so the wrapper stretches with it. */}
      <View ref={ref} collapsable={false} style={{ alignSelf: (childProps as { block?: boolean } | undefined)?.block ? "stretch" : "flex-start" }}>
        {child ? (
          cloneElement(child, handlers)
        ) : (
          <Pressable {...handlers}>{children}</Pressable>
        )}
      </View>
      <FloatingPanel
        tooltip
        open={open && !!message}
        onOpenChange={setOpen}
        triggerRef={ref}
        placement={placement}
        ariaLabel={message}
        tooltipMaxWidth={width ? tokens.extensions.tooltip.maxWidths[width] : tokens.extensions.tooltip.maxWidth}
      >
        <View
          style={{
            paddingVertical: tokens.extensions.tooltip.paddingY,
            paddingHorizontal: tokens.extensions.tooltip.paddingX,
            maxWidth: width ? tokens.extensions.tooltip.maxWidths[width] : tokens.extensions.tooltip.maxWidth,
            backgroundColor: colors.chartTooltipBg,
          }}
        >
          {!!title && <KText style={{ ...typeStyle('controlSmall'), ...tooltipWrap, color: colors.chartTooltipText, ...(align ? { textAlign: align === "center" ? "center" : "left" } : {}) }}>{title}</KText>}
          {!!body && <KText
            style={{
              ...typeStyle('caption'),
              ...tooltipWrap,
              color: colors.chartTooltipText,
              ...(align ? { textAlign: align === "center" ? "center" : "left" } : {}),
            }}
          >
            {body}
          </KText>}
        </View>
      </FloatingPanel>
    </>
  );
}
