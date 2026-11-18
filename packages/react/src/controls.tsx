import { typeStyle, selectionTypeStyle } from "./typography";
import { tokens,type ButtonSize } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunTooltip } from "./popover";
import { useSelectionIndicator } from "./use-selection-indicator";
import { groupKeydown } from "../../../shared/package-runtime/group-keyboard";
export * from "./choice-controls";
import type { ChoiceOption, ChoiceValue } from "./choice-controls";
export { KjunTextarea } from "./textarea";
export type { KjunTextareaProps } from "./textarea";
export { groupKeydown };
export interface KjunButtonGroupProps {
  value: ChoiceValue;
  options: ChoiceOption[];
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunButtonGroup({
  value,
  options,
  size = "md",
  disabled = false,
  fullWidth = false,
  ariaLabel,
  onValueChange,
  onChange,
}: KjunButtonGroupProps) {
  const { group, indicator } = useSelectionIndicator();
  return (
    <div
      ref={group}
      role="group"
      aria-label={ariaLabel}
      className="kjun-button-group"
      onKeyDown={groupKeydown}
      style={{
        height: tokens.buttonGroup.heights[size],
        padding: tokens.buttonGroup.padding[size],
        borderRadius: tokens.buttonGroup.radii[size],
        width: fullWidth ? "100%" : "fit-content",
      }}
    >
      <span ref={indicator} className="kjun-button-group-indicator" aria-hidden="true" hidden
        style={{ borderRadius: tokens.buttonGroup.itemRadii[size] }} />
      {options.map((option) => {
        const iconOnly = !!(option.iconOnly && option.icon), blocked = disabled || option.disabled;
        const segment = (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={value === option.value}
            aria-label={iconOnly ? option.label : undefined}
            disabled={blocked}
            style={{
              flex: fullWidth ? 1 : undefined,
              // An icon-only segment is square: as wide as the segment is tall.
              width: iconOnly && !fullWidth ? tokens.buttonGroup.heights[size] - 2 * tokens.buttonGroup.padding[size] : undefined,
              paddingInline: iconOnly ? 0 : tokens.buttonGroup.itemPaddingX[size],
              borderRadius: tokens.buttonGroup.itemRadii[size],
              ...selectionTypeStyle(size, value === option.value),
            }}
            onClick={() => {
              onValueChange?.(option.value);
              onChange?.(option.value);
            }}
          >
            {option.icon && <KjunIcon name={option.icon} size={tokens.button.iconSizes[size]} />}
            {!iconOnly && <span className="kjun-button-group-label">
              <span aria-hidden="true" style={typeStyle(tokens.button.typography[size])}>{option.label}</span><span>{option.label}</span>
            </span>}
          </button>
        );
        return iconOnly
          ? <KjunTooltip key={String(option.value)} content={blocked ? "" : option.label}>{segment}</KjunTooltip>
          : segment;
      })}
    </div>
  );
}
export interface KjunFilterGroupProps
  extends Omit<
    KjunButtonGroupProps,
    "value" | "onValueChange" | "onChange" | "fullWidth"
  > {
  value: ChoiceValue | ChoiceValue[];
  multiple?: boolean;
  scroll?: boolean;
  /** Extra class on the group root, for placement in the page layout. */
  className?: string;
  onValueChange?: (value: ChoiceValue | ChoiceValue[]) => void;
  onChange?: (value: ChoiceValue | ChoiceValue[]) => void;
}
export function KjunFilterGroup({
  value,
  options,
  size = "sm",
  disabled = false,
  multiple = false,
  scroll = false,
  ariaLabel,
  className,
  onValueChange,
  onChange,
}: KjunFilterGroupProps) {
  const selected = (v: ChoiceValue) =>
    multiple
      ? Array.isArray(value) &&
        (v === null ? value.length === 0 : value.includes(v))
      : value === v;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className ? "kjun-filter-group " + className : "kjun-filter-group"}
      data-scroll={scroll}
      onKeyDown={groupKeydown}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className="kjun-filter-chip"
          // Corners follow the button scale with the height, so every size keeps the same shape.
          style={{ borderRadius: tokens.button.radii[size] }}
          aria-pressed={selected(option.value)}
          disabled={disabled || option.disabled}
          onClick={() => {
            const next = multiple
              ? option.value === null
                ? []
                : Array.isArray(value) && value.includes(option.value)
                ? value.filter((v) => v !== option.value)
                : [...(Array.isArray(value) ? value : []), option.value]
              : option.value;
            onValueChange?.(next);
            onChange?.(next);
          }}
        >
          <span
            style={{
              height: tokens.button.heights[size],
              paddingInline: { xs: tokens.dimension.value8, sm: tokens.dimension.value12, md: tokens.dimension.value12, lg: tokens.dimension.value14, xl: tokens.dimension.value16 }[size],
              ...selectionTypeStyle(size, selected(option.value)),
            }}
          >
            {option.dot && <i style={{ background: option.dot }} />}
            {option.icon && <KjunIcon name={option.icon} size={tokens.extensions.selection.iconSize} />}
            <span className="kjun-filter-label">
              <span aria-hidden="true" style={typeStyle(tokens.button.typography[size])}>{option.label}</span>
              <span>{option.label}</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
