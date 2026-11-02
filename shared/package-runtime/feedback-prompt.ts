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

/** How long typing must pause before a prompt with validateOn: "change" checks its value. */
export const promptValidateDelay = 400;

/** Typed text and the expected text match regardless of surrounding spaces or how Hangul was composed (NFC/NFD). */
export const sameText = (a: string, b: string) => a.normalize("NFC").trim() === b.normalize("NFC").trim();

/** User-perceived characters, so an emoji or a composed sequence counts once. */
export function graphemeCount(text: string) {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: "grapheme" }) => { segment(text: string): Iterable<unknown> } }).Segmenter;
  if (!Segmenter) return Array.from(text).length;
  let count = 0;
  for (const _ of new Segmenter(undefined, { granularity: "grapheme" }).segment(text)) count++;
  return count;
}

export interface FeedbackDialogState { value: string; error: string; busy: boolean }
type Settle = (value: string | boolean | null, reason?: unknown, id?: number) => void;
interface SessionController { getSnapshot(): { current?: { id: number } | null }; settle: Settle }
interface SessionOptions {
  kind: "confirm" | "prompt";
  id: number;
  options: Record<string, unknown> & {
    validator?: (value: string) => boolean | string | Promise<boolean | string>;
    onConfirm?: (value?: string) => unknown;
    requiredValue?: string;
    allowEmpty?: boolean;
    validateOn?: "submit" | "change";
  };
  controller: SessionController;
  messages: KjunMessages;
  get: () => FeedbackDialogState;
  set: (patch: Partial<FeedbackDialogState>) => void;
}

/**
 * The confirm/prompt dialog's behaviour without a framework: React, Native and Vue keep the state and call these.
 * Failures from onConfirm stay in the dialog (field error for prompts, a message line for confirms) so the user can
 * retry or cancel; only Cancel, Escape or a success settle the request.
 */
export function createFeedbackSession({ kind, id, options, controller, messages, get, set }: SessionOptions) {
  const prompt = kind === "prompt";
  let working = false, timer: ReturnType<typeof setTimeout> | undefined, check = 0;
  const active = () => controller.getSnapshot().current?.id === id;
  const validate = async (value: string) => {
    const result = await options.validator?.(value);
    return result === false ? messages.invalidInput : typeof result === "string" ? result : "";
  };
  const session = {
    /** Confirm turns on once a required value matches, a prompt is not empty (unless allowed) and no live error shows. */
    ready(state: FeedbackDialogState) {
      if (!prompt) return true;
      if (options.requiredValue != null) return sameText(state.value, options.requiredValue);
      if (!options.allowEmpty && !state.value.trim()) return false;
      return !(options.validateOn === "change" && state.error);
    },
    edit(next: string) {
      set({ value: next, error: "" });
      if (!prompt || options.validateOn !== "change" || !options.validator) return;
      clearTimeout(timer);
      const ticket = ++check;
      timer = setTimeout(async () => {
        const error = await validate(next);
        // A later keystroke or a closed dialog makes this result stale.
        if (ticket === check && active() && get().value === next) set({ error });
      }, promptValidateDelay);
    },
    cancel() {
      if (working || !active()) return;
      session.dispose();
      controller.settle(prompt ? null : false, undefined, id);
    },
    async submit() {
      const state = get();
      if (working || !active() || !session.ready(state)) return;
      working = true;
      set({ busy: true });
      clearTimeout(timer);
      check++;
      try {
        if (prompt) {
          const error = await validate(state.value);
          if (error) { set({ error, busy: false }); working = false; return; }
          await options.onConfirm?.(state.value);
          controller.settle(state.value, undefined, id);
        } else {
          await options.onConfirm?.();
          controller.settle(true, undefined, id);
        }
      } catch (reason) {
        set({ error: feedbackErrorText(reason, messages), busy: false });
        working = false;
      }
    },
    dispose() { clearTimeout(timer); check++; },
  };
  return session;
}
