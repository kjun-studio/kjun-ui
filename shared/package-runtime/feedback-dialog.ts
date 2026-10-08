import { useRef, useState } from "react";
import type { createFeedbackController, ConfirmOptions, FeedbackRequest, PromptOptions } from "@kjun-ui/tokens";

// Providers key the dialog by request ID. Presentation can outlive settlement.
export function useFeedbackDialog(controller: ReturnType<typeof createFeedbackController>, request: FeedbackRequest) {
  const options = request.options as PromptOptions & ConfirmOptions;
  const [value, setValue] = useState(options.initialValue || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const active = () => controller.getSnapshot().current?.id === request.id;
  return {
    options, value, error, busy,
    edit(next: string) { setValue(next); setError(""); },
    cancel() {
      if (!working.current && active()) controller.settle(request.kind === "confirm" ? false : null, undefined, request.id);
    },
    async submit() {
      if (working.current || !active()) return;
      if (request.kind === "prompt") {
        const valid = options.validator?.(value);
        if (valid === false || typeof valid === "string") {
          setError(typeof valid === "string" ? valid : "입력 내용을 확인하세요.");
          return;
        }
        controller.settle(value, undefined, request.id);
        return;
      }
      working.current = true;
      setBusy(true);
      try { await options.onConfirm?.(); controller.settle(true, undefined, request.id); }
      catch (reason) { controller.settle(false, reason, request.id); }
    },
  };
}
