import { onBeforeUnmount, ref } from "vue";
import { copyFeedbackDuration } from "../../../../shared/package-runtime/clipboard";

/** The Vue form of shared/package-runtime/use-copy-feedback.ts: one copy at a time, success shown for
 * copyFeedbackDuration, callbacks only while mounted. */
export function useCopyFeedback(
  copyText: () => (value: string) => void | Promise<void>,
  handlers: { onSuccess(value: string): void; onError(error: unknown): void },
) {
  const copied = ref(false), failed = ref(false);
  let busy = false, mounted = true, timer: ReturnType<typeof setTimeout> | undefined;
  onBeforeUnmount(() => { mounted = false; clearTimeout(timer); });
  const copy = async (value: string) => {
    if (copied.value || busy) return;
    busy = true;
    try {
      await copyText()(value);
      if (!mounted) return;
      copied.value = true; failed.value = false;
      handlers.onSuccess(value);
      timer = setTimeout(() => { copied.value = false; }, copyFeedbackDuration);
    } catch (error) {
      if (!mounted) return;
      failed.value = true;
      handlers.onError(error);
    } finally {
      busy = false;
    }
  };
  return { copied, failed, copy };
}
