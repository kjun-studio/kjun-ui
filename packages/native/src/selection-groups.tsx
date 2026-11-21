import { selectionTypeStyle } from "./typography";
import { tokens,type ButtonSize } from "@kjun-ui/tokens";
import { useLayoutEffect, useRef } from "react";
import {
Animated,
ScrollView,
View,
useWindowDimensions
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KjunTooltip } from "./popover";
import { ChoiceOption,ChoiceValue } from "./choice-controls";
import { KText, finePointer } from "./internal";
import { useKjunStyles } from "./provider";
import { ButtonGroupLabel, labelRoom, useButtonGroupMotion } from "./button-group-motion";
import { ScrollFadeEdge } from "./scroll-fade-edge";
import { useFilterRow } from "./use-filter-row";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { filterSelected, nextFilterValue } from "../../../shared/package-runtime/filter-value";
export interface KjunButtonGroupProps {
  value: ChoiceValue;
  options: ChoiceOption[];
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunButtonGroup({
  value,
  options,
  size = "md",
  disabled = false,
  fullWidth = false,
  ariaLabel,
  onValueChange,
  onChange,
}: KjunButtonGroupProps) {
  const { colors } = useKjunStyles();
  const selected = options.find(option => option.value === value);
  const motion = useButtonGroupMotion(selected);
  const padding = tokens.buttonGroup.padding[size];
  const itemRadius = tokens.buttonGroup.itemRadii[size];
  const itemRefs = useRef(new Map<ChoiceValue, View>());
  const { updateLayout } = motion;
  useLayoutEffect(() => {
    // Native Web observes the content box; changed insets need a fresh border-box measurement.
    for (const [value, node] of itemRefs.current) {
      node.measure((x, y, width, height) => updateLayout(value, { x, y, width, height }));
    }
  }, [size, fullWidth, updateLayout]);
  return (
    <ScrollView
      horizontal
      accessibilityLabel={ariaLabel}
      showsHorizontalScrollIndicator={false}
      style={{
        alignSelf: fullWidth ? "stretch" : "flex-start",
        flexGrow: 0,
        maxWidth: "100%",
      }}
      contentContainerStyle={{ flexGrow: fullWidth ? 1 : 0 }}
    >
      <View
        style={{
          flexDirection: "row",
          padding,
          borderRadius: tokens.buttonGroup.radii[size],
          backgroundColor: colors.secondary,
          flexGrow: fullWidth ? 1 : 0,
        }}
      >
        {motion.layout && <Animated.View testID="kjun-button-group-indicator" accessible={false}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{ pointerEvents: "none", position: 'absolute', left: 0, top: motion.layout.y, height: motion.layout.height,
            width: motion.width, transform: [{ translateX: motion.x }], borderRadius: itemRadius,
            // A surface fill on the secondary track with no edge, like Web: in-flow controls are fill-only.
            backgroundColor: colors.surface,
          }} />}
        {options.map((option) => {
          const active = value === option.value,
            blocked = disabled || option.disabled;
          // The painted segment keeps Web's height (the group height less its padding); hitSlop reaches the
          // 44pt touch target above and below it, like KjunButton.
          const itemHeight = tokens.buttonGroup.heights[size] - 2 * padding,
            hit = Math.max(0, (tokens.native.minimumTouchTarget - itemHeight) / 2);
          const iconOnly = !!(option.iconOnly && option.icon);
          const track = (node: View | null) => { if (node) itemRefs.current.set(option.value, node); else itemRefs.current.delete(option.value); };
          const segment = (
            <Pressable
              key={String(option.value)}
              hitSlop={{ top: hit, bottom: hit }}
              ref={iconOnly ? undefined : track}
              onLayout={iconOnly ? undefined : event => motion.measure(option.value, event)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active, disabled: !!blocked }}
              disabled={blocked}
              onPress={() => {
                onValueChange?.(option.value);
                onChange?.(option.value);
              }}
              // The tooltip wrapper stretches an icon-only segment across a full-width cell.
              {...(iconOnly ? { block: fullWidth } as object : {})}
              style={({ pressed }) => ({
                zIndex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: tokens.dimension.value6,
                flex: fullWidth && !iconOnly ? 1 : undefined,
                height: itemHeight,
                // An icon-only segment is square: as wide as the segment is tall.
                width: iconOnly && !fullWidth ? itemHeight : undefined,
                paddingHorizontal: iconOnly ? 0 : tokens.buttonGroup.itemPaddingX[size],
                borderRadius: itemRadius,
                backgroundColor: active && !motion.layout
                  ? colors.surface
                  : pressed && !active
                  ? colors.hover
                  : "transparent",
              })}
            >
              {!!option.icon && (
                <KjunIcon
                  name={option.icon}
                  size={tokens.button.iconSizes[size]}
                  color={blocked ? colors.textDisabled : active ? colors.text : colors.textSecondary}
                />
              )}
              {!iconOnly && <ButtonGroupLabel label={option.label} active={active} reduced={motion.reduced}
                size={size} disabled={!!blocked} />}
            </Pressable>
          );
          // The tooltip wraps its trigger in a View, so the outer cell carries the layout the indicator follows. Full width,
          // the cell starts from the labelled segments' padding, so icon-only and labelled segments share the track equally.
          return iconOnly ? (
            <View key={String(option.value)} ref={track} onLayout={event => motion.measure(option.value, event)}
              style={{ zIndex: 1, ...(fullWidth ? { flexGrow: 1, flexShrink: 1, flexBasis: 2 * tokens.buttonGroup.itemPaddingX[size] } : null) }}>
              <KjunTooltip content={blocked ? "" : option.label}>{segment}</KjunTooltip>
            </View>
          ) : segment;
        })}
      </View>
    </ScrollView>
  );
}
export interface KjunFilterGroupProps
  extends Omit<
    KjunButtonGroupProps,
    "value" | "onValueChange" | "onChange" | "fullWidth"
  > {
  value: ChoiceValue | ChoiceValue[];
  multiple?: boolean;
  scroll?: boolean;
  onValueChange?: (value: ChoiceValue | ChoiceValue[]) => void;
  onChange?: (value: ChoiceValue | ChoiceValue[]) => void;
}
export function KjunFilterGroup({
  value,
  options,
  size = "sm",
  disabled = false,
  multiple = false,
  scroll = false,
  ariaLabel,
  onValueChange,
  onChange,
}: KjunFilterGroupProps) {
  const { colors } = useKjunStyles();
  const m = useKjunMessages();
  // Like Web's selection media rule: a wide window with a fine pointer uses the plain button height;
  // narrow or touch layouts keep the 36px chip in a 44px touch row.
  const wide = useWindowDimensions().width >= tokens.responsive.selection,
    roomy = wide && finePointer();
  const row = useFilterRow(scroll, multiple, value);
  const chips = (
    <View
      role="group"
      accessibilityLabel={ariaLabel}
      style={{ flexDirection: "row", flexWrap: scroll ? "nowrap" : "wrap", gap: tokens.dimension.value8 }}
    >
      {options.map((option) => {
        const active = filterSelected(value, option.value, multiple),
          blocked = disabled || option.disabled,
          counted = option.count != null && option.count !== "",
          ink = blocked ? colors.textDisabled : active ? colors.filterSelectedText : colors.textSecondary;
        return (
          <Pressable
            key={String(option.value)}
            onLayout={event => row.measure(option.value, event)}
            accessibilityRole="button"
            accessibilityLabel={counted ? m.filterCount(option.label, String(option.count)) : option.label}
            accessibilityState={{ selected: active, disabled: !!blocked }}
            disabled={blocked}
            onPress={() => {
              const next = nextFilterValue(value, option.value, multiple);
              onValueChange?.(next);
              onChange?.(next);
            }}
            style={{
              minHeight: roomy ? undefined : tokens.native.minimumTouchTarget,
              justifyContent: "center",
            }}
          >
            {({ pressed }) => <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: tokens.dimension.value4,
                minHeight: roomy ? undefined : tokens.extensions.selection.minimumHeight,
                height: roomy ? tokens.button.heights[size] : Math.max(tokens.extensions.selection.minimumHeight, tokens.button.heights[size]),
                paddingHorizontal: tokens.extensions.selection.paddingX[size],
                // Corners follow the button scale with the height, so every size keeps the same shape.
                borderRadius: tokens.button.radii[size],
                // An unselected chip darkens to the hover surface while pressed, as Web does under the pointer.
                backgroundColor: active ? colors.filterSelectedBg : pressed && !blocked ? colors.hover : colors.secondary,
              }}
            >
              {option.dot && (
                <View
                  style={{
                    width: tokens.extensions.selection.dotSize,
                    height: tokens.extensions.selection.dotSize,
                    borderRadius: tokens.extensions.selection.dotSize / 2,
                    backgroundColor: option.dot,
                  }}
                />
              )}
              {!!option.icon && <KjunIcon name={option.icon} size={tokens.extensions.selection.iconSize} color={ink} />}
              <View style={{ alignItems: 'center' }}>
              <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                style={{ ...selectionTypeStyle(size, true), opacity: 0 }}>{option.label}</KText>
              {/* Like ButtonGroup: reserve the wider of both weights, and keep the shown label on one line. */}
              <View style={{ height: 0, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <KText accessible={false} style={{ ...selectionTypeStyle(size, false), opacity: 0 }}>{option.label}</KText>
              </View>
              <View style={labelRoom}>
                <KText
                  numberOfLines={1}
                  style={{
                    textAlign: 'center',
                    ...selectionTypeStyle(size, active),
                    // One disabled rule, like Button and fields: the chip keeps its fill and its ink takes the disabled-text role.
                    color: ink,
                  }}
                >
                  {option.label}
                </KText>
              </View>
              </View>
              {counted && (
                // Outside the label's reserved width, so a changing count never shifts the weight swap; Web's count style.
                <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                  style={{ ...selectionTypeStyle(size, false), marginLeft: tokens.dimension.value2, color: blocked ? colors.textDisabled : active ? colors.filterSelectedText : colors.textTertiary, fontVariant: ["tabular-nums"] }}>
                  {option.count}
                </KText>
              )}
            </View>}
          </Pressable>
        );
      })}
    </View>
  );
  if (!scroll) return chips;
  return (
    <View style={{ flexGrow: 0 }}>
      <ScrollView
        ref={row.scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
        onLayout={event => row.update({ clientWidth: event.nativeEvent.layout.width })}
        onContentSizeChange={scrollWidth => row.update({ scrollWidth })}
        onScroll={event => row.update({ scrollLeft: event.nativeEvent.contentOffset.x }, true)}
      >
        {chips}
      </ScrollView>
      {/* More chips past an edge fade it into the surface, as KjunScrollFade and Tabs do. */}
      {row.edges.start ? <ScrollFadeEdge edge="start" horizontal color={colors.surface} /> : null}
      {row.edges.end ? <ScrollFadeEdge edge="end" horizontal color={colors.surface} /> : null}
    </View>
  );
}
