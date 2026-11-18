import { useCallback, useEffect, useRef, useState } from "react";
import { copyFeedbackDuration } from "./clipboard";

/** The copy button state machine shared by React and Native (Vue keeps its own form in runtime/copy-feedback.ts).
 * One copy runs at a time; success shows for copyFeedbackDuration; callbacks run only while mounted. */
export function useCopyFeedback(
  copyText: (value: string) => void | Promise<void>,
  handlers: { onSuccess(value: string): void; onError(error: unknown): void },
) {
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false),
    busy = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    mounted = useRef(true),
    latest = useRef({ copyText, handlers, copied });
  latest.current = { copyText, handlers, copied };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const copy = useCallback(async (value: string) => {
    if (latest.current.copied || busy.current) return;
    busy.current = true;
    try {
      await latest.current.copyText(value);
      if (!mounted.current) return;
      setCopied(true);
      setFailed(false);
      latest.current.handlers.onSuccess(value);
      timer.current = setTimeout(() => setCopied(false), copyFeedbackDuration);
    } catch (error) {
      if (!mounted.current) return;
      setFailed(true);
      latest.current.handlers.onError(error);
    } finally {
      busy.current = false;
    }
  }, []);
  return { copied, failed, copy };
}
