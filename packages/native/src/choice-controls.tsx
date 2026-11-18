import { typeStyle } from "./typography";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { Animated, Easing, Platform } from "react-native";
import { useMotionValue } from "./motion";
import { tokens, type InputSize } from "@kjun-ui/tokens";
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
import { KjunIcon } from "./button";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { KText, content, finePointer, useReducedMotion } from "./internal";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { joinHints } from "../../../shared/package-runtime/aria-ids";
import { useKjunField } from "./input";
import { useKjunStyles } from "./provider";
import { useRadioKeyboard } from "./choice-accessibility";
import { shadowLayers } from "../../../shared/package-runtime/elevation";

export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  /** ButtonGroup only: show the icon alone in a square segment; label becomes the accessible name and tooltip. */
  iconOnly?: boolean;
  dot?: ColorValue;
}
export interface KjunCheckboxProps<T = ChoiceValue> {
  value: boolean | T[];
  /** Mixed selection display; value and change callbacks keep their boolean/array shape. */
  indeterminate?: boolean;
  val?: T;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  children?: ReactNode;
  onValueChange?: (value: boolean | T[]) => void;
  onChange?: (value: boolean | T[]) => void;
}
export function KjunCheckbox<T = ChoiceValue>({
  value,
  indeterminate = false,
  val,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  children,
  onValueChange,
  onChange,
}: KjunCheckboxProps<T>) {
  const { colors } = useKjunStyles(),
    checked = Array.isArray(value) ? value.includes(val!) : value,
    filled = checked || indeterminate,
    dimension = tokens.extensions.checkbox.sizes[size];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
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
        // One disabled rule, like Button and fields: nothing fades; only a press dims.
        opacity: !disabled && pressed ? tokens.states.opacity.pressed : 1,
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
          // Same roles as Radio: a strong boundary while enabled; disabled strokes and fills take the disabled-text role.
          borderColor: disabled ? colors.textDisabled : filled ? colors.brand : colors.borderStrong,
          backgroundColor: filled ? (disabled ? colors.textDisabled : colors.brand) : colors.surface,
        }}
      >
        {filled && (
          // The mixed state's minus is not in every app's icon set.
          <IconFallbacks icons={componentIcons}>
            <KjunIcon
              name={indeterminate ? "minus" : "check"}
              size={tokens.extensions.checkbox.iconSizes[size]}
              color={disabled ? colors.surface : colors.onBrand}
            />
          </IconFallbacks>
        )}
      </View>
      {!!(children || label) &&
        content(children || label, {
          marginLeft: tokens.extensions.checkbox.labelGap,
          ...typeStyle('label'),
          ...(disabled ? { color: colors.textDisabled } : null),
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
export interface KjunSwitchProps {
  value: boolean;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  /** Supporting text under the label; screen readers hear it as the hint. */
  description?: string;
  /** Saving: a spinner turns in the thumb and presses are ignored, without dimming the switch like disabled. */
  loading?: boolean;
  children?: ReactNode;
  onValueChange?: (value: boolean) => void;
  onChange?: (value: boolean) => void;
}
// A small ring that turns inside the thumb while a switch saves (also a busy KjunListRow's switch).
export function SwitchSpinner() {
  const { colors } = useKjunStyles();
  return <KjunSpinnerGlyph size={tokens.extensions.switch.spinnerSize} color={colors.brand} />;
}
export function KjunSwitch({
  value,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  description,
  loading = false,
  children,
  onValueChange,
  onChange,
}: KjunSwitchProps) {
  const { colors } = useKjunStyles(), m = useKjunMessages(), field = useKjunField();
  const width = tokens.extensions.switch.widths[size];
  const height = tokens.extensions.switch.heights[size];
  const thumb = height - 2 * tokens.extensions.switch.padding;
  const offset = width - height;
  const motion = useMotionValue(value ? 1 : 0);
  const focus = useControlFocus(disabled);
  const [hovered, setHovered] = useState(false);
  // Off is a quiet track with no boundary; hover deepens whichever colour the track has.
  const hover = hovered && !disabled && !loading;
  // The switch-track role (default border) lets a palette darken the off track to a 3:1 boundary.
  // Disabled keeps the off track and paints the on track in the disabled-text role (the one disabled rule).
  const off = hover ? colors.borderStrong : colors.switchTrack ?? colors.border, on = disabled ? colors.textDisabled : hover ? colors.brandHover : colors.brand;
  const trackColor = typeof off === 'string' && typeof on === 'string'
    ? motion.interpolate({ inputRange: [0, 1], outputRange: [off, on] })
    : value ? on : off;
  // switch-thumb falls back to switch-thumb-on, so the thumb keeps one colour unless a palette sets them apart.
  const thumbColor = typeof colors.switchThumb === 'string' && typeof colors.switchThumbOn === 'string'
    ? motion.interpolate({ inputRange: [0, 1], outputRange: [colors.switchThumb, colors.switchThumbOn] })
    : value ? colors.switchThumbOn : colors.switchThumb;
  return (
    <Pressable
      accessibilityRole="switch"
      {...focus.handlers}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityState={{ checked: value, disabled, busy: loading }}
      accessibilityLabel={ariaLabel || label || field?.label}
      // Like the web: the field's hint and error, the description, and "saving" while it saves.
      accessibilityHint={joinHints(field?.hint, field?.error, description, loading ? m.saving : undefined)}
      {...(Platform.OS === "web" ? {
        "aria-describedby": field?.describedBy,
        "aria-invalid": field?.error ? true : undefined,
        "aria-required": field?.required || undefined,
      } : {})}
      disabled={disabled}
      onPress={() => {
        if (loading) return;
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
        {/* One thumb in both states: the same size, lifted by a contact shadow, only its position changes. */}
        <Animated.View
          style={{
            width: thumb,
            height: thumb,
            borderRadius: tokens.extensions.switch.radius,
            backgroundColor: thumbColor,
            boxShadow: shadowLayers(tokens.extensions.switch.elevation, colors),
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, offset] }) }],
          }}
        >{loading && <SwitchSpinner />}</Animated.View>
      </Animated.View>
      {description ? (
        <View style={{ marginLeft: tokens.extensions.switch.labelGap, flexShrink: 1, minWidth: 0 }}>
          {!!(children || label) && content(children || label, { ...typeStyle('label'), ...(disabled ? { color: colors.textDisabled } : null) })}
          <KText style={{ ...typeStyle('caption'), marginTop: tokens.dimension.value4, color: disabled ? colors.textDisabled : colors.textSecondary }}>{description}</KText>
        </View>
      ) : !!(children || label) &&
        content(children || label, {
          marginLeft: tokens.extensions.switch.labelGap,
          ...typeStyle('label'),
          ...(disabled ? { color: colors.textDisabled } : null),
        })}
    </Pressable>
  );
}
export const RadioContext = createContext<{
  value: ChoiceValue;
  change: (v: ChoiceValue) => void;
} | null>(null);
export interface KjunRadioProps {
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
export function KjunRadio({
  value,
  val,
  label,
  disabled = false,
  ariaLabel,
  children,
  onValueChange,
  onChange,
}: KjunRadioProps) {
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
              // One disabled rule, like Button and fields: the ring and dot take the disabled-text role.
              borderColor: disabled
                ? colors.textDisabled
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
                  backgroundColor: disabled ? colors.textDisabled : colors.brand,
                }}
              />
            )}
          </View>
          {!!(children || label) && content(children || label, {
            marginLeft: geometry.labelGap,
            ...typeStyle('label'),
            ...(disabled ? { color: colors.textDisabled } : null),
          })}
        </>
      )}
    </Pressable>
  );
}
export interface KjunRadioGroupProps {
  value: ChoiceValue;
  options?: ChoiceOption[];
  direction?: "horizontal" | "vertical";
  ariaLabel?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunRadioGroup({
  value,
  options = [],
  direction = "horizontal",
  ariaLabel,
  children,
  onValueChange,
  onChange,
}: KjunRadioGroupProps) {
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
          flexWrap: direction === "vertical" ? "nowrap" : "wrap",
          gap: direction === "vertical" ? tokens.dimension.value8 : tokens.dimension.value16,
        }}
      >
        {children ||
          options.map((option) => (
            <KjunRadio
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
