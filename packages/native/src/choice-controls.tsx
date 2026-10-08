import { typeStyle } from "./typography";
import { Animated } from "react-native";
import { useMotionValue } from "./motion";
import { tokens, type InputSize } from "@kjun/tokens";
import {
createContext,
useContext,
useState,
useEffect,
useRef,
type ReactNode
} from "react";
import {
View,
type ColorValue,
type ViewStyle
} from "react-native";
import { AccessiblePressable as Pressable, focusVisible } from "./a11y";
import { DsIcon } from "./button";
import { content, finePointer } from "./internal";
import { useKjunStyles } from "./provider";
import { useRadioKeyboard } from "./choice-accessibility";

export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  dot?: ColorValue;
}
export interface DsCheckboxProps<T = ChoiceValue> {
  value: boolean | T[];
  val?: T;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  children?: ReactNode;
  onValueChange?: (value: boolean | T[]) => void;
  onChange?: (value: boolean | T[]) => void;
}
export function DsCheckbox<T = ChoiceValue>({
  value,
  val,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  children,
  onValueChange,
  onChange,
}: DsCheckboxProps<T>) {
  const { colors } = useKjunStyles(),
    checked = Array.isArray(value) ? value.includes(val!) : value,
    dimension = tokens.extensions.checkbox.sizes[size];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={ariaLabel || label}
      disabled={disabled}
      onPress={() => {
        const result = Array.isArray(value)
          ? checked
            ? value.filter((v) => v !== val)
            : [...value, val!]
          : !checked;
        onValueChange?.(result);
        onChange?.(result);
      }}
      style={({ pressed }) => ({
        // Content width like Web; a column parent would otherwise stretch the hit area and focus ring.
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        // Like Web's choice row on a mouse-like pointer; touch layouts keep the 44px target.
        minHeight: finePointer() ? tokens.extensions.choice.minimumHeight : tokens.native.minimumTouchTarget,
        opacity: disabled ? tokens.states.opacity.disabled : pressed ? tokens.states.opacity.pressed : 1,
      })}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: dimension,
          height: dimension,
          borderRadius: tokens.extensions.checkbox.radii[size],
          borderWidth: tokens.border.controlWidth,
          // Same boundary roles as Radio: strong while enabled, secondary once disabled.
          borderColor: checked ? colors.brand : disabled ? colors.borderSecondary : colors.borderStrong,
          backgroundColor: checked ? colors.brand : colors.surface,
        }}
      >
        {checked && (
          <DsIcon
            name="check"
            size={tokens.extensions.checkbox.iconSizes[size]}
            color={colors.onBrand}
          />
        )}
      </View>
      {(children || label) &&
        content(children || label, {
          marginLeft: tokens.extensions.checkbox.labelGap,
          ...typeStyle('label'),

        })}
    </Pressable>
  );
}
// Web draws the choice focus ring on the control, not the whole label row; Native Web follows.
function useControlFocus(disabled: boolean) {
  const { colors } = useKjunStyles();
  const [focused, setFocused] = useState(false);
  return {
    handlers: {
      focusRing: false,
      onFocus: (event: { currentTarget: unknown }) =>
        setFocused(focusVisible(event.currentTarget)),
      onBlur: () => setFocused(false),
    },
    ring: (focused && !disabled
      ? { outlineStyle: "solid", outlineWidth: tokens.states.focus.width, outlineOffset: tokens.states.focus.choiceOffset, outlineColor: colors.focusRing }
      : {}) as ViewStyle,
  };
}
export interface DsSwitchProps {
  value: boolean;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  children?: ReactNode;
  onValueChange?: (value: boolean) => void;
  onChange?: (value: boolean) => void;
}
export function DsSwitch({
  value,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  children,
  onValueChange,
  onChange,
}: DsSwitchProps) {
  const { colors } = useKjunStyles();
  const width = tokens.extensions.switch.widths[size];
  const height = tokens.extensions.switch.heights[size];
  const thumb = height - 2 * tokens.extensions.switch.padding;
  // The off boundary sits inside the padding, so the off thumb also clears the border width (like Web).
  const offScale = (thumb - 2 * tokens.border.controlWidth) / thumb;
  const offset = width - height;
  const motion = useMotionValue(value ? 1 : 0);
  const focus = useControlFocus(disabled);
  const [hovered, setHovered] = useState(false);
  const trackColor = typeof colors.active === 'string' && typeof colors.brand === 'string'
    ? motion.interpolate({ inputRange: [0, 1], outputRange: [colors.active, colors.brand] })
    : value ? colors.brand : colors.active;
  // Off state: strong border boundary and thumb, like Checkbox/Radio and the Web track.
  const offRole = disabled ? colors.borderSecondary : colors.borderStrong;
  const thumbColor = typeof offRole === 'string' && typeof colors.onBrand === 'string'
    ? motion.interpolate({ inputRange: [0, 1], outputRange: [offRole, colors.onBrand] })
    : value ? colors.onBrand : offRole;
  return (
    <Pressable
      accessibilityRole="switch"
      {...focus.handlers}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={ariaLabel || label}
      disabled={disabled}
      onPress={() => {
        onValueChange?.(!value);
        onChange?.(!value);
      }}
      style={{
        // Content width like Web; a column parent would otherwise stretch the hit area and focus ring.
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        // Like Web's choice row on a mouse-like pointer; touch layouts keep the 44px target.
        minHeight: finePointer() ? tokens.extensions.choice.minimumHeight : tokens.native.minimumTouchTarget,
        opacity: disabled ? tokens.states.opacity.disabled : 1,
      }}
    >
      <Animated.View
        style={{
          width,
          height,
          padding: tokens.extensions.switch.padding,
          borderRadius: tokens.extensions.switch.radius,
          backgroundColor: trackColor,
          ...focus.ring,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: tokens.extensions.switch.radius,
            borderWidth: tokens.border.controlWidth,
            // Hover turns the boundary to brand, like Checkbox on Web.
            borderColor: hovered && !disabled ? colors.brand : offRole,
            opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }}
        />
        <Animated.View
          style={{
            width: thumb,
            height: thumb,
            borderRadius: tokens.extensions.switch.radius,
            backgroundColor: thumbColor,
            transform: [
              { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, offset] }) },
              { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [offScale, 1] }) },
            ],
          }}
        />
      </Animated.View>
      {(children || label) &&
        content(children || label, {
          marginLeft: tokens.extensions.switch.labelGap,
          ...typeStyle('label'),

        })}
    </Pressable>
  );
}
export const RadioContext = createContext<{
  value: ChoiceValue;
  change: (v: ChoiceValue) => void;
} | null>(null);
export interface DsRadioProps {
  value?: ChoiceValue;
  val: ChoiceValue;
  label?: string;
  disabled?: boolean;
  name?: string;
  ariaLabel?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function DsRadio({
  value,
  val,
  label,
  disabled = false,
  ariaLabel,
  children,
  onValueChange,
  onChange,
}: DsRadioProps) {
  const group = useContext(RadioContext),
    { colors } = useKjunStyles(),
    selected = (group ? group.value : value) === val;
  const geometry = tokens.extensions.radio;
  const [hovered, setHovered] = useState(false);
  useEffect(() => { if (disabled) setHovered(false); }, [disabled]);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={ariaLabel || label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => {
        if (group) group.change(val);
        else {
          onValueChange?.(val);
          onChange?.(val);
        }
      }}
      style={{
        // Content width like Web; a column parent would otherwise stretch the hit area and focus ring.
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        // Like Web's choice row on a mouse-like pointer; touch layouts keep the 44px target.
        minHeight: finePointer() ? tokens.extensions.choice.minimumHeight : tokens.native.minimumTouchTarget,
        opacity: disabled ? tokens.states.opacity.disabled : 1,
      }}
    >
      {({ pressed }) => (
        <>
          <View
            style={{
              width: geometry.size,
              height: geometry.size,
              borderWidth: geometry.borderWidth,
              borderRadius: tokens.radius.radius9999,
              alignItems: "center",
              justifyContent: "center",
              borderColor: disabled
                ? (selected ? colors.brand : colors.borderSecondary)
                : pressed ? colors.brandActive
                : hovered ? colors.brandHover
                : selected ? colors.brand : colors.borderStrong,
              backgroundColor: colors.surface,
            }}
          >
            {selected && (
              <View
                style={{
                  width: geometry.dot,
                  height: geometry.dot,
                  borderRadius: tokens.radius.radius9999,
                  backgroundColor: colors.brand,
                }}
              />
            )}
          </View>
          {(children || label) && content(children || label, {
            marginLeft: geometry.labelGap,
            ...typeStyle('label'),
          })}
        </>
      )}
    </Pressable>
  );
}
export interface DsRadioGroupProps {
  value: ChoiceValue;
  options?: ChoiceOption[];
  direction?: "horizontal" | "vertical";
  ariaLabel?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function DsRadioGroup({
  value,
  options = [],
  direction = "horizontal",
  ariaLabel,
  children,
  onValueChange,
  onChange,
}: DsRadioGroupProps) {
  const root = useRef<View>(null);
  useRadioKeyboard(root);
  return (
    <RadioContext.Provider
      value={{
        value,
        change: (next) => {
          onValueChange?.(next);
          onChange?.(next);
        },
      }}
    >
      <View
        ref={root}
        accessibilityRole="radiogroup"
        accessibilityLabel={ariaLabel}
        style={{
          flexDirection: direction === "vertical" ? "column" : "row",
          flexWrap: "wrap",
          gap: direction === "vertical" ? tokens.dimension.value8 : tokens.dimension.value16,
        }}
      >
        {children ||
          options.map((option) => (
            <DsRadio
              key={String(option.value)}
              val={option.value}
              label={option.label}
              disabled={option.disabled}
            />
          ))}
      </View>
    </RadioContext.Provider>
  );
}
