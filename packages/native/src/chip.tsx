import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { View } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { AccessiblePressable as Pressable } from "./a11y";
import { alertTint } from "./alert-actions-context";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export interface KjunChipProps { label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void }
export function KjunChip({ label, icon, removable = false, disabled = false, size = "md", removeLabel, onRemove }: KjunChipProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(), spec = tokens.extensions.chip;
  // The chip keeps its own height; hitSlop reaches the 44px touch target around the drawn removal circle.
  const slop = (spec.nativeRemoveSize - spec.removeSize) / 2;
  return <View style={{ alignSelf: "flex-start", maxWidth: "100%", minWidth: 0, flexShrink: 1, flexDirection: "row", alignItems: "center", gap: spec.gaps[size], minHeight: spec[size], paddingVertical: spec.paddingY, paddingLeft: spec.paddingX[size],
    // The trailing padding trims until the x glyph's outer inset matches the leading padding.
    paddingRight: removable ? spec.paddingX[size] - (spec.removeSize - spec.removeIconSizes[size]) / 2 : spec.paddingX[size],
    borderRadius: spec.radius, backgroundColor: colors.secondary, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>
    {!!icon && <KjunIcon name={icon} size={spec.iconSizes[size]} />}
    <KText numberOfLines={1} style={{ ...typeStyle(spec.typography[size]), fontWeight: `${spec.fontWeight}` as "500", flexShrink: 1, minWidth: 0 }}>{label}</KText>
    {removable && <Pressable accessibilityRole="button" accessibilityLabel={removeLabel || m.remove(label)} disabled={disabled} accessibilityState={{ disabled }} onPress={onRemove} hitSlop={slop}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: spec.removeSize, height: spec.removeSize, marginVertical: -spec.paddingY, borderRadius: spec.radius, alignItems: "center", justifyContent: "center",
        backgroundColor: disabled ? "transparent" : pressed ? alertTint(colors.text, "tintActive", colors.active) : hovered ? alertTint(colors.text, "tintHover", colors.hover) : "transparent" })}>
      <KjunIcon name="x" size={spec.removeIconSizes[size]} color={colors.textSecondary} />
    </Pressable>}
  </View>;
}
