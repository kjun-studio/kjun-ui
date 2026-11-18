import { View } from "react-native";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { AccessiblePressable } from "./a11y";
import { KjunIcon } from "./button";
import { useKjunStyles } from "./provider";
import { FontText } from "./internal";
import { typeStyle } from "./typography";

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
      <KjunIcon name="x" size={spec.iconSize} color={disabled ? colors.textDisabled : colors.textSecondary} />
    </View>}
  </AccessiblePressable>;
}

/**
 * A password field's 보기/숨기기 text button. Both words take one cell (the hidden one has no height), so the button
 * keeps the wider word's width as it toggles; it activates over the 44px target like the clear button.
 */
export function FieldReveal({ size, disabled, revealed, label, show, hide,onPress }: {
  size: InputSize; disabled?: boolean; revealed: boolean; label: string; show: string; hide: string; onPress: () => void;
}) {
  const { colors, fontFamily } = useKjunStyles();
  const spec = tokens.input[size];
  const ink = disabled ? colors.textDisabled : colors.text;
  const word = (text: string, hidden: boolean) => <FontText style={{ fontFamily, ...typeStyle(tokens.button.typography.sm), color: ink, textAlign: "center",
    ...(hidden ? { height: 0, opacity: 0 } : {}) }}>{text}</FontText>;
  return <AccessiblePressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled}
    onPress={event => { event.stopPropagation(); if (!disabled) onPress(); }}
    style={{ minHeight: tokens.native.minimumTouchTarget, alignSelf: "center", justifyContent: "center" }}>
    {({ pressed, hovered }: any) => <View pointerEvents="none" style={{ height: spec.clearSize, paddingHorizontal: tokens.space.inline.sm,
      borderRadius: tokens.button.radii.sm, justifyContent: "center", alignItems: "center",
      backgroundColor: disabled ? "transparent" : pressed ? colors.active : hovered ? colors.hover : "transparent" }}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {word(show, revealed)}
        {word(hide, !revealed)}
      </View>
    </View>}
  </AccessiblePressable>;
}
