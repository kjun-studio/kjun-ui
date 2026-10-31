import { tokens } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { View, type PressableProps } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { content } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

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
  centered = false,
}: {
  /** Time segment lists: a centred number, the selected one inverted instead of checked. */
  centered?: boolean;
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
        justifyContent: centered ? "center" : "space-between",
        gap: tokens.dimension.value8,
        paddingVertical: tokens.extensions.menu.optionPaddingY,
        paddingHorizontal: centered ? 0 : tokens.extensions.menu.optionPaddingX,
        backgroundColor: selected
          ? centered ? colors.text : colors.selectedBg
          : pressed
          ? colors.hover
          : undefined,
        opacity: disabled ? tokens.states.opacity.disabled : 1,
      })}
    >
      <View style={centered ? undefined : { flex: 1 }}>{content(children || label, { fontSize: tokens.extensions.menu.optionFontSize, lineHeight: tokens.extensions.menu.optionLineHeight,
        ...(centered ? { fontVariant: ["tabular-nums"], ...(selected ? { color: colors.surface, fontWeight: typeStyle("control").fontWeight } : {}) } : {}) })}</View>
      {selected && !centered && <KjunIcon name="check" size={tokens.extensions.menu.iconSize} color={colors.brand} />}
    </Pressable>
  );
}
