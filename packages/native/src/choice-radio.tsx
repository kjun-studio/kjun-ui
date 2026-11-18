import { tokens, type InputSize } from "@kjun-ui/tokens";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { finePointer } from "./internal";
import { joinHints } from "../../../shared/package-runtime/aria-ids";
import { useKjunField } from "./input";
import { useKjunStyles } from "./provider";
import { useRadioKeyboard } from "./choice-accessibility";
import { choiceBorder, choiceText, fieldAccessibility, useControlFocus, useDescriptionId, type ChoiceOption, type ChoiceValue } from "./choice-controls";

export const RadioContext = createContext<{
  value: ChoiceValue;
  size?: InputSize;
  disabled: boolean;
  invalid: boolean;
  change: (v: ChoiceValue) => void;
} | null>(null);
export interface KjunRadioProps {
  value?: ChoiceValue;
  val: ChoiceValue;
  label?: string;
  disabled?: boolean;
  /** Web form field name; Native has no forms and ignores it. */
  name?: string;
  ariaLabel?: string;
  /** Inside a RadioGroup the group's size applies unless this is set. */
  size?: InputSize;
  /** Supporting text under the label; screen readers hear it as the hint. */
  description?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunRadio({
  value,
  val,
  label,
  disabled = false,
  ariaLabel,
  size,
  description,
  children,
  onValueChange,
  onChange,
}: KjunRadioProps) {
  const group = useContext(RadioContext), field = useKjunField(), { colors } = useKjunStyles();
  const selected = (group ? group.value : value) === val;
  const blocked = disabled || !!group?.disabled, scale = size || group?.size || "md";
  // A lone radio in a FormGroup takes the group's hint, error and required state; inside a RadioGroup the group carries them.
  const own = group ? null : field, invalid = group ? group.invalid : !!field?.error;
  const geometry = tokens.extensions.radio, ring = geometry.sizes[scale], dot = geometry.dots[scale];
  const focus = useControlFocus(blocked), descriptionId = useDescriptionId();
  const [hovered, setHovered] = useState(false);
  useEffect(() => { if (blocked) setHovered(false); }, [blocked]);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={ariaLabel || label}
      accessibilityState={{ checked: selected, disabled: blocked }}
      {...fieldAccessibility(own, description ? descriptionId : undefined, description)}
      {...focus.handlers}
      disabled={blocked}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => {
        if (group) group.change(val);
        else {
          onValueChange?.(val);
          onChange?.(val);
        }
      }}
      style={{
        // Content width like Web; a column parent would otherwise stretch the hit area and focus ring.
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        // Like Web's choice row on a mouse-like pointer; touch layouts keep the 44px target.
        minHeight: finePointer() ? tokens.extensions.choice.minimumHeight : tokens.native.minimumTouchTarget,
      }}
    >
      {({ pressed }) => (
        <>
          <View
            style={{
              width: ring,
              height: ring,
              borderWidth: geometry.borderWidth,
              borderRadius: tokens.radius.radius9999,
              alignItems: "center",
              justifyContent: "center",
              // One rule with Checkbox and Web; the disabled ring and dot take the disabled-text role.
              borderColor: choiceBorder(colors, { disabled: blocked, pressed, hovered, invalid, chosen: selected }),
              backgroundColor: colors.surface,
              ...focus.ring,
            }}
          >
            {selected && (
              <View
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: tokens.radius.radius9999,
                  backgroundColor: blocked ? colors.textDisabled : colors.brand,
                }}
              />
            )}
          </View>
          {choiceText(children || label, description, blocked, geometry.labelGap, descriptionId)}
        </>
      )}
    </Pressable>
  );
}
export interface KjunRadioGroupProps {
  value: ChoiceValue;
  options?: ChoiceOption[];
  direction?: "horizontal" | "vertical";
  ariaLabel?: string;
  /** Size of every radio in the group. */
  size?: InputSize;
  /** Disables every radio in the group. */
  disabled?: boolean;
  /** Web form field name; Native has no forms and ignores it. */
  name?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunRadioGroup({
  value,
  options = [],
  direction = "horizontal",
  ariaLabel,
  size,
  disabled = false,
  children,
  onValueChange,
  onChange,
}: KjunRadioGroupProps) {
  const root = useRef<View>(null);
  useRadioKeyboard(root);
  // Inside a FormGroup the group is named by its label and hears its hint or error.
  const field = useKjunField(), invalid = !!field?.error;
  const vertical = direction === "vertical";
  return (
    <RadioContext.Provider
      value={{
        value,
        size,
        disabled,
        invalid,
        change: (next) => {
          onValueChange?.(next);
          onChange?.(next);
        },
      }}
    >
      <View
        ref={root}
        accessibilityRole="radiogroup"
        accessibilityLabel={ariaLabel || field?.label}
        accessibilityHint={joinHints(field?.hint, field?.error)}
        accessibilityState={{ disabled }}
        {...(Platform.OS === "web" ? {
          "aria-labelledby": ariaLabel || !field?.label || field.labelHidden ? undefined : field.id + "-label",
          "aria-describedby": field?.describedBy,
          "aria-invalid": invalid || undefined,
          "aria-required": field?.required || undefined,
        } : {})}
        style={{
          flexDirection: vertical ? "column" : "row",
          // A wrapping column would split into extra columns whenever the group's height is fixed.
          flexWrap: vertical ? "nowrap" : "wrap",
          gap: vertical ? tokens.extensions.radio.groupGaps.vertical : tokens.extensions.radio.groupGaps.horizontal,
        }}
      >
        {children ||
          options.map((option) => (
            <KjunRadio
              key={String(option.value)}
              val={option.value}
              label={option.label}
              disabled={option.disabled}
            />
          ))}
      </View>
    </RadioContext.Provider>
  );
}
