import { tokens } from "@kjun/tokens";
import { forwardRef, useCallback, useRef, useState } from "react";
import { useChoiceSpace } from "./choice-accessibility";
import { useKjunStyles } from "./provider";
import {
Platform,
Pressable,
type PressableProps,
type ViewStyle,
type View,
} from "react-native";
// Like react-aria on Web, a ring needs :focus-visible and a last input that was not a pointer: programmatic
// focus after a click (a Modal moving focus to its first control) otherwise matches :focus-visible.
let pointerModality = false;
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.addEventListener("keydown", event => { if (!event.metaKey && !event.ctrlKey && !event.altKey) pointerModality = false; }, true);
  for (const type of ["pointerdown", "mousedown"]) document.addEventListener(type, () => { pointerModality = true; }, true);
}
export function focusVisible(target: unknown) {
  return Platform.OS === "web" && !pointerModality
    && !!(target as { matches?: (selector: string) => boolean }).matches?.(":focus-visible");
}
// Native Web consumes the aria aliases; native runtimes consume accessibilityState.
export const AccessiblePressable = forwardRef<View, PressableProps & { focusRingInset?: boolean; focusRing?: boolean; focusRingRadius?: number }>(
  // focusRing=false: a parent surface draws the ring (compound fields).
  // focusRingRadius: while focused, round the target so an inset ring follows a clipping parent's corners.
  function AccessiblePressable({ focusRingInset, focusRing = true, focusRingRadius, ...props }, ref) {
    const { colors } = useKjunStyles();
    const [focused, setFocused] = useState(false);
    const state = props.accessibilityState;
    const root = useRef<View>(null);
    const setRef = useCallback((node: View | null) => {
      root.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }, [ref]);
    useChoiceSpace(root, props.accessibilityRole, props.disabled || state?.disabled);
    const web =
      Platform.OS === "web" && state
        ? {
            "aria-checked": state.checked,
            "aria-disabled": state.disabled,
            "aria-busy": state.busy,
            "aria-expanded": state.expanded,
            ...(props.accessibilityRole === "button"
              ? { "aria-pressed": state.selected }
              : { "aria-selected": state.selected }),
          }
        : {};
    // Without its own ring the target still suppresses the browser default one.
    const ring = (!focusRing
      ? Platform.OS === 'web' ? { outlineStyle: 'none' } : undefined
      : focused ? { outlineStyle: 'solid', outlineWidth: tokens.states.focus.width, outlineOffset: (focusRingInset ?? props.accessibilityRole === 'tab') ? tokens.states.focus.insetOffset : tokens.states.focus.offset, outlineColor: colors.focusRing, ...(focusRingRadius != null ? { borderRadius: focusRingRadius } : {}) } : undefined) as ViewStyle | undefined;
    return <Pressable {...props} {...web} ref={setRef}
      onFocus={event => {
        setFocused(focusVisible(event.currentTarget));
        props.onFocus?.(event);
      }}
      onBlur={event => { setFocused(false); props.onBlur?.(event); }}
      style={state => [typeof props.style === 'function' ? props.style(state) : props.style, ring]} />;
  }
);
