import { forwardRef, type InputHTMLAttributes } from "react";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { tokens } from "@kjun/tokens";
import { DsIcon } from "./button";
/** A native checkbox (role, indeterminate, row click isolation) drawn like DsCheckbox sm. */
export const TableCheck = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(
  function TableCheck(props, ref) {
    const size = tokens.extensions.checkbox.iconSizes.sm;
    return (
      <IconFallbacks icons={componentIcons}>
        <span className="kjun-table-check">
          <input {...props} ref={ref} type="checkbox" />
          <DsIcon name="check" size={size} className="kjun-table-check-mark" />
          <DsIcon name="minus" size={size} className="kjun-table-check-dash" />
        </span>
      </IconFallbacks>
    );
  },
);
