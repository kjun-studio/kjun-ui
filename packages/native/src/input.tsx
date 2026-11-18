import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { FieldClear, FieldReveal } from "./field-clear";
import { inputCount, inputReveal, inputShowsClear } from "../../../shared/package-runtime/input-field";
import { joinHints, mergeIds } from "../../../shared/package-runtime/aria-ids";
import { inputEdge, type InputVariant } from "../../../shared/package-runtime/input-variant";
import { FieldTextInput, fieldTarget, useFieldSurface } from "./field-surface";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { KjunTextInputHandle } from "./handles";
import { typeStyle, inputTypeStyle } from "./typography";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import {
Children,
cloneElement,
createContext,
forwardRef,
isValidElement,
useContext,
useEffect,
useId,
useRef,
useState,
type ReactNode,
} from "react";
import {
Platform,
Text,
TextInput,
View,
type StyleProp,
type TextInputProps,
type ViewStyle,
} from "react-native";
import { KjunIcon } from "./button";
import { content, FontText } from "./internal";
import { useKjunStyles } from "./provider";
interface FieldValue {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  describedBy?: string;
  labelHidden?: boolean;
}
// Internal boundary for composite fields; index.ts exports only public controls.
export const FieldContext = createContext<FieldValue | null>(null);
export const useKjunField = () => useContext(FieldContext);
export interface KjunFormGroupProps {
  label?: string;
  id?: string;
  required?: boolean;
  /** Marks the field as optional with the "(선택)" / "(optional)" message; required wins when both are set. */
  optional?: boolean;
  error?: string;
  hint?: string;
  /** Hides the label visually while it still names the field. */
  labelHidden?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function KjunFormGroup({
  label,
  id,
  required = false,
  optional = false,
  error = "",
  hint = "",
  labelHidden = false,
  children,
  style,
}: KjunFormGroupProps) {
  const m = useKjunMessages();
  const uid = useId().replace(/:/g, "");
  const fieldId = id || "kjun-native-" + uid;
  const { colors: c, fontFamily } = useKjunStyles();
  // An error takes the hint's slot instead of stacking under it, so the field keeps its height; the control is then
  // described by the error alone.
  const shownHint = error ? "" : hint;
  return (
    <FieldContext.Provider
      value={{ id: fieldId, label, error, hint: shownHint, required, labelHidden,
        describedBy: mergeIds(shownHint ? fieldId + "-hint" : undefined, error ? fieldId + "-error" : undefined) }}
    >
      <View style={[{ minWidth: 0, marginBottom: tokens.extensions.form.itemGap }, style]}>
        {!!label && !labelHidden && (
          <FontText
            nativeID={fieldId + "-label"}
            style={{
              fontFamily,
              ...typeStyle('label'),


              color: c.text,
              marginBottom: tokens.extensions.form.labelGap,
            }}
          >
            {label}
            {required && <FontText style={{ color: c.danger }}> *</FontText>}
            {optional && !required && <FontText style={{ color: c.textTertiary, fontWeight: typeStyle('caption').fontWeight }}> {m.optional}</FontText>}
          </FontText>
        )}
        {children}
        {!!shownHint && (
          <FontText
            nativeID={fieldId + "-hint"}
            style={{ fontFamily, ...typeStyle('caption'), marginTop: tokens.extensions.form.messageGap, color: c.textSecondary }}
          >
            {shownHint}
          </FontText>
        )}
        {/* Text only, like Input's errorMessage: the danger colour and the field border carry the state. */}
        {!!error && (
          <FontText
            nativeID={fieldId + "-error"}
            accessibilityRole="alert"
            style={{ fontFamily, ...typeStyle('caption'), marginTop: tokens.extensions.form.messageGap, color: c.danger }}
          >
            {error}
          </FontText>
        )}
      </View>
    </FieldContext.Provider>
  );
}
export interface KjunInputProps
  extends Omit<TextInputProps, "value" | "onChange"> {
  value: string | number;
  size?: InputSize;
  /** "plain" drops the surface, side border and side inset for text edited in place, such as a document title. */
  variant?: InputVariant;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  /** With secureTextEntry, a 보기/숨기기 button at the end shows the typed password as text and hides it again. */
  revealable?: boolean;
  /** Shows the character count at the end of the field, as "length/maxLength" when maxLength is set; a longer value reads as an error. */
  showCount?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  ariaLabel?: string;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}
// The annotation keeps the handle type by name in the declarations; an inferred type would print the resolved TextInput.
export const KjunInput: ForwardRefExoticComponent<KjunInputProps & RefAttributes<KjunTextInputHandle>> = forwardRef<KjunTextInputHandle, KjunInputProps>(function KjunInput(
  {
    value,
    size = "md",
    variant = "default",
    error = false,
    errorMessage = "",
    disabled = false,
    clearable = false,
    revealable = false,
    showCount = false,
    prefixIcon,
    suffixIcon,
    prefix,
    suffix,
    ariaLabel,
    onClear,
    onChangeText,
    containerStyle,
    style,
    editable = true,
    readOnly,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const m = useKjunMessages();
  const { colors: c, fontFamily } = useKjunStyles();
  const field = useContext(FieldContext);
  const input = useRef<TextInput | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || !props.autoFocus) return;
    // Retained window portals attach after the input mounts. Focus once attached,
    // after the platform window has installed its focus trap.
    const frame = requestAnimationFrame(() => {
      const node = input.current as unknown as HTMLElement | null;
      if (node?.isConnected && !node.closest('[inert], [aria-hidden="true"]')) node.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [props.autoFocus]);
  const ownErrorId = "kjun-native-input-error-" + useId().replace(/:/g, "");
  const showError = !!errorMessage && !field?.error;
  // A caller's description (NumberInput's reading aid) comes first, as on Web.
  const describedBy = mergeIds((props as { "aria-describedby"?: string })["aria-describedby"], field?.describedBy, showError ? ownErrorId : undefined);
  const spec = tokens.input[size], edge = inputEdge(variant, spec.padding);
  const count = inputCount(value, props.maxLength);
  const invalid = !!(error || errorMessage || field?.error || count.over);
  const canEdit = !disabled && !readOnly && editable;
  const [revealed, setRevealed] = useState(false);
  const reveal = inputReveal(props.secureTextEntry ? "password" : undefined, revealable, revealed);
  const surface = useFieldSurface(size, { disabled, readOnly: !!readOnly || !editable, invalid, open: props["aria-expanded"] === true, plain: variant === "plain" });
  // String affixes are text, which React Native only draws inside Text.
  const affixText = { ...inputTypeStyle(size), color: surface.icon };
  const showClear = inputShowsClear({ clearable, value, disabled, readOnly: !canEdit });
  const hasAfter = !!(showClear || suffix || suffixIcon || showCount || reveal.active);
  const [prefixWidth, setPrefixWidth] = useState(0);
  const [affixWidth, setAffixWidth] = useState(0);
  const suffixWidth =
    (showClear ? tokens.native.minimumTouchTarget : 0) +
    (suffixIcon ? spec.iconSize + (showClear ? tokens.extensions.form.affixItemGap : 0) : 0);
  return (
    <View style={containerStyle}>
      <View style={{ position: "relative", minWidth: 0, minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }} {...fieldTarget(() => input.current?.focus(), disabled)}>
        <FieldTextInput
          {...props}
          {...surface.webHover}
          ref={(el) => {
            input.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          nativeID={props.nativeID || field?.id}
          value={String(value)}
          secureTextEntry={!!props.secureTextEntry && !(reveal.active && revealed)}
          editable={canEdit}
          readOnly={readOnly}
          accessibilityLabel={
            ariaLabel || props.accessibilityLabel || field?.label
          }
          accessibilityLabelledBy={
            field?.label && !field.labelHidden ? field.id + "-label" : undefined
          }
          accessibilityHint={joinHints(props.accessibilityHint, field?.hint, errorMessage || field?.error, showCount ? count.text : undefined)}
          accessibilityState={{ disabled }}
          {...(Platform.OS === "web"
            ? {
                // Native Web TextInput does not translate accessibilityState.
                // aria-disabled also supplies the native input disabled attribute.
                "aria-disabled": disabled,
                "aria-required": field?.required || undefined,
                "aria-invalid": invalid,
                "aria-describedby": describedBy,
              }
            : {})}
          placeholderTextColor={disabled ? c.textDisabled : c.inputPlaceholder}
          onChangeText={onChangeText}
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
              ...surface.style,
              minWidth: 0,
              width: "100%",
              color: surface.ink,
              fontFamily,
              ...inputTypeStyle(size),
              paddingVertical: 0,
              paddingLeft:
                prefix || prefixIcon
                  ? edge.padding + (prefixWidth || spec.iconSize) + spec.affixGap - edge.border
                  : edge.padding - edge.border,
              paddingRight:
                hasAfter
                  ? edge.padding + (affixWidth || suffixWidth) + spec.affixGap - edge.border
                  : edge.padding - edge.border,
            },
            style,
          ]}
        />
        {!!(prefix || prefixIcon) && (
          <View
            onLayout={(event) => setPrefixWidth(event.nativeEvent.layout.width)}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: edge.padding,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            {prefix ? content(prefix, affixText) : (
              <KjunIcon
                name={prefixIcon!}
                size={spec.iconSize}
                color={surface.icon}
              />
            )}
          </View>
        )}
        {hasAfter && (
          <View
            onLayout={(event) => setAffixWidth(event.nativeEvent.layout.width)}
            style={{
              position: "absolute",
              right: edge.padding,
              top: 0,
              bottom: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.extensions.form.affixItemGap,
            }}
          >
            {showCount && <FontText aria-hidden={true} style={{ fontFamily, ...typeStyle("caption"), fontVariant: ["tabular-nums"],
              color: disabled ? c.textDisabled : count.over ? c.danger : c.textTertiary, ...(count.over ? { fontWeight: typeStyle("control").fontWeight } : {}) }}>{count.text}</FontText>}
            {showClear && (
              <FieldClear size={size} label={m.clearInput} onPress={() => {
                if (!canEdit) return;
                onChangeText?.("");
                onClear?.();
                input.current?.focus();
              }} />
            )}
            {reveal.active && (
              <FieldReveal size={size} disabled={disabled} revealed={revealed} show={m.revealPassword} hide={m.concealPassword}
                label={revealed ? m.concealPasswordLabel : m.revealPasswordLabel} onPress={() => setRevealed(current => !current)} />
            )}
            {suffix ? content(suffix, affixText) : !!suffixIcon && (
              <KjunIcon
                name={suffixIcon}
                size={spec.iconSize}
                color={surface.icon}
              />
            )}
          </View>
        )}
      </View>
      {showError && (
        <FontText
          nativeID={ownErrorId}
          accessibilityRole="alert"
          style={{
            fontFamily,
            marginTop: tokens.extensions.form.messageGap,
            ...typeStyle('caption'),

            color: c.danger,
          }}
        >
          {errorMessage}
        </FontText>
      )}
    </View>
  );
});

export function KjunFormLayout({
  children,
  gap = tokens.extensions.form.itemGap,
}: {
  children: ReactNode;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Children.map(children, (child) =>
        isValidElement<KjunFormGroupProps>(child) && child.type === KjunFormGroup
          ? cloneElement(child, {
              style: [{ marginBottom: 0 }, child.props.style],
            })
          : child
      )}
    </View>
  );
}
