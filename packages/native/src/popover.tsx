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
export interface DsPopoverProps {
  noPadding?: boolean;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  manualTrigger?: boolean;
  matchTriggerWidth?: boolean;
  maxHeight?: number;
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
        ariaLabel={ariaLabel}
      >
        <View style={{ padding: noPadding ? 0 : tokens.extensions.popover.padding, gap: noPadding ? 0 : tokens.extensions.popover.gap }}>
          {content(typeof children === "function" ? children(() => change(false)) : children,
            Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } as TextStyle : undefined)}
        </View>
      </FloatingPanel>
    </>
  );
}
export interface DsTooltipProps
  extends Pick<PressableProps, "onPress" | "disabled"> {
  content?: string;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  children: ReactNode;
}
export function DsTooltip({
  content: message = "",
  placement = "top",
  delay = 0,
  children,
  onPress,
  disabled,
}: DsTooltipProps) {
  const { colors } = useKjunStyles(),
    [open, setOpen] = useState(false),
    ref = useRef<View>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scopeActive = useActiveLayerScope();
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  const show = () => {
    if (!scopeActive) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
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
      show();
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
      show();
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
      {/* Content width like Web's inline-block wrapper, so the tooltip anchors to the trigger, not the row. */}
      <View ref={ref} collapsable={false} style={{ alignSelf: "flex-start" }}>
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
      >
        <View
          style={{
            paddingVertical: tokens.extensions.tooltip.paddingY,
            paddingHorizontal: tokens.extensions.tooltip.paddingX,
            maxWidth: tokens.extensions.tooltip.maxWidth,
            backgroundColor: colors.chartTooltipBg,
          }}
        >
          <KText
            style={{
              ...typeStyle('caption'),

              color: colors.chartTooltipText,
            }}
          >
            {message}
          </KText>
        </View>
      </FloatingPanel>
    </>
  );
}
