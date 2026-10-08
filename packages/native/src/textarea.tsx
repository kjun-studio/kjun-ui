import { inputTypeStyle } from "./typography";
import { FieldTextInput, useFieldSurface } from "./field-surface";
import { tokens,type InputSize } from "@kjun/tokens";
import {
forwardRef
} from "react";
import {
Platform,
TextInput,
type TextInputProps
} from "react-native";
import { useKjunField } from "./input";
import { useKjunStyles } from "./provider";

export interface DsTextareaProps extends TextInputProps {
  size?: InputSize;
  value: string;
  error?: boolean;
  rows?: number;
  disabled?: boolean;
  readonly?: boolean;
  ariaLabel?: string;
}
export const DsTextarea = forwardRef<TextInput, DsTextareaProps>(
  function DsTextarea(
    {
      value,
      size = "md",
      error = false,
      rows = 3,
      disabled = false,
      readonly = false,
      ariaLabel,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) {
    const field = useKjunField(),
      { colors, fontFamily } = useKjunStyles(),
      spec = tokens.input[size];
    const invalid = error || !!field?.error;
    const surface = useFieldSurface(size, { disabled, readOnly: readonly || props.readOnly || props.editable === false, invalid });
    return (
      <FieldTextInput
        {...props}
        {...surface.webHover}
        ref={ref}
        multiline
        numberOfLines={rows}
        value={value}
        editable={!disabled && !readonly && !props.readOnly && props.editable !== false}
        nativeID={props.nativeID || field?.id}
        accessibilityLabel={
          ariaLabel || props.accessibilityLabel || field?.label
        }
        accessibilityHint={
          field?.error || field?.hint || props.accessibilityHint
        }
        accessibilityState={{ disabled }}
        {...(Platform.OS === "web" ? {
          "aria-disabled": disabled,
          "aria-invalid": invalid || undefined,
          "aria-describedby": field?.describedBy,
          "aria-labelledby": field?.label ? field.id + "-label" : undefined,
          "aria-required": field?.required || undefined,
        } : {})}
        placeholderTextColor={
          disabled ? colors.textDisabled : colors.inputPlaceholder
        }
        onFocus={(e) => {
          surface.setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          surface.setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            width: "100%",
            minWidth: 0,
            fontFamily,
            ...inputTypeStyle(size),
            ...surface.style,
            height: undefined,
            minHeight: Math.max(spec.height, rows * spec.lineHeight + spec.textareaPaddingY * 2 + 2 * tokens.border.controlWidth),
            paddingHorizontal: spec.padding - tokens.border.controlWidth,
            paddingVertical: spec.textareaPaddingY,
            textAlignVertical: "top",
            color: surface.ink,
          },
          style,
        ]}
      />
    );
  }
);
