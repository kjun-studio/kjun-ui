// Framework-free rules for the prompt dialog, shared by React, Vue and Native.
import type { KjunMessages } from "./messages";
/** The text a prompt shows when its onConfirm throws: the error's message, or the generic invalid-input copy. */
export function feedbackErrorText(reason: unknown, messages: KjunMessages) {
  return reason instanceof Error && reason.message ? reason.message : typeof reason === "string" && reason ? reason : messages.invalidInput;
}

/** Splits a label around the value it quotes, so the value can be set in bold ("Type <b>name</b> to confirm"). */
export function splitAround(text: string, part: string): [string, string, string] {
  const at = part ? text.indexOf(part) : -1;
  return at < 0 ? [text, "", ""] : [text.slice(0, at), part, text.slice(at + part.length)];
}
