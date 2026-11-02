import { useEffect, useRef, useState } from "react";
import { kjunMessagesKo, type KjunMessages } from "./messages";
import { createFeedbackSession, type FeedbackDialogState } from "./feedback-prompt";
import type { createFeedbackController, ConfirmOptions, FeedbackRequest, PromptOptions } from "@kjun-ui/tokens";

// React and Native keep the dialog state; the behaviour lives in the framework-free session (Vue uses it too).
// Providers key the dialog by request ID. Presentation can outlive settlement.
export function useFeedbackDialog(controller: ReturnType<typeof createFeedbackController>, request: FeedbackRequest, messages: KjunMessages = kjunMessagesKo) {
  const options = request.options as PromptOptions & Omit<ConfirmOptions, "onConfirm">;
  const [state, setState] = useState<FeedbackDialogState>(() => ({ value: options.initialValue || "", error: "", busy: false }));
  const latest = useRef(state);
  latest.current = state;
  const [session] = useState(() => createFeedbackSession({
    kind: request.kind, id: request.id, options: options as never, controller,
    messages,
    get: () => latest.current,
    set: (patch) => { latest.current = { ...latest.current, ...patch }; setState(latest.current); },
  }));
  useEffect(() => () => session.dispose(), [session]);
  return { options, ...state, ready: session.ready(state), edit: session.edit, cancel: session.cancel, submit: session.submit };
}
