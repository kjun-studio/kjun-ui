import { useRef, useState } from "react";
import { kjunMessagesKo, type KjunMessages } from "./messages";
import { feedbackErrorText } from "./feedback-prompt";
import type { createFeedbackController, ConfirmOptions, FeedbackRequest, PromptOptions } from "@kjun-ui/tokens";

// Providers key the dialog by request ID. Presentation can outlive settlement.
export function useFeedbackDialog(controller: ReturnType<typeof createFeedbackController>, request: FeedbackRequest, messages: KjunMessages = kjunMessagesKo) {
  const options = request.options as PromptOptions & Omit<ConfirmOptions, "onConfirm">;
  const [value, setValue] = useState(options.initialValue || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const active = () => controller.getSnapshot().current?.id === request.id;
  const prompt = request.kind === "prompt";
  // A required value (type the name to delete) keeps confirm off until it matches exactly.
  const ready = !prompt || options.requiredValue == null || value === options.requiredValue;
  return {
    options, value, error, busy, ready,
    edit(next: string) { setValue(next); setError(""); },
    cancel() {
      if (!working.current && active()) controller.settle(request.kind === "confirm" ? false : null, undefined, request.id);
    },
    async submit() {
      if (working.current || !active() || !ready) return;
      if (prompt) {
        const valid = options.validator?.(value);
        if (valid === false || typeof valid === "string") {
          setError(typeof valid === "string" ? valid : messages.invalidInput);
          return;
        }
        if (!options.onConfirm) { controller.settle(value, undefined, request.id); return; }
        working.current = true;
        setBusy(true);
        try { await options.onConfirm(value); controller.settle(value, undefined, request.id); }
        catch (reason) {
          // The app's error stays in the dialog so the value can be fixed and sent again.
          setError(feedbackErrorText(reason, messages));
          working.current = false;
          setBusy(false);
        }
        return;
      }
      working.current = true;
      setBusy(true);
      try { await (options.onConfirm as ConfirmOptions["onConfirm"])?.(); controller.settle(true, undefined, request.id); }
      catch (reason) { controller.settle(false, reason, request.id); }
    },
  };
}

