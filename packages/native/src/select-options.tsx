import { tokens } from "@kjun/tokens";
import { type ReactNode } from "react";
import { View, type PressableProps } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsIcon } from "./button";
import { content } from "./internal";
import { useKjunStyles } from "./provider";

export { optionValue, optionKey, optionLabel, optionDisabled } from "../../../shared/package-runtime/options";
export type { OptionValue, SelectOption } from "../../../shared/package-runtime/options";
export function OptionRow({
  selected,
  disabled,
  multiple,
  label,
  children,
  onPress,
  onLayout,
}: {
  selected: boolean;
  disabled?: boolean;
  multiple?: boolean;
  label: string;
  children?: ReactNode;
  onPress: () => void;
  onLayout?: PressableProps["onLayout"];
}) {
  const { colors } = useKjunStyles();
  return (
    <Pressable
      accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => ({
        borderRadius: tokens.radius.radius8,
        minHeight: tokens.extensions.menu.optionHeight,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.dimension.value8,
        paddingVertical: tokens.extensions.menu.optionPaddingY,
        paddingHorizontal: tokens.extensions.menu.optionPaddingX,
        backgroundColor: selected
          ? colors.selectedBg
          : pressed
          ? colors.hover
          : undefined,
        opacity: disabled ? tokens.states.opacity.disabled : 1,
      })}
    >
      <View style={{ flex: 1 }}>{content(children || label, { fontSize: tokens.extensions.menu.optionFontSize, lineHeight: tokens.extensions.menu.optionLineHeight })}</View>
      {selected && <DsIcon name="check" size={tokens.extensions.menu.iconSize} color={colors.brand} />}
    </Pressable>
  );
}
