import { tokens } from "@kjun-ui/tokens";
import { forwardRef, useState, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from "react";
import { StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { AccessiblePressable } from "./a11y";
import type { KjunViewHandle } from "./handles";
import { content } from "./internal";
import { useKjunStyles } from "./provider";

export interface KjunPressableProps extends Omit<PressableProps, "style" | "children"> {
  children?: ReactNode;
  /** The shape is the app's: radius, padding and background come from here. The press layer and the focus ring follow its corners. */
  style?: StyleProp<ViewStyle>;
  /** The name read by screen readers; needed when the content has no text of its own. */
  ariaLabel?: string;
  /** Blocks presses and dims the content. */
  disabled?: boolean;
  /** "overlay" (default) lays a tint over the content on hover and press, which shows on photos as well as on text; "none" leaves the content to show its own. */
  pressEffect?: "overlay" | "none";
  /** Draws the Native Web focus ring inside the area, for one that reaches the screen edge or sits in a clipping parent. */
  focusRingInset?: boolean;
}
const corners = ["borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"] as const;
/**
 * An area that presses, with no shape of its own: for content that is not a button, a card or a list row
 * (a map preview, a photo tile). KJUN supplies the press layer, the focus ring, the role and the touch target.
 */
export const KjunPressable: ForwardRefExoticComponent<KjunPressableProps & RefAttributes<KjunViewHandle>> = forwardRef<KjunViewHandle, KjunPressableProps>(
  function KjunPressable({ children, style, ariaLabel, disabled = false, pressEffect = "overlay", focusRingInset, onPressIn, onPressOut, onHoverIn, onHoverOut, onLayout, ...props }, ref) {
    const { colors } = useKjunStyles();
    const [pressed, setPressed] = useState(false), [hovered, setHovered] = useState(false);
    const [size, setSize] = useState<{ width: number; height: number }>();
    const flat = StyleSheet.flatten(style) ?? {};
    const tint = disabled || pressEffect === "none" ? 0 : pressed ? tokens.states.opacity.tintActive : hovered ? tokens.states.opacity.tintControl : 0;
    // A small area still takes touches across the minimum target.
    const slop = (length: number) => Math.max(0, (tokens.native.minimumTouchTarget - length) / 2);
    const hitSlop = size ? { top: slop(size.height), bottom: slop(size.height), left: slop(size.width), right: slop(size.width) } : undefined;
    return (
      <AccessiblePressable hitSlop={hitSlop} accessibilityRole="button" {...props} ref={ref} disabled={disabled}
        accessibilityLabel={ariaLabel ?? props.accessibilityLabel}
        accessibilityState={{ ...props.accessibilityState, disabled }}
        focusRingInset={focusRingInset}
        onLayout={event => { const { width, height } = event.nativeEvent.layout; setSize(old => old && old.width === width && old.height === height ? old : { width, height }); onLayout?.(event); }}
        onPressIn={event => { setPressed(true); onPressIn?.(event); }}
        onPressOut={event => { setPressed(false); onPressOut?.(event); }}
        onHoverIn={event => { setHovered(true); onHoverIn?.(event); }}
        onHoverOut={event => { setHovered(false); onHoverOut?.(event); }}
        style={[style, disabled ? { opacity: tokens.states.opacity.disabled } : null]}>
        {content(children)}
        {tint > 0 && <View pointerEvents="none" style={[StyleSheet.absoluteFill, Object.fromEntries(corners.filter(key => flat[key] != null).map(key => [key, flat[key]])), { backgroundColor: colors.text, opacity: tint }]} />}
      </AccessiblePressable>
    );
  }
);
