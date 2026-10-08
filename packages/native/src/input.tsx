import { FieldClear } from "./field-clear";
import { FieldTextInput, fieldTarget, useFieldSurface } from "./field-surface";
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
import { DsIcon } from "./button";
import { useKjunStyles } from "./provider";
interface FieldValue {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  describedBy?: string;
}
// Internal boundary for composite fields; index.ts exports only public controls.
export const FieldContext = createContext<FieldValue | null>(null);
export const useKjunField = () => useContext(FieldContext);
export interface DsFormGroupProps {
  label?: string;
  id?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function DsFormGroup({
  label,
  id,
  required = false,
  error = "",
  hint = "",
  children,
  style,
}: DsFormGroupProps) {
  const uid = useId().replace(/:/g, "");
  const fieldId = id || "kjun-native-" + uid;
  const { colors: c, fontFamily } = useKjunStyles();
  return (
    <FieldContext.Provider
      value={{ id: fieldId, label, error, hint, required, describedBy: error ? fieldId + "-error" : hint ? fieldId + "-hint" : undefined }}
    >
      <View style={[{ minWidth: 0, marginBottom: tokens.extensions.form.itemGap }, style]}>
        {label && (
          <Text
            nativeID={fieldId + "-label"}
            style={{
              fontFamily,
              ...typeStyle('label'),


              color: c.text,
              marginBottom: tokens.extensions.form.labelGap,
            }}
          >
            {label}
            {required && <Text style={{ color: c.danger }}> *</Text>}
          </Text>
        )}
        {children}
        {(error || hint) && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.extensions.form.messageGap,
              marginTop: tokens.extensions.form.messageGap,
            }}
          >
            {!!error && <DsIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} color={c.danger} />}
            <Text
              nativeID={fieldId + (error ? "-error" : "-hint")}
              accessibilityRole={error ? "alert" : undefined}
              style={{
                fontFamily,
                ...typeStyle('caption'),
                flexShrink: 1,
                color: error ? c.danger : c.textSecondary,
              }}
            >
              {error || hint}
            </Text>
          </View>
        )}
      </View>
    </FieldContext.Provider>
  );
}
export interface DsInputProps
  extends Omit<TextInputProps, "value" | "onChange"> {
  value: string | number;
  size?: InputSize;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  ariaLabel?: string;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}
export const DsInput = forwardRef<TextInput, DsInputProps>(function DsInput(
  {
    value,
    size = "md",
    error = false,
    errorMessage = "",
    disabled = false,
    clearable = false,
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
  const describedBy = [field?.describedBy, showError ? ownErrorId : undefined]
    .filter(Boolean).join(" ") || undefined;
  const spec = tokens.input[size];
  const invalid = !!(error || errorMessage || field?.error);
  const canEdit = !disabled && !readOnly && editable;
  const surface = useFieldSurface(size, { disabled, readOnly: !!readOnly || !editable, invalid, open: props["aria-expanded"] === true });
  const showClear = clearable && !!value;
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
          editable={canEdit}
          readOnly={readOnly}
          accessibilityLabel={
            ariaLabel || props.accessibilityLabel || field?.label
          }
          accessibilityLabelledBy={
            field?.label ? field.id + "-label" : undefined
          }
          accessibilityHint={
            errorMessage ||
            field?.error ||
            field?.hint ||
            props.accessibilityHint
          }
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
                  ? spec.padding + (prefixWidth || spec.iconSize) + spec.affixGap - tokens.border.controlWidth
                  : spec.padding - tokens.border.controlWidth,
              paddingRight:
                suffixWidth || suffix
                  ? spec.padding + (affixWidth || suffixWidth) + spec.affixGap - tokens.border.controlWidth
                  : spec.padding - tokens.border.controlWidth,
            },
            style,
          ]}
        />
        {(prefix || prefixIcon) && (
          <View
            onLayout={(event) => setPrefixWidth(event.nativeEvent.layout.width)}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: spec.padding,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            {prefix || (
              <DsIcon
                name={prefixIcon!}
                size={spec.iconSize}
                color={surface.icon}
              />
            )}
          </View>
        )}
        {(showClear || suffix || suffixIcon) && (
          <View
            onLayout={(event) => setAffixWidth(event.nativeEvent.layout.width)}
            style={{
              position: "absolute",
              right: spec.padding,
              top: 0,
              bottom: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.extensions.form.affixItemGap,
            }}
          >
            {showClear && (
              <FieldClear size={size} label="입력 지우기" disabled={!canEdit} onPress={() => {
                if (!canEdit) return;
                onChangeText?.("");
                onClear?.();
                input.current?.focus();
              }} />
            )}
            {suffix ||
              (suffixIcon && (
                <DsIcon
                  name={suffixIcon}
                  size={spec.iconSize}
                  color={surface.icon}
                />
              ))}
          </View>
        )}
      </View>
      {showError && (
        <Text
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
        </Text>
      )}
    </View>
  );
});

export function DsFormLayout({
  children,
  gap = tokens.extensions.form.itemGap,
}: {
  children: ReactNode;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Children.map(children, (child) =>
        isValidElement<DsFormGroupProps>(child) && child.type === DsFormGroup
          ? cloneElement(child, {
              style: [{ marginBottom: 0 }, child.props.style],
            })
          : child
      )}
    </View>
  );
}
