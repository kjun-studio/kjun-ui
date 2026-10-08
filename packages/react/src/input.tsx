import { tokens,type InputSize } from "@kjun-ui/tokens";
import {
createContext,
forwardRef,
useContext,
useId,
useImperativeHandle,
useLayoutEffect,
useRef,
useState,
type CSSProperties,
type InputHTMLAttributes,
type ReactNode,
} from "react";
import { DsButton,DsIcon } from "./button";
import { useCompositionGuard } from "./composition";
interface FieldContextValue {
  id: string;
  labelId?: string;
  describedBy?: string;
  error?: string;
  required?: boolean;
}
// Internal boundary for composite fields; index.ts exports only public controls.
export const FieldContext = createContext<FieldContextValue | null>(null);
export const useKjunField = () => useContext(FieldContext);
export interface DsFormGroupProps {
  label?: string;
  id?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}
export function DsFormGroup({
  label,
  id,
  required = false,
  error = "",
  hint = "",
  children,
}: DsFormGroupProps) {
  const uid = useId().replace(/:/g, "");
  const fieldId = id || "kjun-field-" + uid;
  const labelId = label ? fieldId + "-label" : undefined;
  const describedBy = error
    ? fieldId + "-error"
    : hint
    ? fieldId + "-hint"
    : undefined;
  return (
    <FieldContext.Provider
      value={{ id: fieldId, labelId, describedBy, error, required }}
    >
      <div className="kjun-form-group">
        {label && (
          <label className="kjun-form-label" id={labelId} htmlFor={fieldId}>
            {label}
            {required && (
              <span style={{ color: "var(--_kjun-color-danger)" }}> *</span>
            )}
          </label>
        )}
        {children}
        {error ? (
          <p id={describedBy} className="kjun-form-error" role="alert">
            <DsIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} />
            {error}
          </p>
        ) : hint ? (
          <p id={describedBy} className="kjun-form-hint">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
export interface DsInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "prefix" | "value" | "defaultValue"
  > {
  size?: InputSize;
  value: string | number;
  error?: boolean;
  errorMessage?: string;
  clearable?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  ariaLabel?: string;
  onClear?: () => void;
  onValueChange?: (value: string) => void;
  onEnter?: () => void;
}
export const DsInput = forwardRef<HTMLInputElement, DsInputProps>(
  function DsInput(
    {
      size = "md",
      value,
      error = false,
      errorMessage = "",
      clearable = false,
      prefixIcon,
      suffixIcon,
      prefix,
      suffix,
      ariaLabel,
      onClear,
      onValueChange,
      onChange,
      onKeyDown,
      onCompositionStart,
      onCompositionEnd,
      onEnter,
      className = "",
      style,
      disabled,
      readOnly,
      id,
      required,
      ...props
    },
    ref
  ) {
    const field = useContext(FieldContext);
    const uid = useId().replace(/:/g, "");
    const input = useRef<HTMLInputElement>(null);
    const composition = useCompositionGuard();
    const before = useRef<HTMLSpanElement>(null);
    const after = useRef<HTMLSpanElement>(null);
    useImperativeHandle(ref, () => input.current!);
    const [widths, setWidths] = useState({ before: 0, after: 0 });
    useLayoutEffect(() => {
      const measure = () =>
        setWidths({
          before: before.current?.getBoundingClientRect().width || 0,
          after: after.current?.getBoundingClientRect().width || 0,
        });
      measure();
      const observer = new ResizeObserver(measure);
      if (before.current) observer.observe(before.current);
      if (after.current) observer.observe(after.current);
      return () => observer.disconnect();
    }, [prefix, suffix, prefixIcon, suffixIcon, clearable, value]);
    const spec = tokens.input[size];
    const showError = !!errorMessage && !field?.error;
    const invalid = !!(error || errorMessage || field?.error);
    const ownErrorId = "kjun-input-error-" + uid;
    const describedBy =
      [
        props["aria-describedby"],
        field?.describedBy,
        showError ? ownErrorId : undefined,
      ]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <div style={{ minWidth: 0 }}>
        <div className="kjun-input-wrap" data-disabled={disabled || undefined}>
          {(prefix || prefixIcon) && (
            <span
              ref={before}
              className="kjun-input-affix"
              style={{ left: spec.padding, pointerEvents: "none" }}
            >
              {prefix || <DsIcon name={prefixIcon!} size={spec.iconSize} />}
            </span>
          )}
          <input
            {...props}
            ref={input}
            id={id || field?.id}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            required={required ?? field?.required}
            className={"kjun-input " + className}
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel || props["aria-label"]}
            aria-labelledby={props["aria-labelledby"] || field?.labelId}
            aria-describedby={describedBy}
            style={
              {
                height: spec.height,
                fontSize: spec.fontSize / 16 + "rem",
                lineHeight: spec.lineHeight / 16 + "rem",
                borderRadius: spec.radius,
                paddingLeft: widths.before
                  ? spec.padding + widths.before + spec.affixGap - tokens.border.controlWidth
                  : spec.padding - tokens.border.controlWidth,
                paddingRight: widths.after
                  ? spec.padding + widths.after + spec.affixGap - tokens.border.controlWidth
                  : spec.padding - tokens.border.controlWidth,
                "--placeholder-size": spec.placeholderSize / 16 + "rem",
                ...style,
              } as CSSProperties
            }
            onChange={(e) => {
              onChange?.(e);
              onValueChange?.(e.target.value);
            }}
            onKeyDown={(e) => {
              onKeyDown?.(e);
              if (e.key === "Enter" && !e.defaultPrevented && !composition.isComposing(e))
                onEnter?.();
            }}
            onCompositionStart={(e) => {
              composition.onCompositionStart();
              onCompositionStart?.(e);
            }}
            onCompositionEnd={(e) => {
              composition.onCompositionEnd();
              onCompositionEnd?.(e);
            }}
          />
          {(suffix || suffixIcon || clearable) && (
            <span
              ref={after}
              className="kjun-input-affix"
              style={{ right: spec.padding }}
            >
              {clearable && !!value && (
                <DsButton
                  variant="ghost"
                  size="sm"

                  ariaLabel="입력 지우기"
                  disabled={disabled || readOnly}
                  style={{
                    padding: 0,
                    height: spec.clearSize,
                    minHeight: spec.clearSize,
                    width: spec.clearSize,
                    borderRadius: "50%",
                  }}
                  onClick={() => {
                    const el = input.current;
                    if (!el || disabled || readOnly) return;
                    // React의 제어형 입력 추적기를 거쳐 일반 입력과 동일한 onChange를 발생시킨다.
                    const setter = Object.getOwnPropertyDescriptor(
                      HTMLInputElement.prototype,
                      "value"
                    )?.set;
                    setter?.call(el, "");
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    onClear?.();
                    el.focus();
                  }}
                ><DsIcon name="x" size={spec.iconSize} /></DsButton>
              )}
              {suffix ||
                (suffixIcon && (
                  <DsIcon name={suffixIcon} size={spec.iconSize} />
                ))}
            </span>
          )}
        </div>
        {showError && (
          <p className="kjun-form-error" id={ownErrorId} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
