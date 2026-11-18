import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { inputEdge, type InputVariant } from "../../../shared/package-runtime/input-variant";
import { inputCount, inputReveal, inputShowsClear } from "../../../shared/package-runtime/input-field";
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
import { KjunButton,KjunIcon } from "./button";
import { useCompositionGuard } from "./composition";
interface FieldContextValue {
  id: string;
  labelId?: string;
  describedBy?: string;
  error?: string;
  required?: boolean;
  /** A control with its own id registers it so the group label points at it. */
  setControlId?: (id: string | undefined) => void;
  /** A control's own message (NumberInput's range) shown in the group's error slot; "" clears it. The group's error wins. */
  reportError?: (owner: string, message: string) => void;
}
// Internal boundary for composite fields; index.ts exports only public controls.
export const FieldContext = createContext<FieldContextValue | null>(null);
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
  /** Content at the end of the label row: a character count, or a small action such as "전액". Stays put when an error shows. */
  labelEnd?: ReactNode;
  /** Extra class on the group root, for placement in the page layout. */
  className?: string;
  children: ReactNode;
}
export function KjunFormGroup({
  label,
  id,
  required = false,
  optional = false,
  error = "",
  hint = "",
  labelHidden = false,
  labelEnd,
  className,
  children,
}: KjunFormGroupProps) {
  const m = useKjunMessages();
  const uid = useId().replace(/:/g, "");
  const fieldId = id || "kjun-field-" + uid;
  const labelId = label ? fieldId + "-label" : undefined;
  const [controlErrors, setControlErrors] = useState<Record<string, string>>({});
  const [reportError] = useState(() => (owner: string, message: string) =>
    setControlErrors(old => (old[owner] ?? "") === message ? old : { ...old, [owner]: message }));
  // An error takes the hint's slot instead of stacking under it, so the field keeps its height; the control is then
  // described by the error alone.
  const shownError = error || Object.values(controlErrors).find(Boolean) || "";
  const shownHint = shownError ? "" : hint;
  const hintId = shownHint ? fieldId + "-hint" : undefined, errorId = shownError ? fieldId + "-error" : undefined;
  const describedBy = mergeIds(hintId, errorId);
  const [controlId, setControlId] = useState<string>();
  const labelNode = label && (
    <label className={"kjun-form-label" + (labelHidden ? " kjun-sr-only" : "")} id={labelId} htmlFor={controlId || fieldId}>
      {label}
      {/* The input's required state already says it; the star is only drawn. */}
      {required && <span className="kjun-form-required" aria-hidden="true"> *</span>}
      {optional && !required && <span className="kjun-form-optional"> {m.optional}</span>}
    </label>
  );
  return (
    <FieldContext.Provider
      value={{ id: fieldId, labelId, describedBy, error, required, setControlId, reportError }}
    >
      <div className={className ? "kjun-form-group " + className : "kjun-form-group"}>
        {labelEnd != null && labelEnd !== false ? (
          <div className="kjun-form-label-row">{labelNode}<span className="kjun-form-label-end">{labelEnd}</span></div>
        ) : labelNode}
        {children}
        {shownHint && (
          <p id={hintId} className="kjun-form-hint">
            {shownHint}
          </p>
        )}
        {shownError && (
          // Text only, like Input's errorMessage: the danger colour and the field border carry the state.
          <p id={errorId} className="kjun-form-error" role="alert">
            {shownError}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
export interface KjunInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "prefix" | "value" | "defaultValue"
  > {
  size?: InputSize;
  /** "plain" drops the surface, side border and side inset for text edited in place, such as a document title. */
  variant?: InputVariant;
  value: string | number;
  error?: boolean;
  errorMessage?: string;
  clearable?: boolean;
  /** With type="password", a 보기/숨기기 button at the end shows the typed password as text and hides it again. */
  revealable?: boolean;
  /** Shows the character count at the end of the field, as "length/maxLength" when maxLength is set; a longer value reads as an error. */
  showCount?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  ariaLabel?: string;
  onClear?: () => void;
  onValueChange?: (value: string) => void;
  onEnter?: () => void;
}
export const KjunInput = forwardRef<HTMLInputElement, KjunInputProps>(
  function KjunInput(
    {
      size = "md",
      variant = "default",
      value,
      error = false,
      errorMessage = "",
      clearable = false,
      revealable = false,
      showCount = false,
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
      type,
      ...props
    },
    ref
  ) {
    const m = useKjunMessages();
    const field = useContext(FieldContext);
    const uid = "kjun-" + useId().replace(/:/g, "");
    const input = useRef<HTMLInputElement>(null);
    const composition = useCompositionGuard();
    const before = useRef<HTMLSpanElement>(null);
    const after = useRef<HTMLSpanElement>(null);
    useImperativeHandle(ref, () => input.current!);
    const [revealed, setRevealed] = useState(false);
    const reveal = inputReveal(type, revealable, revealed);
    const showClear = inputShowsClear({ clearable, value, disabled, readOnly });
    const count = inputCount(value, props.maxLength);
    const hasBefore = !!(prefix || prefixIcon);
    const hasAfter = !!(suffix || suffixIcon || showClear || showCount || reveal.active);
    const [widths, setWidths] = useState({ before: 0, after: 0 });
    // One observer per affix element: it follows the affix as its content changes, not every keystroke.
    useLayoutEffect(() => {
      const measure = () => {
        const next = { before: before.current?.getBoundingClientRect().width || 0, after: after.current?.getBoundingClientRect().width || 0 };
        setWidths(current => current.before === next.before && current.after === next.after ? current : next);
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      if (before.current) observer.observe(before.current);
      if (after.current) observer.observe(after.current);
      return () => observer.disconnect();
    }, [hasBefore, hasAfter]);
    const spec = tokens.input[size], edge = inputEdge(variant, spec.padding);
    const showError = !!errorMessage && !field?.error;
    const invalid = !!(error || errorMessage || field?.error || count.over);
    const ownErrorId = "kjun-input-error-" + uid, countId = "kjun-input-count-" + uid;
    const controlId = id || field?.id;
    const describedBy = mergeIds(props["aria-describedby"], field?.describedBy, showError ? ownErrorId : undefined, showCount ? countId : undefined);
    return (
      <div style={{ minWidth: 0 }}>
        <div className="kjun-input-wrap" data-disabled={disabled || undefined}>
          {hasBefore && (
            <span
              ref={before}
              className="kjun-input-affix"
              style={{ left: edge.padding, pointerEvents: "none" }}
            >
              {prefix || <KjunIcon name={prefixIcon!} size={spec.iconSize} />}
            </span>
          )}
          <input
            {...props}
            ref={input}
            id={controlId}
            type={reveal.type}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            required={required ?? field?.required}
            className={"kjun-input " + className}
            data-variant={variant === "plain" ? "plain" : undefined}
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
                  ? edge.padding + widths.before + spec.affixGap - edge.border
                  : edge.padding - edge.border,
                paddingRight: widths.after
                  ? edge.padding + widths.after + spec.affixGap - edge.border
                  : edge.padding - edge.border,
                "--_kjun-placeholder-size": spec.placeholderSize / 16 + "rem",
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
          {hasAfter && (
            <span
              ref={after}
              className="kjun-input-affix"
              style={{ right: edge.padding }}
            >
              {showCount && <span id={countId} className="kjun-input-count" data-over={count.over || undefined}>{count.text}</span>}
              {/* Near the limit, what is left is announced as it changes; the count itself is read only on focus. */}
              {showCount && <span className="kjun-sr-only" aria-live="polite">{count.remaining == null ? "" : m.charactersLeft(count.remaining)}</span>}
              {showClear && (
                <KjunButton
                  variant="ghost"
                  size="sm"
                  ariaLabel={m.clearInput}
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
                ><KjunIcon name="x" size={spec.iconSize} /></KjunButton>
              )}
              {reveal.active && (
                <KjunButton
                  variant="ghost"
                  size="sm"
                  className="kjun-input-reveal"
                  ariaLabel={revealed ? m.concealPasswordLabel : m.revealPasswordLabel}
                  aria-controls={controlId}
                  disabled={disabled}
                  style={{ height: spec.clearSize, minHeight: spec.clearSize, paddingInline: tokens.space.inline.sm }}
                  onClick={() => setRevealed(value => !value)}
                >
                  {/* Both words share one cell, so the button keeps the wider word's width as it toggles. */}
                  <span className="kjun-input-reveal-label" aria-hidden="true">
                    <span data-hidden={revealed || undefined}>{m.revealPassword}</span>
                    <span data-hidden={!revealed || undefined}>{m.concealPassword}</span>
                  </span>
                </KjunButton>
              )}
              {suffix ||
                (suffixIcon && (
                  <KjunIcon name={suffixIcon} size={spec.iconSize} />
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
