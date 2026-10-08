import { useFeedbackDialog } from "../../../shared/package-runtime/feedback-dialog";
import { usePresentedToasts, usePresentedRequest } from "../../../shared/package-runtime/feedback-motion";
import { KjunFeedbackContext, useOptionalKjunFeedback } from "./feedback-context";
import { ToastStack } from "./toast-stack";
import { tokens,
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
import { View } from "react-native";
import { DsInput } from "./input";
import { KText } from "./internal";
import { DsModal } from "./modal";
import { FeedbackOverlayContext } from "./overlay-host";
import { useReducedMotion } from "./internal";
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
      {options.message && (
        <KText style={{ marginBottom: tokens.dimension.value16 }}>{options.message}</KText>
      )}
      {request.kind === "prompt" && (
        <DsInput
          autoFocus
          value={value}
          ariaLabel={options.title || "입력"}
          placeholder={options.placeholder}
          errorMessage={error}
          onChangeText={edit}
          onSubmitEditing={submit}
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
  const [layers, setLayers] = useState<string[]>([]);
  const register = useCallback((id: string) => {
    setLayers((previous) => [...previous, id]);
    return () =>
      setLayers((previous) => previous.filter((item) => item !== id));
  }, []);
  const renderToasts = () => <ToastStack items={toasts} controller={controller} />;

  return (
    <FeedbackOverlayContext.Provider
      value={{ top: layers[layers.length - 1], register, render: renderToasts }}
    >
      <KjunFeedbackContext.Provider value={controller.api}>
        <View style={{ position: "relative" }}>
          {children}
          {layers.length === 0 && renderToasts()}
        </View>
        {dialog.request && (
          <FeedbackDialog
            key={dialog.request.id}
            request={dialog.request}
            open={dialog.open}
            controller={controller}
          />
        )}
      </KjunFeedbackContext.Provider>
    </FeedbackOverlayContext.Provider>
  );
}
export type {
ConfirmOptions,KjunFeedback,PromptOptions,ToastOptions
} from "@kjun-ui/tokens";
