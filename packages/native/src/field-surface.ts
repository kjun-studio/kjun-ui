import { createContext, createElement, forwardRef, useContext, useState } from "react";
import { Animated, Platform, TextInput, type TextInputProps, type ViewStyle } from "react-native";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useReducedMotion, useResolveFont } from "./internal";
import { useKjunStyles } from "./provider";
import type { KjunTextInputHandle } from "./handles";
import { AccessiblePressable } from "./a11y";
import { useMotionValue } from "./motion";

// CSS animates web fields; native fields use the same duration through Animated.
const BaseTextInput = (Platform.OS === "web" ? TextInput : Animated.createAnimatedComponent(TextInput)) as typeof TextInput;
/** Field text input whose font family follows the Provider's weight maps, like KText. */
export const FieldTextInput = forwardRef<KjunTextInputHandle, TextInputProps>(function FieldTextInput(props, ref) {
  const resolve = useResolveFont();
  return createElement(BaseTextInput, { ...props, ref, style: resolve(props.style) });
}) as unknown as typeof TextInput;
export const FieldPressable = Platform.OS === "web" ? AccessiblePressable : Animated.createAnimatedComponent(AccessiblePressable);

/** Activate only the spare area around a small field, without duplicating child actions. */
export function fieldTarget(action: () => void, disabled: boolean) {
  const activate = (event: { target: unknown; currentTarget: unknown }) => {
    if (!disabled && event.target === event.currentTarget) action();
  };
  return Platform.OS === "web" ? { onClick: activate } : { onTouchEnd: activate };
}

/** Inside an open Select or Combobox list the search keeps only its fill when focused: the open field already shows the ring. */
export const QuietFocusContext = createContext(false);

/** Shared field state, independent of each control's value and keyboard model. */
export function useFieldSurface(size: InputSize, { disabled = false, readOnly = false, invalid = false, open = false, plain = false } = {}) {
  const { colors } = useKjunStyles();
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const quiet = useContext(QuietFocusContext);
  const spec = tokens.input[size];
  const active = !disabled && (focused || open);
  const ring = active && !quiet;
  const hover = !disabled && !readOnly && !invalid && !active && hovered;
  const border = useMotionValue(Platform.OS === "web" ? 0 : invalid ? 2 : ring ? 1 : 0, tokens.motion.control);
  const background = useMotionValue(Platform.OS === "web" || !hover ? 0 : 1, tokens.motion.control);
  const animateBorder = Platform.OS !== "web" && typeof colors.danger === "string" && typeof colors.inputBorderFocus === "string";
  const animateBackground = Platform.OS !== "web" && typeof colors.inputBg === "string" && typeof colors.hover === "string";
  const style = {
    height: spec.height,
    borderWidth: tokens.border.controlWidth,
    borderRadius: spec.radius,
    borderColor: animateBorder ? border.interpolate({ inputRange: [0, 1, 2], outputRange: ["transparent", colors.inputBorderFocus as string, colors.danger as string] }) : invalid ? colors.danger : ring ? colors.inputBorderFocus : "transparent",
    backgroundColor: animateBackground ? background.interpolate({ inputRange: [0, 1], outputRange: [colors.inputBg as string, colors.hover as string] }) : hover ? colors.hover : colors.inputBg,
    ...(Platform.OS === "web" ? {
      outlineStyle: focused && !disabled && !quiet ? 'solid' : 'none',
      outlineWidth: tokens.states.focus.width,
      outlineOffset: invalid ? tokens.states.focus.offset : tokens.states.focus.insetOffset,
      outlineColor: colors.focusRing,
      transitionProperty: "background-color, border-color",
      transitionDuration: reduced ? "0s" : `${tokens.motion.control}ms`,
      transitionTimingFunction: tokens.motion.easeOut,
    } : {}),
  } as ViewStyle;
  // A plain field is text edited in place: no surface or side border in any state. Native Web keeps its focus ring, set off from the text.
  if (plain) Object.assign(style, { borderLeftWidth: 0, borderRightWidth: 0, borderColor: "transparent", backgroundColor: "transparent" },
    Platform.OS === "web" ? { outlineOffset: tokens.states.focus.offset } : {});
  return {
    spec, style, setFocused, active, hovered,
    ink: disabled ? colors.textDisabled : colors.text,
    icon: disabled ? colors.textDisabled : colors.textTertiary,
    hit: Math.max(0, (tokens.native.minimumTouchTarget - spec.height) / 2),
    hover: { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) },
    webHover: Platform.OS === "web" ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } : {},
  };
}
