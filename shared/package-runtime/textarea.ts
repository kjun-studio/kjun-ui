import { tokens, type InputSize } from "@kjun-ui/tokens";

// Textarea height grows with its text from `rows` up to `maxRows`, then scrolls.
export const textareaMaxRows = 6;

/** Border-box height for a number of text rows at a field size. */
export function textareaRowsHeight(size: InputSize, rows: number, footer = false) {
  const spec = tokens.input[size];
  const paddingBottom = footer ? tokens.extensions.textarea.footerTextGap : spec.textareaPaddingY;
  // With a footer the wrapper carries the field border, so the textarea itself has none.
  return rows * spec.lineHeight + spec.textareaPaddingY + paddingBottom + (footer ? 0 : 2 * tokens.border.controlWidth);
}

/** The [minimum, maximum] border-box height; a maximum below the minimum keeps the field at `rows`. */
export function textareaBounds(size: InputSize, rows: number, maxRows: number, footer = false) {
  const minimum = Math.max(footer ? 0 : tokens.input[size].height, textareaRowsHeight(size, rows, footer));
  return [minimum, Math.max(minimum, textareaRowsHeight(size, maxRows, footer))] as const;
}

/** The counter text; it counts like the maxLength attribute (UTF-16 units), so it agrees with what typing allows. */
export function textareaCount(value: string, maxLength?: number) {
  const length = value.length;
  return { length, text: maxLength != null ? `${length}/${maxLength}` : String(length), over: maxLength != null && length > maxLength };
}

export type TextareaResize = "none" | "vertical" | "horizontal" | "both";
/** A field the user can drag taller keeps the height they chose, so it does not also grow with its text. */
export const textareaGrows = (minimum: number, maximum: number, resize: TextareaResize = "none") =>
  maximum > minimum && resize !== "vertical" && resize !== "both";

/** The text inset: with a footer the wrapper carries the border, so the text keeps the field's own inset. */
export function textareaPadding(size: InputSize, footer: boolean) {
  const spec = tokens.input[size];
  return footer
    ? { top: spec.textareaPaddingY, x: spec.padding, bottom: tokens.extensions.textarea.footerTextGap }
    : { top: spec.textareaPaddingY, x: spec.padding - tokens.border.controlWidth, bottom: spec.textareaPaddingY };
}

/** Whether the composer may send: some text within maxLength, an enabled and editable field, nothing already sending. */
export function textareaCanSubmit({ value, maxLength, disabled, readOnly, submitting }:
  { value: string | null | undefined; maxLength?: number; disabled?: boolean; readOnly?: boolean; submitting?: boolean }) {
  return !disabled && !readOnly && !submitting && !!value?.trim() && !textareaCount(value ?? "", maxLength).over;
}

/** "mod-enter" sends on Ctrl/⌘+Enter; "enter" sends on Enter and leaves Shift+Enter for a new line. */
export type TextareaSubmitKey = "mod-enter" | "enter";
/**
 * Whether this key press sends. Korean and other IME input confirm a syllable with Enter, and Safari reports that
 * Enter with isComposing false but keyCode 229, so both mean "still composing".
 */
export function textareaSubmitKey(event: { key: string; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; isComposing?: boolean; keyCode?: number },
  mode: TextareaSubmitKey = "mod-enter") {
  if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) return false;
  return mode === "enter" ? !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey : !!(event.metaKey || event.ctrlKey);
}

/** Characters left to announce near the limit (the last tenth, at least ten), or null while there is room. */
export function textareaRemaining(value: string, maxLength?: number) {
  if (maxLength == null) return null;
  const left = maxLength - value.length;
  return left <= Math.max(10, Math.ceil(maxLength / 10)) ? Math.max(0, left) : null;
}
