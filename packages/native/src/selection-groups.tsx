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
import { ChoiceOption,ChoiceValue } from "./choice-controls";
import { KText, finePointer } from "./internal";
import { useKjunStyles } from "./provider";
import { ButtonGroupLabel, useButtonGroupMotion } from "./button-group-motion";
export interface KjunButtonGroupProps {
  value: ChoiceValue;
  options: ChoiceOption[];
  size?: ButtonSize;
  variant?: "primary" | "secondary" | "ghost";
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
        {motion.layout && <Animated.View testID="kjun-button-group-indicator" pointerEvents="none" accessible={false}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', left: 0, top: motion.layout.y, height: motion.layout.height,
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
          return (
            <Pressable
              key={String(option.value)}
              hitSlop={{ top: hit, bottom: hit }}
              ref={node => { if (node) itemRefs.current.set(option.value, node); else itemRefs.current.delete(option.value); }}
              onLayout={event => motion.measure(option.value, event)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active, disabled: !!blocked }}
              disabled={blocked}
              onPress={() => {
                onValueChange?.(option.value);
                onChange?.(option.value);
              }}
              style={({ pressed }) => ({
                zIndex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: tokens.dimension.value6,
                flex: fullWidth ? 1 : undefined,
                height: itemHeight,
                paddingHorizontal: tokens.buttonGroup.itemPaddingX[size],
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
                  size={tokens.extensions.selection.iconSize}
                  color={blocked ? colors.textDisabled : active ? colors.text : colors.textSecondary}
                />
              )}
              <ButtonGroupLabel label={option.label} active={active} reduced={motion.reduced}
                size={size} disabled={!!blocked} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
export interface KjunFilterGroupProps
  extends Omit<
    KjunButtonGroupProps,
    "value" | "onValueChange" | "onChange" | "fullWidth" | "variant"
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
  // Like Web's selection media rule: a wide window with a fine pointer uses the plain button height;
  // narrow or touch layouts keep the 36px chip in a 44px touch row.
  const wide = useWindowDimensions().width >= tokens.responsive.selection,
    roomy = wide && finePointer();
  const selected = (v: ChoiceValue) =>
    multiple
      ? Array.isArray(value) &&
        (v === null ? value.length === 0 : value.includes(v))
      : value === v;
  const children = (
    <View
      accessibilityLabel={ariaLabel}
      style={{
        flexDirection: "row",
        flexWrap: scroll ? "nowrap" : "wrap",
        gap: tokens.dimension.value8,
      }}
    >
      {options.map((option) => {
        const active = selected(option.value),
          blocked = disabled || option.disabled;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active, disabled: !!blocked }}
            disabled={blocked}
            onPress={() => {
              const next = multiple
                ? option.value === null
                  ? []
                  : Array.isArray(value) && value.includes(option.value)
                  ? value.filter((v) => v !== option.value)
                  : [...(Array.isArray(value) ? value : []), option.value]
                : option.value;
              onValueChange?.(next);
              onChange?.(next);
            }}
            style={{
              minHeight: roomy ? undefined : tokens.native.minimumTouchTarget,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: tokens.dimension.value4,
                minHeight: roomy ? undefined : tokens.extensions.selection.minimumHeight,
                height: roomy ? tokens.button.heights[size] : Math.max(tokens.extensions.selection.minimumHeight, tokens.button.heights[size]),
                paddingHorizontal: { xs: tokens.dimension.value8, sm: tokens.dimension.value12, md: tokens.dimension.value12, lg: tokens.dimension.value14, xl: tokens.dimension.value16 }[
                  size
                ],
                // Corners follow the button scale with the height, so every size keeps the same shape.
                borderRadius: tokens.button.radii[size],
                backgroundColor: active ? colors.filterSelectedBg : colors.secondary,
              }}
            >
              {option.dot && (
                <View
                  style={{
                    width: tokens.extensions.selection.dotSize,
                    height: tokens.extensions.selection.dotSize,
                    borderRadius: tokens.radius.radius4,
                    backgroundColor: option.dot,
                  }}
                />
              )}
              {!!option.icon && (
                <KjunIcon
                  name={option.icon}
                  size={tokens.extensions.selection.iconSize}
                  color={blocked ? colors.textDisabled : active ? colors.filterSelectedText : colors.textSecondary}
                />
              )}
              <View style={{ alignItems: 'center' }}>
              <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                style={{ ...selectionTypeStyle(size, true), opacity: 0 }}>{option.label}</KText>
              {/* Like ButtonGroup: reserve the wider of both weights, and keep the shown label on one line. */}
              <View style={{ height: 0, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <KText accessible={false} style={{ ...selectionTypeStyle(size, false), opacity: 0 }}>{option.label}</KText>
              </View>
              <KText
                numberOfLines={1}
                style={{
                  position: 'absolute', top: 0,
                  ...selectionTypeStyle(size, active),

                  // One disabled rule, like Button and fields: the chip keeps its fill and its ink takes the disabled-text role.
                  color: blocked ? colors.textDisabled : active ? colors.filterSelectedText : colors.textSecondary,
                }}
              >
                {option.label}
              </KText>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
  return scroll ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );
}
