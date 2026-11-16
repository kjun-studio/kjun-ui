import { tokens } from "@kjun-ui/tokens";

/** "plain" drops the field surface: text edited in place, such as a document title or a note body. */
export type InputVariant = "default" | "plain";

/** The side inset and side border of a field. A plain field has neither, so its text lines up with the text around it. */
export function inputEdge(variant: InputVariant | undefined, padding: number) {
  return variant === "plain" ? { padding: 0, border: 0 } : { padding, border: tokens.border.controlWidth };
}
