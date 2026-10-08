import { typeStyle, selectionTypeStyle } from "./typography";
import { tokens,type ButtonSize,type InputSize } from "@kjun/tokens";
import {
createContext,
forwardRef,
useContext,
useId,
type KeyboardEvent,
type ReactNode,
type TextareaHTMLAttributes,
} from "react";
import {
Checkbox as AriaCheckbox,
Switch as AriaSwitch,
} from "react-aria-components";
import { DsIcon } from "./button";
import { useKjunField } from "./input";
import { useSelectionIndicator } from "./use-selection-indicator";
export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  dot?: string;
}
export interface DsCheckboxProps<T = ChoiceValue> {
  value: boolean | T[];
  val?: T;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  children?: ReactNode;
  onValueChange?: (value: boolean | T[]) => void;
  onChange?: (value: boolean | T[]) => void;
}
export function DsCheckbox<T = ChoiceValue>({
  value,
  val,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  children,
  onValueChange,
  onChange,
}: DsCheckboxProps<T>) {
  const checked = Array.isArray(value) ? value.includes(val!) : value;
  return (
    <AriaCheckbox
      isSelected={checked}
      isDisabled={disabled}
      aria-label={ariaLabel}
      className={"ds-choice" + (disabled ? " ds-choice--disabled" : "")}
      onChange={(next) => {
        const result = Array.isArray(value)
          ? next
            ? [...value, val!]
            : value.filter((v) => v !== val)
          : next;
        onValueChange?.(result);
        onChange?.(result);
      }}
    >
      <span
        className={`ds-choice-control ds-checkbox ds-checkbox--${size}${
          checked ? " ds-checkbox--checked" : ""
        }`}
      >
        {checked && (
          <DsIcon name="check" size={tokens.extensions.checkbox.iconSizes[size]} />
        )}
      </span>
      {(children || label) && (
        <span className="ds-choice-label">{children || label}</span>
      )}
    </AriaCheckbox>
  );
}
export interface DsSwitchProps {
  value: boolean;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  children?: ReactNode;
  onValueChange?: (value: boolean) => void;
  onChange?: (value: boolean) => void;
}
export function DsSwitch({
  value,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  children,
  onValueChange,
  onChange,
}: DsSwitchProps) {
  return (
    <AriaSwitch
      isSelected={value}
      isDisabled={disabled}
      aria-label={ariaLabel || label}
      className={"ds-choice" + (disabled ? " ds-choice--disabled" : "")}
      onChange={(next) => {
        onValueChange?.(next);
        onChange?.(next);
      }}
    >
      <span
        className={`ds-switch ds-switch--${size}${
          value ? " ds-switch--on" : ""
        }`}
      >
        <span className="ds-switch-thumb" />
      </span>
      {(children || label) && (
        <span className="ds-choice-label">{children || label}</span>
      )}
    </AriaSwitch>
  );
}
const RadioContext = createContext<{
  value: ChoiceValue;
  name: string;
  change: (v: ChoiceValue) => void;
} | null>(null);
export interface DsRadioProps {
  value?: ChoiceValue;
  val: ChoiceValue;
  label?: string;
  disabled?: boolean;
  name?: string;
  ariaLabel?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function DsRadio({
  value,
  val,
  label,
  disabled = false,
  name,
  ariaLabel,
  children,
  onValueChange,
  onChange,
}: DsRadioProps) {
  const group = useContext(RadioContext),
    selected = (group ? group.value : value) === val;
  return (
    <label className={"ds-choice" + (disabled ? " ds-choice--disabled" : "")}>
      <input
        type="radio"
        className="kjun-sr-only"
        name={group?.name || name}
        checked={selected}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={() => {
          if (group) group.change(val);
          else {
            onValueChange?.(val);
            onChange?.(val);
          }
        }}
      />
      <span
        className={
          "ds-choice-control ds-radio" + (selected ? " ds-radio--checked" : "")
        }
      >
        {selected && <span className="ds-radio-dot" />}
      </span>
      {(children || label) && (
        <span className="ds-choice-label">{children || label}</span>
      )}
    </label>
  );
}
export interface DsRadioGroupProps {
  value: ChoiceValue;
  options?: ChoiceOption[];
  direction?: "horizontal" | "vertical";
  ariaLabel?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function DsRadioGroup({
  value,
  options = [],
  direction = "horizontal",
  ariaLabel,
  children,
  onValueChange,
  onChange,
}: DsRadioGroupProps) {
  const name = useId();
  return (
    <RadioContext.Provider
      value={{
        value,
        name,
        change: (next) => {
          onValueChange?.(next);
          onChange?.(next);
        },
      }}
    >
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          flexDirection: direction === "vertical" ? "column" : "row",
          flexWrap: "wrap",
          gap: direction === "vertical" ? tokens.dimension.value8 : tokens.dimension.value16,
        }}
      >
        {children ||
          options.map((option) => (
            <DsRadio
              key={String(option.value)}
              val={option.value}
              label={option.label}
              disabled={option.disabled}
            />
          ))}
      </div>
    </RadioContext.Provider>
  );
}
export interface DsTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "value"> {
  value: string;
  size?: InputSize;
  error?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
  ariaLabel?: string;
  onValueChange?: (value: string) => void;
}
export const DsTextarea = forwardRef<HTMLTextAreaElement, DsTextareaProps>(
  function DsTextarea(
    {
      value,
      size = "md",
      error = false,
      resize = "vertical",
      rows = 3,
      ariaLabel,
      onValueChange,
      onChange,
      className = "",
      style,
      ...props
    },
    ref
  ) {
    const field = useKjunField();
    const spec = tokens.input[size];
    return (
      <textarea
        {...props}
        ref={ref}
        id={props.id || field?.id}
        value={value}
        rows={rows}
        required={props.required ?? field?.required}
        aria-label={ariaLabel || props["aria-label"]}
        aria-labelledby={props["aria-labelledby"] || field?.labelId}
        aria-describedby={props["aria-describedby"] || field?.describedBy}
        aria-invalid={error || !!field?.error || undefined}
        className={"kjun-input kjun-textarea " + className}
        style={{
          fontSize: spec.fontSize / 16 + "rem",
          lineHeight: spec.lineHeight / 16 + "rem",
          padding: `${spec.textareaPaddingY}px ${spec.padding - tokens.border.controlWidth}px`,
          minHeight: Math.max(spec.height, rows * spec.lineHeight + spec.textareaPaddingY * 2 + 2 * tokens.border.controlWidth),
          borderRadius: spec.radius,
          resize,
          ...style,
        }}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
      />
    );
  }
);
export function groupKeydown(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const buttons = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)"
    )
  );
  const current = buttons.indexOf(event.target as HTMLButtonElement);
  if (current < 0) return;
  event.preventDefault();
  const direction =
    getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
      ? buttons.length - 1
      : (current +
          (event.key === "ArrowRight" ? direction : -direction) +
          buttons.length) %
        buttons.length;
  buttons[next]?.focus();
}
export interface DsButtonGroupProps {
  value: ChoiceValue;
  options: ChoiceOption[];
  size?: ButtonSize;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function DsButtonGroup({
  value,
  options,
  size = "md",
  disabled = false,
  fullWidth = false,
  ariaLabel,
  onValueChange,
  onChange,
}: DsButtonGroupProps) {
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
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled || option.disabled}
          style={{
            flex: fullWidth ? 1 : undefined,
            paddingInline: tokens.buttonGroup.itemPaddingX[size],
            borderRadius: tokens.buttonGroup.itemRadii[size],
            ...selectionTypeStyle(size, value === option.value),
          }}
          onClick={() => {
            onValueChange?.(option.value);
            onChange?.(option.value);
          }}
        >
          {option.icon && <DsIcon name={option.icon} size={tokens.extensions.selection.iconSize} />}
          <span className="kjun-button-group-label">
            <span aria-hidden="true" style={typeStyle(tokens.button.typography[size])}>{option.label}</span><span>{option.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
export interface DsFilterGroupProps
  extends Omit<
    DsButtonGroupProps,
    "value" | "onValueChange" | "onChange" | "fullWidth" | "variant"
  > {
  value: ChoiceValue | ChoiceValue[];
  multiple?: boolean;
  scroll?: boolean;
  onValueChange?: (value: ChoiceValue | ChoiceValue[]) => void;
  onChange?: (value: ChoiceValue | ChoiceValue[]) => void;
}
export function DsFilterGroup({
  value,
  options,
  size = "sm",
  disabled = false,
  multiple = false,
  scroll = false,
  ariaLabel,
  onValueChange,
  onChange,
}: DsFilterGroupProps) {
  const selected = (v: ChoiceValue) =>
    multiple
      ? Array.isArray(value) &&
        (v === null ? value.length === 0 : value.includes(v))
      : value === v;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="kjun-filter-group"
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
            {option.icon && <DsIcon name={option.icon} size={tokens.extensions.selection.iconSize} />}
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
