import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from "react";
import type { KjunViewHandle } from "./handles";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { chipSize } from "../../../shared/package-runtime/chip-size";
import { tokens } from "@kjun-ui/tokens";
import { AccessiblePressable as Pressable } from "./a11y";
import { textTint } from "./text-tint";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export interface KjunChipProps {
  label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void;
  /** Like Badge, a test id and outer style for the chip root (margins, alignment). */
  testID?: string; style?: StyleProp<ViewStyle>;
}
/** The ref reaches the removal button, the chip's only focus target; it is null when the chip is not removable. */
export const KjunChip: ForwardRefExoticComponent<KjunChipProps & RefAttributes<KjunViewHandle>> = forwardRef<KjunViewHandle, KjunChipProps>(function KjunChip({ label, icon, removable = false, disabled = false, size: requested = "md", removeLabel, onRemove, testID, style }, ref) {
  const m = useKjunMessages(), size = chipSize(requested);
  const { colors } = useKjunStyles(), spec = tokens.extensions.chip;
  // The chip keeps its own height; hitSlop reaches the 44px touch target around the drawn removal circle.
  const slop = (spec.nativeRemoveSize - spec.removeSize) / 2;
  // Without a removal button nothing else says the chip is disabled, so the label carries the state (Web: aria-disabled).
  const quiet = disabled && !removable;
  return <View testID={testID} accessible={quiet || undefined} accessibilityState={quiet ? { disabled: true } : undefined} aria-disabled={quiet || undefined} style={[{ alignSelf: "flex-start", maxWidth: "100%", minWidth: 0, flexShrink: 1, flexDirection: "row", alignItems: "center", gap: spec.gaps[size], minHeight: spec[size], paddingVertical: spec.paddingY, paddingLeft: spec.paddingX[size],
    // The trailing padding trims until the x glyph's outer inset matches the leading padding.
    paddingRight: removable ? spec.paddingX[size] - (spec.removeSize - spec.removeIconSizes[size]) / 2 : spec.paddingX[size],
    borderRadius: spec.radius, backgroundColor: colors.secondary, opacity: disabled ? tokens.states.opacity.disabled : 1 }, style]}>
    {!!icon && <KjunIcon name={icon} size={spec.iconSizes[size]} />}
    <KText numberOfLines={1} style={{ ...typeStyle({ ...spec.typography[size], fontWeight: spec.fontWeight }), flexShrink: 1, minWidth: 0 }}>{label}</KText>
    {removable && <Pressable ref={ref} accessibilityRole="button" accessibilityLabel={removeLabel || m.remove(label)} disabled={disabled} accessibilityState={{ disabled }} onPress={() => onRemove?.()} hitSlop={slop}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: spec.removeSize, height: spec.removeSize, marginVertical: -spec.paddingY, borderRadius: spec.radius, alignItems: "center", justifyContent: "center",
        backgroundColor: disabled ? "transparent" : pressed ? textTint(colors.text, "tintActive", colors.active) : hovered ? textTint(colors.text, "tintHover", colors.hover) : "transparent" })}>
      {/* Like Web, hover and press lift the x from the secondary text role to the label's own. */}
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => <KjunIcon name="x" size={spec.removeIconSizes[size]} color={!disabled && (pressed || hovered) ? colors.text : colors.textSecondary} />}
    </Pressable>}
  </View>;
});
