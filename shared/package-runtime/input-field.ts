import { textareaCount, textareaRemaining } from "./textarea";

/** A field holds a value when it is not empty; the number 0 is a value. */
export const inputHasValue = (value: string | number | null | undefined) => value != null && value !== "";

/** The clear button shows only while there is a value the person can remove. */
export const inputShowsClear = ({ clearable, value, disabled, readOnly }:
  { clearable?: boolean; value: string | number | null | undefined; disabled?: boolean; readOnly?: boolean }) =>
  !!clearable && !disabled && !readOnly && inputHasValue(value);

/** A password field the person can reveal: the type it renders with and whether the reveal button shows. */
export function inputReveal(type: string | undefined, revealable: boolean | undefined, revealed: boolean) {
  const active = !!revealable && type === "password";
  return { active, type: active && revealed ? "text" : type };
}

/** Input's character count follows Textarea's: "length/maxLength", over the limit reads as an error. */
export function inputCount(value: string | number | null | undefined, maxLength?: number) {
  const text = value == null ? "" : String(value);
  return { ...textareaCount(text, maxLength), remaining: textareaRemaining(text, maxLength) };
}

/** How long a remote search waits after the last keystroke before it asks loadOptions (ms). */
export const searchLoadDelay = 300;
