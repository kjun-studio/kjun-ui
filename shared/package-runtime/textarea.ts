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
