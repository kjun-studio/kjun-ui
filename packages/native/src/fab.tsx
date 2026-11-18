import { tokens } from "@kjun-ui/tokens";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, View, type GestureResponderEvent } from "react-native";
import { fabOffset } from "../../../shared/package-runtime/bottom-bar";
import { developmentMode, fabNameWarning } from "../../../shared/package-runtime/development";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon, useMinimumLoading } from "./button";
import { KText, useReducedMotion } from "./internal";
import { motionOut } from "./motion";
import { useKjunBottomBarHeight, useKjunSafeArea, useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type KjunFabSize = "sm" | "md";
export interface KjunFabProps {
  icon: string;
  /** Visible text beside the icon; the circle becomes a capsule of the same height. */
  label?: string;
  /** Folds a labelled FAB back into its circle (e.g. while the screen scrolls); the label stays its name. */
  collapsed?: boolean;
  /** The accessible name. Required without a label, since the icon alone says nothing. */
  ariaLabel?: string;
  /** "md" (default) is 56, "sm" is 48. Both take a label, loading and every state. */
  size?: KjunFabSize;
  /** Swaps the icon for a spinner and stops presses; the button keeps its colour. */
  loading?: boolean;
  disabled?: boolean;
  /** Stays above the bottom safe area from KjunProvider (default true). */
  safeArea?: boolean;
  /** Stays above the app's KjunBottomNavigation and KjunBottomActionBar (default true); false where the FAB's parent ends above the bar. */
  avoidBottomBar?: boolean;
  /** Extra space below, in px. */
  offsetBottom?: number;
  onPress?: (event: GestureResponderEvent) => void;
}
/** A primary action at the bottom end of its parent (place it in the screen's root view): a circle, or a capsule with a label. */
export function KjunFab({ icon, label, collapsed = false, ariaLabel, size = "md", loading = false, disabled = false, safeArea = true, avoidBottomBar = true, offsetBottom = 0, onPress }: KjunFabProps) {
  const { colors } = useKjunStyles(), insets = useKjunSafeArea(), bar = useKjunBottomBarHeight(), busy = useMinimumLoading(loading);
  const geometry = tokens.extensions.fab, small = size === "sm", height = small ? geometry.smallSize : geometry.size, iconSize = small ? geometry.smallIconSize : geometry.iconSize;
  // A bar that keeps its own safe area already covers it, so the larger of the two is the space to clear.
  const clear = Math.max(avoidBottomBar ? bar : 0, safeArea ? insets.bottom : 0);
  useEffect(() => { const warning = developmentMode() && fabNameWarning(label, ariaLabel); if (warning) console.warn(warning); }, [label, ariaLabel]);
  // Folding eases the label's width (measured while it shows), the gap and the insets to 0, as Web does with its grid column.
  const folded = !!label && collapsed, reduced = useReducedMotion();
  const fold = useRef(new Animated.Value(folded ? 1 : 0)).current;
  const [labelWidth, setLabelWidth] = useState(0), [moving, setMoving] = useState(false), first = useRef(true);
  useEffect(() => {
    fold.stopAnimation();
    // The first render starts where it already is.
    if (reduced || first.current) { first.current = false; fold.setValue(folded ? 1 : 0); setMoving(false); return; }
    setMoving(true);
    Animated.timing(fold, { toValue: folded ? 1 : 0, duration: tokens.motion.control, easing: motionOut, useNativeDriver: false })
      .start(({ finished }) => { if (finished) setMoving(false); });
  }, [folded, reduced, fold]);
  const between = (from: number) => fold.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
  // A resting, open label takes its own width, so a new label is measured afresh.
  const labelMax = !moving && !folded ? undefined : labelWidth ? between(labelWidth) : folded ? 0 : undefined;
  return <Pressable accessibilityRole="button" accessibilityLabel={ariaLabel || label} accessibilityState={{ disabled, busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed, hovered }: any) => ({
      position: "absolute", end: geometry.inset, bottom: geometry.inset + fabOffset(offsetBottom) + clear, zIndex: tokens.layers.page.navigation,
      minWidth: height, maxWidth: "100%", height, borderRadius: height / 2, flexDirection: "row", alignItems: "center", justifyContent: "center", overflow: "hidden",
      // Disabled stays opaque (the brand colour over the surface) so the content under it does not show through.
      backgroundColor: disabled ? colors.surface : pressed ? colors.brandActive : hovered && Platform.OS === "web" && !busy ? colors.brandHover : colors.brand,
      transform: [{ scale: pressed && !disabled && !busy ? 0.94 : 1 }],
      boxShadow: shadowLayers(geometry.elevation, colors),
      ...(Platform.OS === "web" && busy ? { cursor: "auto" as const } : {}),
    })}>
    {disabled && <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.brand, opacity: tokens.states.opacity.disabled }} />}
    <Animated.View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1, maxWidth: "100%",
      ...(label ? { gap: between(geometry.labelGaps[size]), paddingStart: between(geometry.paddingStart[size]), paddingEnd: between(geometry.paddingEnd[size]) } : {}) }}>
      {busy ? <KjunSpinnerGlyph size={iconSize} color={colors.onBrand} /> : <KjunIcon name={icon} size={iconSize} color={colors.onBrand} />}
      {!!label && <Animated.View style={{ flexShrink: 1, overflow: "hidden", opacity: fold.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), ...(labelMax !== undefined ? { maxWidth: labelMax } : {}) }}>
        <KText numberOfLines={1} onLayout={event => { if (!folded && !moving) setLabelWidth(event.nativeEvent.layout.width); }}
          style={{ ...typeStyle(size === "sm" ? "control" : "controlLarge"), color: colors.onBrand, flexShrink: 1 }}>{label}</KText>
      </Animated.View>}
    </Animated.View>
  </Pressable>;
}
