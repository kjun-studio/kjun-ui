import { forwardRef, type InputHTMLAttributes } from "react";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
/** A native checkbox (role, indeterminate, row click isolation) drawn like KjunCheckbox sm. */
export const TableCheck = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(
  function TableCheck(props, ref) {
    const size = tokens.extensions.checkbox.iconSizes.sm;
    return (
      <IconFallbacks icons={componentIcons}>
        <span className="kjun-table-check">
          <input {...props} ref={ref} type="checkbox" />
          <KjunIcon name="check" size={size} className="kjun-table-check-mark" />
          <KjunIcon name="minus" size={size} className="kjun-table-check-dash" />
        </span>
      </IconFallbacks>
    );
  },
);
