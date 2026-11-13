import { tokens } from "@kjun-ui/tokens";
import { Platform, View, type GestureResponderEvent } from "react-native";
import { fabOffset } from "../../../shared/package-runtime/bottom-bar";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon, useMinimumLoading } from "./button";
import { KText } from "./internal";
import { useKjunBottomBarHeight, useKjunSafeArea, useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type KjunFabSize = "sm" | "md";
export interface KjunFabProps {
  icon: string;
  /** Visible text beside the icon; the circle becomes a capsule of the same height. */
  label?: string;
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
export function KjunFab({ icon, label, ariaLabel, size = "md", loading = false, disabled = false, safeArea = true, avoidBottomBar = true, offsetBottom = 0, onPress }: KjunFabProps) {
  const { colors } = useKjunStyles(), insets = useKjunSafeArea(), bar = useKjunBottomBarHeight(), busy = useMinimumLoading(loading);
  const geometry = tokens.extensions.fab, small = size === "sm", height = small ? geometry.smallSize : geometry.size, iconSize = small ? geometry.smallIconSize : geometry.iconSize;
  // A bar that keeps its own safe area already covers it, so the larger of the two is the space to clear.
  const clear = Math.max(avoidBottomBar ? bar : 0, safeArea ? insets.bottom : 0);
  return <Pressable accessibilityRole="button" accessibilityLabel={ariaLabel || label} accessibilityState={{ disabled, busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed, hovered }: any) => ({
      position: "absolute", end: geometry.inset, bottom: geometry.inset + fabOffset(offsetBottom) + clear, zIndex: tokens.layers.page.navigation,
      minWidth: height, maxWidth: "100%", height, borderRadius: height / 2, flexDirection: "row", alignItems: "center", justifyContent: "center", overflow: "hidden",
      ...(label ? { gap: geometry.labelGaps[size], paddingStart: geometry.paddingStart[size], paddingEnd: geometry.paddingEnd[size] } : {}),
      // Disabled stays opaque (the brand colour over the surface) so the content under it does not show through.
      backgroundColor: disabled ? colors.surface : pressed ? colors.brandActive : hovered && Platform.OS === "web" && !busy ? colors.brandHover : colors.brand,
      transform: [{ scale: pressed && !disabled && !busy ? 0.94 : 1 }],
      boxShadow: shadowLayers(geometry.elevation, colors),
      ...(Platform.OS === "web" && busy ? { cursor: "auto" as const } : {}),
    })}>
    {disabled && <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.brand, opacity: tokens.states.opacity.disabled }} />}
    <KjunIcon name={busy ? "loader-2" : icon} spin={busy} size={iconSize} color={colors.onBrand} />
    {!!label && <KText numberOfLines={1} style={{ ...typeStyle(size === "sm" ? "control" : "controlLarge"), color: colors.onBrand, flexShrink: 1 }}>{label}</KText>}
  </Pressable>;
}
