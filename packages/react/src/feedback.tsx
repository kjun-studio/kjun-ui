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
import { DsInput } from "./input";
import { DsModal } from "./modal";
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
  const { options, value, error, busy, edit, cancel, submit } = useFeedbackDialog(controller, request);
  return (
    <DsModal
      open={open}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
      title={options.title || (request.kind === "prompt" ? "입력" : "확인")}
      showFooter
      confirmText={options.confirmText || "확인"}
      cancelText={options.cancelText || "취소"}
      loading={busy}
      closable={!busy}
      closeOnEsc={!busy}
      closeOnOverlay={!busy}
      onConfirm={submit}
      confirmVariant={options.type === "danger" ? "danger" : "primary"}
    >
      {options.message && <p>{options.message}</p>}
      {request.kind === "prompt" && (
        <DsInput
          autoFocus
          value={value}
          ariaLabel={options.title || "입력"}
          placeholder={options.placeholder}
          errorMessage={error}
          onValueChange={edit}
          onEnter={submit}
        />
      )}
    </DsModal>
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
