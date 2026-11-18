import { onBeforeUnmount, ref } from "vue";
import { isPending } from "../../../../shared/package-runtime/clipboard";

/** The Vue form of shared/package-runtime/use-pending-action.ts: pending until a returned promise settles. */
export function usePendingAction() {
  const pending = ref(false);
  let mounted = true, runs = 0;
  onBeforeUnmount(() => { mounted = false; });
  const run = (action: (() => unknown) | undefined) => {
    const result = action?.();
    if (!isPending(result)) return;
    const id = ++runs;
    pending.value = true;
    const settle = () => { if (mounted && id === runs) pending.value = false; };
    // A rejection stops the spinner and is rethrown, so it still reaches the app's unhandled-rejection report.
    result.then(settle, error => { settle(); throw error; });
  };
  return { pending, run };
}
