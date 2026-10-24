import { tokens } from "@kjun-ui/tokens";
import type { GestureResponderEvent } from "react-native";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { useKjunStyles } from "./provider";

export interface KjunFabProps {
  icon: string;
  /** The FAB has no visible text, so it needs a name. */
  ariaLabel: string;
  disabled?: boolean;
  /** Bottom safe area (pt) the FAB stays above. */
  safeAreaBottom?: number;
  /** Extra space below, e.g. a bottom navigation's height. */
  offsetBottom?: number;
  onPress?: (event: GestureResponderEvent) => void;
}
/** A round primary action at the bottom end of its parent (place it in the screen's root view). */
export function KjunFab({ icon, ariaLabel, disabled = false, safeAreaBottom = 0, offsetBottom = 0, onPress }: KjunFabProps) {
  const { colors } = useKjunStyles();
  const { size, inset, iconSize } = tokens.extensions.fab;
  return <Pressable accessibilityRole="button" accessibilityLabel={ariaLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }: { pressed: boolean }) => ({
      position: "absolute", right: inset, bottom: inset + Math.max(0, safeAreaBottom) + Math.max(0, offsetBottom), zIndex: tokens.layers.page.navigation,
      width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center",
      backgroundColor: pressed ? colors.brandActive : colors.brand, opacity: disabled ? tokens.states.opacity.disabled : 1,
      boxShadow: shadowLayers(tokens.elevation.floating, colors),
    })}>
    <KjunIcon name={icon} size={iconSize} color={colors.onBrand} />
  </Pressable>;
}
