import { typeStyle } from "./typography";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { Animated, Easing, Platform } from "react-native";
import { useMotionValue } from "./motion";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import {
useState,
useEffect,
useId,
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
import { joinHints, mergeIds } from "../../../shared/package-runtime/aria-ids";
import { useKjunField } from "./input";
import { useKjunStyles } from "./provider";
import { shadowLayers } from "../../../shared/package-runtime/elevation";

export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  /** ButtonGroup only: show the icon alone in a square segment; label becomes the accessible name and tooltip. */
  iconOnly?: boolean;
  /** FilterGroup only: a count after the label ("진행 중 12"), joined to the label in the accessible name. A string is shown as given. */
  count?: number | string;
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
  /** Supporting text under the label; screen readers hear it as the hint. */
  description?: string;
  children?: ReactNode;
  onValueChange?: (value: boolean | T[]) => void;
  onChange?: (value: boolean | T[]) => void;
}
/** The label alone, or the label with supporting text under it, like Web's choice text. */
export function choiceText(text: ReactNode, description: string | undefined, disabled: boolean, gap: number, descriptionId?: string) {
  return <ChoiceText text={text} description={description} disabled={disabled} gap={gap} descriptionId={descriptionId} />;
}
/** The id Native Web points aria-describedby at; native platforms read the description as the hint. */
export const useDescriptionId = () => "kjun-" + useId().replace(/:/g, "") + "-description";
function ChoiceText({ text, description, disabled, gap, descriptionId }: { text: ReactNode; description?: string; disabled: boolean; gap: number; descriptionId?: string }) {
  const { colors } = useKjunStyles();
  const labelStyle = { ...typeStyle('label'), ...(disabled ? { color: colors.textDisabled } : null) };
  if (!description) return text ? content(text, { marginLeft: gap, ...labelStyle }) : null;
  return (
    <View style={{ marginLeft: gap, flexShrink: 1, minWidth: 0 }}>
      {!!text && content(text, labelStyle)}
      <KText nativeID={descriptionId} style={{ ...typeStyle('caption'), marginTop: tokens.dimension.value4, color: disabled ? colors.textDisabled : colors.textSecondary }}>{description}</KText>
    </View>
  );
}
/** FormGroup wiring shared by the choice controls: Web gets the group's ids, every platform hears its hint and error. */
export function fieldAccessibility(field: ReturnType<typeof useKjunField>, descriptionId: string | undefined, ...hints: (string | undefined)[]) {
  return {
    accessibilityHint: joinHints(field?.hint, field?.error, ...hints),
    ...(Platform.OS === "web" ? {
      "aria-describedby": mergeIds(field?.describedBy, descriptionId),
      "aria-invalid": field?.error ? true : undefined,
      "aria-required": field?.required || undefined,
    } : {}),
  };
}
/** Boundary of a choice box: disabled, press, hover, then invalid (only while unchosen), chosen and resting roles. */
export function choiceBorder(colors: ReturnType<typeof useKjunStyles>["colors"], state: { disabled: boolean; pressed: boolean; hovered: boolean; invalid: boolean; chosen: boolean }) {
  if (state.disabled) return colors.textDisabled;
  if (state.pressed) return colors.brandActive;
  if (state.hovered) return state.invalid && !state.chosen ? colors.danger : colors.brandHover;
  if (state.invalid && !state.chosen) return colors.danger;
  return state.chosen ? colors.brand : colors.borderStrong;
}
export function KjunCheckbox<T = ChoiceValue>({
  value,
  indeterminate = false,
  val,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  description,
  children,
  onValueChange,
  onChange,
}: KjunCheckboxProps<T>) {
  const { colors } = useKjunStyles(), field = useKjunField(),
    checked = Array.isArray(value) ? value.includes(val!) : value,
    filled = checked || indeterminate,
    dimension = tokens.extensions.checkbox.sizes[size];
  const focus = useControlFocus(disabled), descriptionId = useDescriptionId();
  const [hovered, setHovered] = useState(false);
  useEffect(() => { if (disabled) setHovered(false); }, [disabled]);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
      accessibilityLabel={ariaLabel || label}
      // Inside a FormGroup the box keeps its own label but takes the group's hint, error and required state.
      {...fieldAccessibility(field, description ? descriptionId : undefined, description)}
      {...focus.handlers}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => {
        const result = Array.isArray(value)
          ? checked
            ? value.filter((v) => v !== val)
            : [...value, val!]
          : !checked;
        onValueChange?.(result);
        onChange?.(result);
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
      {({ pressed }) => {
        // Like Web: hover and press deepen the boundary, and a checked box's fill with it; disabled takes the disabled-text role.
        const border = choiceBorder(colors, { disabled, pressed, hovered, invalid: !!field?.error, chosen: filled });
        return (
          <>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: dimension,
                height: dimension,
                borderRadius: tokens.extensions.checkbox.radii[size],
                borderWidth: tokens.border.controlWidth,
                borderColor: border,
                backgroundColor: filled ? border : colors.surface,
                ...focus.ring,
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
            {choiceText(children || label, description, disabled, tokens.extensions.checkbox.labelGap, descriptionId)}
          </>
        );
      }}
    </Pressable>
  );
}
// Web draws the choice focus ring on the control, not the whole label row; Native Web follows.
export function useControlFocus(disabled: boolean) {
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
  const focus = useControlFocus(disabled), descriptionId = useDescriptionId();
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
      {...fieldAccessibility(field, description ? descriptionId : undefined, description, loading ? m.saving : undefined)}
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
      {choiceText(children || label, description, disabled, tokens.extensions.switch.labelGap, descriptionId)}
    </Pressable>
  );
}
