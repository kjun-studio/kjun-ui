import { typeStyle, inputTypeStyle } from "./typography";
import { tokens,type InputSize } from "@kjun/tokens";
import {
useState,
type InputHTMLAttributes
} from "react";
import { DsInput } from "./input";

export interface DsDatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value"> {
  value: string;
  size?: InputSize;
  ariaLabel?: string;
  error?: boolean;
  onValueChange?: (v: string) => void;
}
export function DsDatePicker({
  value,
  size = "md",
  placeholder = "날짜 선택",
  ariaLabel,
  error,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: DsDatePickerProps) {
  const [focus, setFocus] = useState(false);
  return (
    // The drawn calendar icon matches Native; the transparent browser indicator sits on top of it
    // (sized by these variables) so clicking the icon still opens the browser picker.
    <div className="kjun-date-picker" style={{
      position: "relative",
      ["--_kjun-date-icon-inset" as string]: tokens.input[size].padding + "px",
      ["--_kjun-date-icon-size" as string]: tokens.input[size].iconSize + "px",
    }}>
      <DsInput
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
            right: tokens.input[size].padding + tokens.input[size].iconSize + tokens.input[size].affixGap,
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
          {value ? value.replace(/-/g, ". ") + "." : placeholder}
        </span>
      )}
    </div>
  );
}
