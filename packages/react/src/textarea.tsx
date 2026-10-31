import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { textareaBounds, textareaCount, textareaMaxRows } from "../../../shared/package-runtime/textarea";
import { growTextarea } from "../../../shared/package-runtime/textarea-grow";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { forwardRef, useCallback, useId, useLayoutEffect, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { KjunButton } from "./button";
import { useKjunField } from "./input";
export interface KjunTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "value" | "onSubmit"> {
  value: string;
  size?: InputSize;
  error?: boolean;
  /** Manual resizing; the field already grows with its text (default "none"). */
  resize?: "none" | "vertical" | "horizontal" | "both";
  ariaLabel?: string;
  /** The field grows with its text from rows up to maxRows, then scrolls (default 6; rows keeps it fixed). */
  maxRows?: number;
  /** Character limit (UTF-16 units, like the attribute); the count shows "length/maxLength" and a longer value reads as an error. */
  maxLength?: number;
  /** Shows the character count inside the field, as "length/maxLength" when maxLength is set. */
  showCount?: boolean;
  /** Composer: controls at the start of the bar inside the field (attach, mention). */
  actions?: ReactNode;
  /** Composer: shows a submit button at the end of the bar, named by this label. */
  submitLabel?: string;
  /** The submit button, or Ctrl/⌘+Enter, while there is text within maxLength. */
  onSubmit?: (value: string) => void;
  onValueChange?: (value: string) => void;
}
export const KjunTextarea = forwardRef<HTMLTextAreaElement, KjunTextareaProps>(
  function KjunTextarea(
    {
      value,
      size = "md",
      error = false,
      resize = "none",
      rows = 3,
      maxRows = textareaMaxRows,
      showCount = false,
      actions,
      submitLabel,
      ariaLabel,
      onSubmit,
      onValueChange,
      onChange,
      onKeyDown,
      className = "",
      style,
      ...props
    },
    ref
  ) {
    const field = useKjunField();
    const spec = tokens.input[size];
    const countId = "kjun-count-" + useId();
    const element = useRef<HTMLTextAreaElement | null>(null);
    const setRef = useCallback((node: HTMLTextAreaElement | null) => {
      element.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }, [ref]);
    const footer = showCount || actions != null || submitLabel != null;
    const [minimum, maximum] = textareaBounds(size, rows, maxRows, footer);
    const grows = maximum > minimum;
    // Apps sometimes leave a field uncontrolled at first; count and submit treat that as empty.
    const count = textareaCount(value ?? "", props.maxLength);
    const invalid = error || !!field?.error || count.over;
    const blocked = !!props.disabled || !!props.readOnly;
    const canSubmit = submitLabel != null && !blocked && !!value?.trim() && !count.over;
    // Growth follows the text and the width it wraps in.
    useLayoutEffect(() => { if (grows) growTextarea(element.current, minimum, maximum); }, [value, grows, minimum, maximum]);
    useLayoutEffect(() => {
      const node = element.current;
      if (!grows || !node || typeof ResizeObserver === "undefined") return;
      let width = node.clientWidth;
      const observer = new ResizeObserver(() => { if (node.clientWidth !== width) { width = node.clientWidth; growTextarea(node, minimum, maximum); } });
      observer.observe(node);
      return () => observer.disconnect();
    }, [grows, minimum, maximum]);
    const textarea = (
      <textarea
        {...props}
        ref={setRef}
        id={props.id || field?.id}
        value={value}
        rows={rows}
        required={props.required ?? field?.required}
        aria-label={ariaLabel || props["aria-label"]}
        aria-labelledby={props["aria-labelledby"] || field?.labelId}
        aria-describedby={mergeIds(props["aria-describedby"], field?.describedBy, showCount ? countId : undefined)}
        aria-invalid={invalid || undefined}
        data-grow={grows || undefined}
        className={"kjun-input kjun-textarea " + className}
        style={{
          fontSize: spec.fontSize / 16 + "rem",
          lineHeight: spec.lineHeight / 16 + "rem",
          // With a footer the wrapper carries the border, so the text keeps the field's own inset.
          padding: footer
            ? `${spec.textareaPaddingY}px ${spec.padding}px ${tokens.extensions.textarea.footerTextGap}px`
            : `${spec.textareaPaddingY}px ${spec.padding - tokens.border.controlWidth}px`,
          minHeight: minimum,
          ...(grows ? { height: minimum } : {}),
          borderRadius: footer ? 0 : spec.radius,
          resize,
          ...style,
        }}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && canSubmit && event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onSubmit?.(value);
          }
        }}
      />
    );
    if (!footer) return textarea;
    return (
      <div className="kjun-textarea-field" data-invalid={invalid || undefined} data-disabled={props.disabled || undefined} data-readonly={props.readOnly || undefined} style={{ borderRadius: spec.radius }}>
        {textarea}
        <div className="kjun-textarea-footer">
          {actions}
          {showCount && <span id={countId} className="kjun-textarea-count" data-over={count.over || undefined}>{count.text}</span>}
          {submitLabel != null && <KjunButton className="kjun-textarea-submit" size="sm" prefixIcon="arrow-up" ariaLabel={submitLabel} disabled={!canSubmit} onClick={() => onSubmit?.(value)} />}
        </div>
      </div>
    );
  }
);
