import { joinHints } from "../../../shared/package-runtime/aria-ids";
import { textareaBounds, textareaCount, textareaMaxRows } from "../../../shared/package-runtime/textarea";
import { inputTypeStyle, typeStyle } from "./typography";
import { FieldTextInput, useFieldSurface } from "./field-surface";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import {
forwardRef,
useCallback,
useLayoutEffect,
useRef,
useState,
type ReactNode
} from "react";
import {
Animated,
Platform,
View,
TextInput,
type TextInputProps
} from "react-native";
import { KjunButton } from "./button";
import { KText, content } from "./internal";
import { useKjunField } from "./input";
import { useKjunStyles } from "./provider";

export interface KjunTextareaProps extends TextInputProps {
  size?: InputSize;
  value: string;
  error?: boolean;
  rows?: number;
  /** The field grows with its text from rows up to maxRows, then scrolls (default 6; rows keeps it fixed). */
  maxRows?: number;
  /** Character limit (UTF-16 units); the count shows "length/maxLength" and a longer value reads as an error. */
  maxLength?: number;
  /** Shows the character count inside the field, as "length/maxLength" when maxLength is set. */
  showCount?: boolean;
  /** Composer: controls at the start of the bar inside the field (attach, mention). */
  actions?: ReactNode;
  /** Composer: shows a submit button at the end of the bar, named by this label. */
  submitLabel?: string;
  /** The submit button, while there is text within maxLength. */
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  readonly?: boolean;
  ariaLabel?: string;
}
export const KjunTextarea = forwardRef<TextInput, KjunTextareaProps>(
  function KjunTextarea(
    {
      value,
      size = "md",
      error = false,
      rows = 3,
      maxRows = textareaMaxRows,
      showCount = false,
      actions,
      submitLabel,
      onSubmit,
      disabled = false,
      readonly = false,
      ariaLabel,
      style,
      onFocus,
      onBlur,
      onContentSizeChange,
      ...props
    },
    ref
  ) {
    const field = useKjunField(),
      { colors, fontFamily } = useKjunStyles(),
      spec = tokens.input[size];
    const count = textareaCount(value ?? "", props.maxLength);
    const invalid = error || !!field?.error || count.over;
    const readOnly = readonly || !!props.readOnly || props.editable === false;
    const surface = useFieldSurface(size, { disabled, readOnly, invalid });
    const footer = showCount || actions != null || submitLabel != null;
    const [minimum, maximum] = textareaBounds(size, rows, maxRows, footer);
    const grows = maximum > minimum;
    // The text's own height, reported by the input; the field follows it between the row bounds.
    // The measurement includes the padding, so it only counts for the size and layout it was taken at.
    const layout = size + (footer ? ":footer" : "");
    const [measured, setMeasured] = useState({ layout, height: 0 });
    const textHeight = measured.layout === layout ? measured.height : 0;
    const height = grows ? Math.min(maximum, Math.max(minimum, textHeight + (footer ? 0 : 2 * tokens.border.controlWidth))) : undefined;
    const element = useRef<TextInput | null>(null);
    const setRef = useCallback((node: TextInput | null) => {
      element.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }, [ref]);
    // Native Web reports scrollHeight as the content size, which never drops below the current height, so a
    // shrinking text is measured with the height released for a moment, like the web packages do.
    useLayoutEffect(() => {
      const node = element.current as unknown as HTMLTextAreaElement | null;
      if (Platform.OS !== "web" || !grows || !node?.style) return;
      const previous = node.style.height;
      node.style.height = "auto";
      const next = node.scrollHeight;
      node.style.height = previous;
      setMeasured(current => current.layout === layout && current.height === next ? current : { layout, height: next });
    }, [value, grows, layout]);
    const canSubmit = submitLabel != null && !disabled && !readOnly && !!value?.trim() && !count.over;
    const input = (
      <FieldTextInput
        {...props}
        {...(footer ? {} : surface.webHover)}
        ref={setRef}
        multiline
        numberOfLines={rows}
        value={value}
        editable={!disabled && !readOnly}
        scrollEnabled={!grows || (height ?? 0) >= maximum}
        nativeID={props.nativeID || field?.id}
        accessibilityLabel={
          ariaLabel || props.accessibilityLabel || field?.label
        }
        accessibilityHint={
          joinHints(field?.hint, field?.error, showCount ? count.text : undefined) || props.accessibilityHint
        }
        accessibilityState={{ disabled }}
        {...(Platform.OS === "web" ? {
          "aria-disabled": disabled,
          "aria-invalid": invalid || undefined,
          "aria-describedby": field?.describedBy,
          "aria-labelledby": field?.label && !field.labelHidden ? field.id + "-label" : undefined,
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
        onContentSizeChange={(e) => {
          if (Platform.OS !== "web") setMeasured({ layout, height: e.nativeEvent.contentSize.height });
          onContentSizeChange?.(e);
        }}
        style={[
          {
            width: "100%",
            minWidth: 0,
            fontFamily,
            ...inputTypeStyle(size),
            ...(footer ? { backgroundColor: "transparent", borderWidth: 0, ...(Platform.OS === "web" ? { outlineWidth: 0, outlineStyle: "solid" as const } : {}) } : surface.style),
            height,
            minHeight: minimum,
            maxHeight: grows ? maximum : undefined,
            // With a footer the wrapper carries the border, so the text keeps the field's own inset.
            paddingHorizontal: footer ? spec.padding : spec.padding - tokens.border.controlWidth,
            paddingTop: spec.textareaPaddingY,
            paddingBottom: footer ? tokens.extensions.textarea.footerTextGap : spec.textareaPaddingY,
            textAlignVertical: "top",
            color: surface.ink,
          },
          style,
        ]}
      />
    );
    if (!footer) return input;
    return (
      <Animated.View {...surface.webHover} style={{ ...surface.style, height: undefined, minWidth: 0 }}>
        {input}
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.textarea.footerGap, paddingHorizontal: tokens.extensions.textarea.footerPadding, paddingBottom: tokens.extensions.textarea.footerPadding }}>
          {content(actions)}
          {showCount && <KText aria-hidden={true} style={{ ...typeStyle("caption"), marginLeft: "auto", paddingHorizontal: tokens.extensions.textarea.countPaddingX, fontVariant: ["tabular-nums"],
            color: disabled ? colors.textDisabled : count.over ? colors.danger : colors.textTertiary, ...(count.over ? { fontWeight: typeStyle("control").fontWeight } : {}) }}>{count.text}</KText>}
          {submitLabel != null && <View style={{ marginLeft: showCount ? 0 : "auto", borderRadius: tokens.extensions.textarea.submitRadius, overflow: "hidden" }}>
            <KjunButton size="sm" prefixIcon="arrow-up" ariaLabel={submitLabel} disabled={!canSubmit} onPress={() => onSubmit?.(value)} />
          </View>}
        </View>
      </Animated.View>
    );
  }
);
