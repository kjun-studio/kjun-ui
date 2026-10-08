import { typeStyle } from "./typography";
import { View } from "react-native";
import { tokens } from "@kjun/tokens";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export interface DsChipProps { label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void }
export function DsChip({ label, icon, removable = false, disabled = false, size = "md", removeLabel, onRemove }: DsChipProps) {
  const { colors } = useKjunStyles();
  return <View style={{ alignSelf: "flex-start", maxWidth: "100%", minWidth: 0, flexShrink: 1, flexDirection: "row", alignItems: "center", gap: tokens.extensions.chip.gap, minHeight: removable ? tokens.extensions.chip.nativeRemoveSize : tokens.extensions.chip[size], paddingVertical: removable ? 0 : tokens.extensions.chip.paddingY, paddingLeft: tokens.extensions.chip.paddingX, paddingRight: removable ? 0 : tokens.extensions.chip.paddingX, borderRadius: tokens.extensions.chip.radius, backgroundColor: colors.secondary, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>
    {icon && <DsIcon name={icon} size={tokens.extensions.chip.iconSizes[size]} />}<KText style={{ ...typeStyle(tokens.extensions.chip.typography[size]), flexShrink: 1, minWidth: 0 }}>{label}</KText>{removable && <Pressable accessibilityRole="button" accessibilityLabel={removeLabel || label + " 삭제"} disabled={disabled} accessibilityState={{ disabled }} onPress={onRemove} style={{ width: tokens.extensions.chip.nativeRemoveSize, height: tokens.extensions.chip.nativeRemoveSize, borderRadius: tokens.extensions.chip.radius, alignItems: "center", justifyContent: "center" }}><DsIcon name="x" size={tokens.extensions.chip.removeIconSizes[size]} /></Pressable>}
  </View>;
}
