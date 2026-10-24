import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { formatDateValue } from "../../../shared/package-runtime/messages";
import { typeStyle, inputTypeStyle } from "./typography";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import {
useState,
type InputHTMLAttributes
} from "react";
import { KjunInput } from "./input";
import { KjunButton, KjunIcon } from "./button";

export interface KjunDatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value"> {
  value: string;
  size?: InputSize;
  /** Shows a clear button while there is a value; it reports an empty string. */
  clearable?: boolean;
  ariaLabel?: string;
  error?: boolean;
  onValueChange?: (v: string) => void;
}
export function KjunDatePicker({
  value,
  size = "md",
  clearable = false,
  placeholder,
  ariaLabel,
  error,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: KjunDatePickerProps) {
  const scope = useKjunMessageScope();
  placeholder ??= scope.messages.datePlaceholder;
  const [focus, setFocus] = useState(false);
  const clear = clearable && !!value && !props.disabled && !props.readOnly;
  return (
    // The drawn calendar icon matches Native; the transparent browser indicator sits on top of it
    // (sized by these variables) so clicking the icon still opens the browser picker.
    <div className="kjun-date-picker" style={{
      position: "relative",
      ["--_kjun-date-icon-inset" as string]: tokens.input[size].padding + "px",
      ["--_kjun-date-icon-size" as string]: tokens.input[size].iconSize + "px",
    }}>
      <KjunInput
        {...props}
        value={value}
        size={size}
        type="date"
        suffixIcon="calendar"
        ariaLabel={ariaLabel || placeholder}
        error={error}
        className={!focus ? "kjun-date-masked" : ""}
        onValueChange={onValueChange}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
      />
      {!focus && (
        <span
          aria-hidden="true"
          className="kjun-date-overlay"
          style={{
            left: tokens.input[size].padding,
            right: tokens.input[size].padding + tokens.input[size].iconSize + tokens.input[size].affixGap + (clear ? tokens.input[size].clearSize + tokens.input[size].affixGap : 0),
            ...inputTypeStyle(size),
            color: props.disabled
              ? "var(--_kjun-color-text-disabled)"
              : props.readOnly
              ? "var(--_kjun-color-text-secondary)"
              : value
              ? "var(--_kjun-color-text)"
              : "var(--_kjun-color-input-placeholder)",
          }}
        >
          {value ? formatDateValue(value, scope) : placeholder}
        </span>
      )}
      {clear && (
        <KjunButton size="sm" variant="ghost" ariaLabel={scope.messages.clearDate} className="kjun-select-clear"
          style={{ padding: 0, right: tokens.input[size].padding + tokens.input[size].iconSize + tokens.input[size].affixGap,
            width: tokens.input[size].clearSize, height: tokens.input[size].clearSize, minHeight: tokens.input[size].clearSize, borderRadius: "50%" }}
          onClick={() => onValueChange?.("")}><KjunIcon name="x" size={tokens.input[size].iconSize} /></KjunButton>
      )}
    </div>
  );
}
