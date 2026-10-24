import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useFeedbackDialog } from "../../../shared/package-runtime/feedback-dialog";
import { usePresentedToasts, usePresentedRequest } from "../../../shared/package-runtime/feedback-motion";
import { KjunFeedbackContext, useOptionalKjunFeedback } from "./feedback-context";
import { ToastStack } from "./toast-stack";
import { tokens,
createFeedbackController,
feedbackControllerOf,
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
import { View, type StyleProp, type ViewStyle } from "react-native";
import { KjunInput } from "./input";
import { KText } from "./internal";
import { KjunModal } from "./modal";
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
      {!!options.message && (
        <KText style={{ marginBottom: tokens.dimension.value16 }}>{options.message}</KText>
      )}
      {request.kind === "prompt" && (
        <KjunInput
          autoFocus
          value={value}
          ariaLabel={options.title || m.promptTitle}
          placeholder={options.placeholder}
          errorMessage={error}
          onChangeText={edit}
          onSubmitEditing={submit}
        />
      )}
    </KjunModal>
  );
}
export interface KjunFeedbackProviderProps {
  children: ReactNode; style?: StyleProp<ViewStyle>;
  /** A feedback API from createKjunFeedback(), for calls outside components. */
  controller?: KjunFeedback;
}
export function KjunFeedbackProvider({ children, style, controller: controllerProp }: KjunFeedbackProviderProps) {
  // An app-made controller (createKjunFeedback) outlives this Provider; only one the Provider made is disposed.
  const [owned] = useState(() => controllerProp ? undefined : createFeedbackController());
  const controller = controllerProp ? feedbackControllerOf(controllerProp) : owned!;
  useEffect(() => controller.attach(), [controller]);
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
        if (life.current === version && !controllerProp) controller.dispose();
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
        {/* Takes the parent's size like a pass-through, so a flex: 1 screen inside still fills it.
            flex: 1 would collapse to zero height inside a parent without a definite height. */}
        <View style={[{ position: "relative", flexGrow: 1, flexShrink: 1, alignSelf: "stretch" }, style]}>
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

/** An app-owned feedback API that plain functions can call; pass it to KjunFeedbackProvider controller. */
export { createKjunFeedback } from "@kjun-ui/tokens";
