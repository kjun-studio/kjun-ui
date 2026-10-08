import { View } from "react-native";
import { tokens, type InputSize } from "@kjun/tokens";
import { AccessiblePressable } from "./a11y";
import { DsIcon } from "./button";
import { useKjunStyles } from "./provider";

/** The visual clear affordance is smaller than its 44px activation target. */
export function FieldClear({ size, disabled, label, onPress }: {
  size: InputSize; disabled?: boolean; label: string; onPress: () => void;
}) {
  const { colors } = useKjunStyles();
  const spec = tokens.input[size];
  return <AccessiblePressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled}
    onPress={event => { event.stopPropagation(); if (!disabled) onPress(); }}
    style={{ width: tokens.native.minimumTouchTarget, height: tokens.native.minimumTouchTarget,
      alignSelf: "center", alignItems: "center", justifyContent: "center", borderRadius: spec.clearSize / 2 }}>
    {({ pressed, hovered }: any) => <View pointerEvents="none" style={{ width: spec.clearSize, height: spec.clearSize,
      borderRadius: spec.clearSize / 2, alignItems: "center", justifyContent: "center",
      backgroundColor: disabled ? "transparent" : pressed ? colors.active : hovered ? colors.hover : "transparent" }}>
      <DsIcon name="x" size={spec.iconSize} color={disabled ? colors.textDisabled : colors.textSecondary} />
    </View>}
  </AccessiblePressable>;
}
