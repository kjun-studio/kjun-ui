import { KjunSpinnerGlyph } from "./spinner-glyph";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  type ReactNode,
  type Ref,
} from "react";
import {
  Checkbox as AriaCheckbox,
  Switch as AriaSwitch,
} from "react-aria-components";
import { KjunIcon } from "./button";
import { useKjunField } from "./input";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  /** ButtonGroup only: show the icon alone in a square segment; label becomes the accessible name and tooltip. */
  iconOnly?: boolean;
  dot?: string;
}
const useDescriptionId = () => "kjun-" + useId().replace(/:/g, "") + "-description";
const labelIdOf = (descriptionId: string) => descriptionId.replace(/-description$/, "-label");
// The <label> also wraps the description, so with one the control is named by its label text alone.
const namedBy = (description: string | undefined, text: ReactNode, ariaLabel: string | undefined, descriptionId: string) =>
  description && text && !ariaLabel ? labelIdOf(descriptionId) : undefined;
// The label alone, or the label with supporting text under it (the same structure as Switch).
function choiceText(text: ReactNode, description: string | undefined, descriptionId: string) {
  if (description) return (
    <span className="kjun-choice-text">
      {text && <span id={labelIdOf(descriptionId)} className="kjun-choice-label">{text}</span>}
      <span id={descriptionId} className="kjun-choice-description">{description}</span>
    </span>
  );
  return text ? <span className="kjun-choice-label">{text}</span> : null;
}
const choiceClass = (disabled: boolean) => "kjun-choice" + (disabled ? " kjun-choice--disabled" : "");
export interface KjunCheckboxProps<T = ChoiceValue> {
  value: boolean | T[];
  /** Mixed selection display; value and change callbacks keep their boolean/array shape. */
  indeterminate?: boolean;
  val?: T;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  /** Supporting text under the label; it also describes the checkbox to screen readers. */
  description?: string;
  children?: ReactNode;
  /** Submits with a form under this name while checked. */
  name?: string;
  /** The value a form submits while checked (default "on"). */
  formValue?: string;
  /** The checkbox input's id, e.g. to reach it from an outside <label for>. */
  id?: string;
  /** The checkbox's input, e.g. to move focus to the first box of a group that failed validation. */
  inputRef?: Ref<HTMLInputElement>;
  onValueChange?: (value: boolean | T[]) => void;
  onChange?: (value: boolean | T[]) => void;
}
export function KjunCheckbox<T = ChoiceValue>({
  value,
  indeterminate = false,
  val,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  description,
  children,
  name,
  formValue,
  id,
  inputRef,
  onValueChange,
  onChange,
}: KjunCheckboxProps<T>) {
  const checked = Array.isArray(value) ? value.includes(val!) : value;
  // Inside a FormGroup the box keeps its own label but takes the group's hint, error and required state.
  const field = useKjunField(), descriptionId = useDescriptionId();
  return (
    <AriaCheckbox
      isSelected={checked}
      isIndeterminate={indeterminate}
      isDisabled={disabled}
      name={name}
      value={formValue}
      id={id}
      inputRef={inputRef}
      aria-label={ariaLabel}
      aria-labelledby={namedBy(description, children || label, ariaLabel, descriptionId)}
      aria-describedby={mergeIds(field?.describedBy, description ? descriptionId : undefined)}
      isInvalid={!!field?.error}
      isRequired={field?.required}
      // The group's state is announced, not enforced: native validation would block submit per box.
      validationBehavior="aria"
      className={choiceClass(disabled)}
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
        className={`kjun-choice-control kjun-checkbox kjun-checkbox--${size}${
          checked || indeterminate ? " kjun-checkbox--checked" : ""
        }`}
      >
        {(checked || indeterminate) && (
          <IconFallbacks icons={componentIcons}>
            <KjunIcon name={indeterminate ? "minus" : "check"} size={tokens.extensions.checkbox.iconSizes[size]} />
          </IconFallbacks>
        )}
      </span>
      {choiceText(children || label, description, descriptionId)}
    </AriaCheckbox>
  );
}
export interface KjunSwitchProps {
  value: boolean;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  size?: InputSize;
  /** Supporting text under the label; it also describes the switch to screen readers. */
  description?: string;
  /** Saving: a spinner turns in the thumb and presses are ignored, without dimming the switch like disabled. */
  loading?: boolean;
  children?: ReactNode;
  /** Submits with a form under this name while the switch is on. */
  name?: string;
  /** The value a form submits while on (default "on"). */
  formValue?: string;
  id?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  /** The switch's input, e.g. to move focus back after a failed save. */
  inputRef?: Ref<HTMLInputElement>;
  onValueChange?: (value: boolean) => void;
  onChange?: (value: boolean) => void;
}
export function KjunSwitch({
  value,
  label,
  ariaLabel,
  disabled = false,
  size = "md",
  description,
  loading = false,
  children,
  name,
  formValue,
  id,
  autoFocus,
  onFocus,
  onBlur,
  inputRef,
  onValueChange,
  onChange,
}: KjunSwitchProps) {
  const field = useKjunField(), m = useKjunMessages();
  const descriptionId = useDescriptionId(), savingId = descriptionId.replace(/-description$/, "-saving");
  const invalid = !!field?.error, required = !!field?.required;
  // react-aria's Switch takes no validation props; mark the input directly (and clear stale marks).
  const markInput = useCallback((input: HTMLInputElement | null) => {
    if (!input) return;
    if (invalid) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    if (required) input.setAttribute("aria-required", "true"); else input.removeAttribute("aria-required");
    if (loading) input.setAttribute("aria-busy", "true"); else input.removeAttribute("aria-busy");
    if (typeof inputRef === "function") inputRef(input); else if (inputRef) (inputRef as { current: HTMLInputElement | null }).current = input;
  }, [invalid, required, loading, inputRef]);
  return (
    <AriaSwitch
      isSelected={value}
      isDisabled={disabled}
      data-loading={loading || undefined}
      name={name}
      value={formValue}
      id={id}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={ariaLabel || label}
      aria-labelledby={namedBy(description, ariaLabel || label ? undefined : children, undefined, descriptionId)}
      // aria-busy alone is not read on form controls, so the saving state is also a description.
      aria-describedby={mergeIds(field?.describedBy, description ? descriptionId : undefined, loading ? savingId : undefined)}
      inputRef={markInput}
      className={choiceClass(disabled)}
      onChange={(next) => {
        // While saving, presses change nothing (like Vue and Native); the switch is not announced as read-only.
        if (loading) return;
        onValueChange?.(next);
        onChange?.(next);
      }}
    >
      {loading && <span id={savingId} hidden>{m.saving}</span>}
      <span
        className={`kjun-switch kjun-switch--${size}${
          value ? " kjun-switch--on" : ""
        }`}
      >
        <span className="kjun-switch-thumb">{loading && <KjunSpinnerGlyph className="kjun-switch-spinner" size={tokens.extensions.switch.spinnerSize} />}</span>
      </span>
      {choiceText(children || label, description, descriptionId)}
    </AriaSwitch>
  );
}
const RadioContext = createContext<{
  value: ChoiceValue;
  name: string;
  size?: InputSize;
  disabled: boolean;
  invalid: boolean;
  change: (v: ChoiceValue) => void;
} | null>(null);
export interface KjunRadioProps {
  value?: ChoiceValue;
  val: ChoiceValue;
  label?: string;
  disabled?: boolean;
  name?: string;
  ariaLabel?: string;
  /** Inside a RadioGroup the group's size applies unless this is set. */
  size?: InputSize;
  /** Supporting text under the label; it also describes the radio to screen readers. */
  description?: string;
  children?: ReactNode;
  /** The radio input's id, e.g. to reach it from an outside <label for>. */
  id?: string;
  /** The radio's input, e.g. to move focus to it from code. */
  inputRef?: Ref<HTMLInputElement>;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunRadio({
  value,
  val,
  label,
  disabled = false,
  name,
  ariaLabel,
  size,
  description,
  children,
  id,
  inputRef,
  onValueChange,
  onChange,
}: KjunRadioProps) {
  const group = useContext(RadioContext), field = useKjunField(), descriptionId = useDescriptionId();
  const selected = (group ? group.value : value) === val;
  const blocked = disabled || !!group?.disabled, scale = size || group?.size || "md";
  // A lone radio in a FormGroup takes the group's hint, error and required state; inside a RadioGroup the group carries them.
  const own = group ? null : field, invalid = group ? group.invalid : !!field?.error;
  return (
    <label className={choiceClass(blocked)} data-invalid={invalid || undefined}>
      <input
        ref={inputRef}
        id={id}
        type="radio"
        className="kjun-sr-only"
        name={group?.name || name}
        // A form submits the chosen radio's val, not the browser's default "on".
        value={String(val)}
        checked={selected}
        disabled={blocked}
        aria-label={ariaLabel}
        aria-labelledby={namedBy(description, children || label, ariaLabel, descriptionId)}
        aria-describedby={mergeIds(own?.describedBy, description ? descriptionId : undefined)}
        aria-invalid={own?.error ? true : undefined}
        aria-required={own?.required || undefined}
        onChange={() => {
          if (group) group.change(val);
          else {
            onValueChange?.(val);
            onChange?.(val);
          }
        }}
      />
      <span
        className={`kjun-choice-control kjun-radio kjun-radio--${scale}${selected ? " kjun-radio--checked" : ""}`}
      >
        {selected && <span className="kjun-radio-dot" />}
      </span>
      {choiceText(children || label, description, descriptionId)}
    </label>
  );
}
export interface KjunRadioGroupProps {
  value: ChoiceValue;
  options?: ChoiceOption[];
  direction?: "horizontal" | "vertical";
  ariaLabel?: string;
  /** Size of every radio in the group. */
  size?: InputSize;
  /** Disables every radio in the group. */
  disabled?: boolean;
  /** The form field name the chosen radio submits under (default: a generated name). */
  name?: string;
  children?: ReactNode;
  onValueChange?: (value: ChoiceValue) => void;
  onChange?: (value: ChoiceValue) => void;
}
export function KjunRadioGroup({
  value,
  options = [],
  direction = "horizontal",
  ariaLabel,
  size,
  disabled = false,
  name,
  children,
  onValueChange,
  onChange,
}: KjunRadioGroupProps) {
  const generated = "kjun-" + useId();
  // Inside a FormGroup the group is named by its label and described by its hint or error.
  const field = useKjunField(), invalid = !!field?.error;
  return (
    <RadioContext.Provider
      value={{
        value,
        name: name || generated,
        size,
        disabled,
        invalid,
        change: (next) => {
          onValueChange?.(next);
          onChange?.(next);
        },
      }}
    >
      <div
        role="radiogroup"
        className="kjun-radio-group"
        data-direction={direction}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : field?.labelId}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        aria-required={field?.required || undefined}
        aria-disabled={disabled || undefined}
      >
        {children ||
          options.map((option) => (
            <KjunRadio
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
