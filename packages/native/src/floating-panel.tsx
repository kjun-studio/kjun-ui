import { LayerBackdrop } from "./layer-backdrop";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { Animated } from "react-native";
import { useNativePresence } from "./motion";
import { tokens } from "@kjun/tokens";
import {
cloneElement,
isValidElement,
useEffect,
useLayoutEffect,
useRef,
useState,
type ReactElement,
type ReactNode,
type RefObject
} from "react";
import {
AccessibilityInfo,
findNodeHandle,
KeyboardAvoidingView,
Platform,
ScrollView,
useWindowDimensions,
View,
type ViewStyle
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { content } from "./internal";
import { ScopedNativeModal } from "./overlay-host";
import Svg, { Path } from "react-native-svg";
import { useKjunStyles } from "./provider";

export function LayerTrigger({
  trigger,
  onPress,
  disabled = false,
}: {
  trigger: ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  if (isValidElement(trigger)) {
    const child = trigger as ReactElement<{
      onPress?: () => void;
      disabled?: boolean;
    }>;
    return cloneElement(child, {
      disabled: disabled || child.props.disabled,
      onPress: () => {
        if (!disabled && !child.props.disabled) {
          child.props.onPress?.();
          onPress();
        }
      },
    });
  }
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
      {content(trigger)}
    </Pressable>
  );
}
export type Placement =
  | "top"
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
  matchTriggerWidth = false,
  maxHeight,
  ariaLabel = "선택",
  menu = false,
  field = false,
  tooltip = false,
  popover = false,
  flip = true,
  minimumWidth = 0,
  focusOnOpen = false,
  reveal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  triggerRef: RefObject<View | null>;
  children: ReactNode;
  placement?: Placement;
  matchTriggerWidth?: boolean;
  maxHeight?: number;
  ariaLabel?: string;
  menu?: boolean;
  /** Internal presentation for selection fields, independent of general menus. */
  field?: boolean;
  tooltip?: boolean;
  popover?: boolean;
  flip?: boolean;
  minimumWidth?: number;
  focusOnOpen?: boolean;
  /** Layout of a row to bring into view when the panel opens (the selected option). */
  reveal?: RefObject<{ y: number; height: number } | null>;
}) {
  const panelRef = useRef<View>(null);
  const scroll = useRef<ScrollView>(null), viewport = useRef(0);
  const { colors } = useKjunStyles(),
    window = useWindowDimensions(),
    [anchored, setAnchored] = useState(false),
    [sized, setSized] = useState(false),
    [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 }),
    [panel, setPanel] = useState({ width: 0, height: 0 });
  const measurement = useRef(0);
  const motion = useNativePresence(open, tooltip ? tokens.motion.tooltipEnter : tokens.motion.popupEnter, tooltip ? tokens.motion.tooltipExit : tokens.motion.popupExit, anchored && sized);
  const layer = useLayer(open, motion.present, tooltip ? "tooltip" : "popup", () => onOpenChange(false), triggerRef);
  useLayoutEffect(() => {
    const revision = ++measurement.current;
    if (open) setAnchored(false);
    if (open) triggerRef.current?.measureInWindow((x, y, width, height) => {
      if (revision !== measurement.current || !width || !height) return;
      setAnchor({ x, y, width, height }); setAnchored(true);
    });
    return () => { measurement.current++; };
  }, [open, window.width, window.height, triggerRef]);
  useLayoutEffect(() => { if (!motion.present) { setSized(false); setAnchored(false); } }, [motion.present]);
  useEffect(() => {
    // Like Web listboxes, an opened list starts with the selected row in view.
    const row = reveal?.current;
    if (!open || !anchored || !sized || !row || !viewport.current) return;
    const offset = row.y + row.height + (menu || field ? tokens.extensions.menu.padding : 0) - viewport.current;
    if (offset > 0) scroll.current?.scrollTo({ y: offset, animated: false });
  }, [open, anchored, sized, reveal, menu, field]);
  useEffect(() => {
    if (!open || !anchored || !sized || !focusOnOpen || !panelRef.current) return;
    if (Platform.OS === 'web') {
      const node = panelRef.current as unknown as HTMLElement;
      (node.querySelector<HTMLElement>('input,button,[tabindex="0"]') || node).focus();
    } else {
      const tag = findNodeHandle(panelRef.current);
      if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
    }
  }, [open, anchored, sized, focusOnOpen]);
  const gap = field ? tokens.extensions.floating.fieldGap : tokens.extensions.floating.anchorGap;
  const contentSizedMenu = menu && !matchTriggerWidth;
  // Tooltips hug their text up to the maximum width, like Web.
  const tooltipWidth = Math.min(Math.max(0, window.width - 2 * tokens.extensions.floating.viewportInset), tokens.extensions.tooltip.maxWidth);
  const maximumWidth = Math.max(0, window.width - 2 * tokens.extensions.floating.viewportInset);
  const minimumPanelWidth = Math.min(maximumWidth,
    Math.max(minimumWidth, menu || field ? tokens.extensions.menu.minimumWidth : 0));
  const width = tooltip
    ? Math.min(tooltipWidth, panel.width || tooltipWidth)
    : Math.min(
      maximumWidth,
      Math.max(minimumPanelWidth, contentSizedMenu ? panel.width : matchTriggerWidth ? anchor.width : tokens.extensions.popover.width)
    );
  const available = Math.min(maxHeight ?? (field ? tokens.extensions.menu.listMaxHeight : tokens.extensions.floating.maxHeight), window.height - 2 * tokens.extensions.floating.viewportInset),
    height = Math.min(panel.height, available),
    roomAbove = anchor.y - gap - tokens.extensions.floating.viewportInset,
    roomBelow = window.height - anchor.y - anchor.height - gap - tokens.extensions.floating.viewportInset,
    // Either side flips when the panel does not fit and the other side has more room, like Web.
    above = placement.startsWith("top")
      ? !(flip && height > roomAbove && roomBelow > roomAbove)
      : flip && height > roomBelow && roomAbove > roomBelow;
  // Like Web (react-aria, Vue), a bare top/bottom centers on the trigger; -start/-end align an edge.
  let left = placement.endsWith("end")
      ? anchor.x + anchor.width - width
      : placement === "top" || placement === "bottom"
        ? anchor.x + (anchor.width - width) / 2
        : anchor.x,
    top = above ? anchor.y - height - gap : anchor.y + anchor.height + gap;
  if (placement === "left" || placement === "right") {
    left =
      placement === "left" ? anchor.x - width - gap : anchor.x + anchor.width + gap;
    top = anchor.y + (anchor.height - height) / 2;
  }
  left = Math.max(tokens.extensions.floating.viewportInset, Math.min(window.width - width - tokens.extensions.floating.viewportInset, left));
  top = Math.max(tokens.extensions.floating.viewportInset, Math.min(window.height - height - tokens.extensions.floating.viewportInset, top));
  if (layer.blocked) return null;
  // A web tooltip must not capture focus or intercept its trigger's pointer.
  if (tooltip && Platform.OS === "web") {
    if (!motion.present) return null;
    // Like Web, an arrow on the trigger side points at the trigger's center, kept clear of the corners.
    const arrow = tokens.extensions.tooltip.arrowSize, corner = tokens.radius.radius6,
      side = placement === "left" ? "right" : placement === "right" ? "left" : above ? "bottom" : "top",
      along = side === "top" || side === "bottom"
        ? Math.max(corner, Math.min(width - corner - arrow, anchor.x + anchor.width / 2 - left - arrow / 2))
        : Math.max(corner, Math.min(height - corner - arrow, anchor.y + anchor.height / 2 - top - arrow / 2));
    return (
      <Animated.View
        {...{ role: "tooltip" as const }}
        accessibilityLabel={ariaLabel}
        pointerEvents="none"
        onLayout={(event) => { setPanel(event.nativeEvent.layout); setSized(true); }}
        style={
          {
            opacity: anchored && sized ? motion.opacity : 0,
            position: "fixed",
            top,
            left,
            maxWidth: tooltipWidth,
            zIndex: layer.zIndex,
          } as unknown as ViewStyle
        }
      >
        <View
          style={{
            borderRadius: corner,
            overflow: "hidden",
            backgroundColor: colors.chartTooltipBg,
            boxShadow: shadowLayers(tokens.extensions.tooltip.elevation, colors),
          } as unknown as ViewStyle}
        >
          {children}
        </View>
        <Svg
          width={arrow}
          height={arrow}
          viewBox="0 0 8 8"
          style={{
            position: "absolute",
            ...(side === "bottom" ? { top: "100%", left: along }
              : side === "top" ? { bottom: "100%", left: along, transform: [{ rotate: "180deg" }] }
              : side === "right" ? { left: "100%", top: along, transform: [{ rotate: "-90deg" }] }
              : { right: "100%", top: along, transform: [{ rotate: "90deg" }] }),
          }}
        >
          <Path d="M0 0L4 4L8 0" fill={colors.chartTooltipBg} />
        </Svg>
      </Animated.View>
    );
  }
  return (
    <LayerScope.Provider value={layer.id}>
    <ScopedNativeModal
      visible={motion.present}
      transparent
      animationType="none"
      onRequestClose={() => { if (open) onOpenChange(false); }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <LayerBackdrop
          style={{ position: "absolute", inset: 0 }}
          onPress={() => { if (open) onOpenChange(false); }}
        />
        <Animated.View
          ref={panelRef}
          onLayout={contentSizedMenu || tooltip ? ({ nativeEvent: { layout } }) => {
            setSized(true);
            setPanel(previous => previous.width === layout.width && previous.height === layout.height
              ? previous : { width: layout.width, height: layout.height });
          } : undefined}
          pointerEvents={open && anchored && sized ? "auto" : "none"}
          accessibilityElementsHidden={!open || !anchored || !sized}
          {...(!open || !anchored || !sized ? { inert: true } : {})}
          accessibilityViewIsModal
          accessibilityLabel={ariaLabel}
          style={{
            opacity: anchored && sized ? motion.opacity : 0,
            transform: tooltip ? undefined : [{ translateX: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [placement === "left" ? tokens.motionDistance.popup : placement === "right" ? -tokens.motionDistance.popup : 0, 0] }) },
              { translateY: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [placement === "left" || placement === "right" ? 0 : above ? tokens.motionDistance.popup : -tokens.motionDistance.popup, 0] }) }],
            position: "absolute",
            top,
            left,
            width: contentSizedMenu || tooltip ? undefined : width,
            minWidth: contentSizedMenu ? minimumPanelWidth : undefined,
            maxWidth: tooltip ? tooltipWidth : maximumWidth,
            maxHeight: available,
            borderRadius: popover ? tokens.extensions.popover.radius : field ? tokens.radius.radius12 : tokens.extensions.menu.radius,
            borderWidth: popover ? 0 : tokens.border.defaultWidth,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            boxShadow: (tooltip ? tokens.extensions.tooltip.elevation : popover ? tokens.extensions.popover.elevation : tokens.extensions.menu.elevation).map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
            overflow: "hidden",
          }}
        >
          <ScrollView
            ref={scroll}
            onLayout={(event) => { viewport.current = event.nativeEvent.layout.height; }}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: available }}
            contentContainerStyle={{ padding: menu || field ? tokens.extensions.menu.padding : 0 }}
            onContentSizeChange={(width, height) => {
              if (contentSizedMenu) return;
              setSized(true);
              setPanel((previous) =>
                previous.width === width && previous.height === height
                  ? previous
                  : { width, height }
              );
            }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScopedNativeModal>
    </LayerScope.Provider>
  );
}
