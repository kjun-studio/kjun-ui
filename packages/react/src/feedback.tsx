import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useFeedbackDialog } from "../../../shared/package-runtime/feedback-dialog";
import { usePresentedToasts, usePresentedRequest } from "../../../shared/package-runtime/feedback-motion";
import { KjunFeedbackContext, useOptionalKjunFeedback } from "./feedback-context";
import { ToastStack } from "./toast-stack";
import {
createFeedbackController,
type FeedbackRequest,
type KjunFeedback,
} from "@kjun-ui/tokens";
import {
useCallback,
useEffect,
useRef,
useState,
useSyncExternalStore,
type ReactNode,
} from "react";
import { KjunInput } from "./input";
import { KjunModal } from "./modal";
import { FeedbackOverlayContext } from "./overlay-host";
import { useReducedMotion } from "./use-reduced-motion";
export function useKjunFeedback(): KjunFeedback {
  const value = useOptionalKjunFeedback();
  if (!value) throw Error("useKjunFeedback requires KjunFeedbackProvider.");
  return value;
}
type Controller = ReturnType<typeof createFeedbackController>;
function FeedbackDialog({
  controller,
  request,
  open,
}: {
  controller: Controller;
  request: FeedbackRequest;
  open: boolean;
}) {
  const m = useKjunMessages();
  const { options, value, error, busy, edit, cancel, submit } = useFeedbackDialog(controller, request, m);
  return (
    <KjunModal
      open={open}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
      title={options.title || (request.kind === "prompt" ? m.promptTitle : m.confirmTitle)}
      showFooter
      confirmText={options.confirmText || m.confirm}
      cancelText={options.cancelText || m.cancel}
      loading={busy}
      closable={!busy}
      closeOnEsc={!busy}
      closeOnOverlay={!busy}
      onConfirm={submit}
      confirmVariant={options.type === "danger" ? "danger" : "primary"}
    >
      {options.message && <p>{options.message}</p>}
      {request.kind === "prompt" && (
        <KjunInput
          autoFocus
          value={value}
          ariaLabel={options.title || m.promptTitle}
          placeholder={options.placeholder}
          errorMessage={error}
          onValueChange={edit}
          onEnter={submit}
        />
      )}
    </KjunModal>
  );
}
export function KjunFeedbackProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(createFeedbackController);
  const life = useRef(0);
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  );
  const reduced = useReducedMotion();
  const toasts = usePresentedToasts(snapshot.toasts, reduced);
  const dialog = usePresentedRequest(snapshot.current, reduced);
  useEffect(() => {
    const version = ++life.current;
    return () => {
      queueMicrotask(() => {
        if (life.current === version) controller.dispose();
      });
    };
  }, [controller]);
  const [layers, setLayers] = useState<{ id: string; order: number }[]>([]);
  const register = useCallback((id: string, order: number) => {
    setLayers((current) => [...current, { id, order }]);
    return () =>
      setLayers((current) => current.filter((value) => value.id !== id));
  }, []);
  const top = [...layers].sort((a, b) => a.order - b.order).at(-1)?.id;
  const renderToasts = () => <ToastStack items={toasts} controller={controller} />;

  return (
    <KjunFeedbackContext.Provider value={controller.api}>
      <FeedbackOverlayContext.Provider
        value={{ top, register, render: renderToasts }}
      >
        {children}
        {!layers.length && renderToasts()}

        {dialog.request && (
          <FeedbackDialog
            key={dialog.request.id}
            request={dialog.request}
            open={dialog.open}
            controller={controller}
          />
        )}
      </FeedbackOverlayContext.Provider>
    </KjunFeedbackContext.Provider>
  );
}
export type {
ConfirmOptions,KjunFeedback,PromptOptions,ToastOptions
} from "@kjun-ui/tokens";
