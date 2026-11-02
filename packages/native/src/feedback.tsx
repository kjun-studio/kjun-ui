import type { ToastPlacement } from "../../../shared/package-runtime/toast-placement";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useFeedbackDialog } from "../../../shared/package-runtime/feedback-dialog";
import { splitAround } from "../../../shared/package-runtime/feedback-prompt";
import { alertTint } from "./alert-actions-context";
import { KjunButton, KjunIcon } from "./button";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
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
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
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
  const { colors } = useKjunStyles(), window = useWindowDimensions();
  const { options, value, error, busy, ready, edit, cancel, submit } = useFeedbackDialog(controller, request, m);
  const prompt = request.kind === "prompt", danger = options.type === "danger";
  const title = options.title || (prompt ? m.promptTitle : m.confirmTitle);
  // Phones: the two choices split the width with large targets (like Web).
  const narrow = window.width <= tokens.responsive.modal, buttonSize = narrow ? "lg" : "md";
  const required = options.requiredValue != null ? splitAround(m.typeToConfirm(options.requiredValue), options.requiredValue) : null;
  const label = { ...typeStyle("label"), color: colors.text };
  return (
    <KjunModal
      open={open}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
      // Like Web: one small surface, no header or footer bands and no close button.
      size="sm"
      ariaLabel={title}
      showHeader={false}
      closeOnEsc={!busy}
      closeOnOverlay={!busy}
    >
      <KText accessibilityRole="header" style={{ ...typeStyle("sectionTitle"), color: colors.text }}>{title}</KText>
      {!!options.message && (danger ? (
        <View style={{ flexDirection: "row", gap: tokens.dimension.value8, marginTop: tokens.dimension.value12, padding: tokens.dimension.value12,
          borderRadius: tokens.radius.radius12, backgroundColor: alertTint(colors.danger, "tintControl", colors.dangerBg) }}>
          <View style={{ height: typeStyle("body").lineHeight, justifyContent: "center" }}>
            <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} color={colors.danger} filled />
          </View>
          <KText style={{ ...typeStyle("body"), color: colors.text, flex: 1 }}>{options.message}</KText>
        </View>
      ) : (
        <KText style={{ ...typeStyle("body"), color: colors.textSecondary, marginTop: tokens.dimension.value4 }}>{options.message}</KText>
      ))}
      {prompt && (
        <View style={{ marginTop: tokens.dimension.value20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: tokens.dimension.value8, marginBottom: tokens.extensions.form.labelGap }}>
            <KText style={{ ...label, flexShrink: 1 }}>
              {required ? <>{required[0]}<KText style={{ ...label, fontWeight: typeStyle("control").fontWeight }}>{required[1]}</KText>{required[2]}</> : options.label || title}
            </KText>
            {options.maxLength != null ? (
              <KText aria-hidden importantForAccessibility="no" style={{ ...typeStyle("caption"), color: colors.textTertiary, fontVariant: ["tabular-nums"] }}>
                {value.length} / {options.maxLength}
              </KText>
            ) : null}
          </View>
          <KjunInput
            autoFocus
            value={value}
            ariaLabel={required ? m.typeToConfirm(options.requiredValue!) : options.label || title}
            accessibilityHint={options.message || undefined}
            maxLength={options.maxLength}
            // Renaming: the starting text opens selected, so typing replaces it.
            selectTextOnFocus={!!options.initialValue}
            placeholder={options.placeholder}
            errorMessage={error}
            onChangeText={edit}
            onSubmitEditing={submit}
          />
        </View>
      )}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: tokens.dimension.value8, marginTop: tokens.dimension.value24 }}>
        <View style={narrow ? { flex: 1 } : undefined}>
          <KjunButton variant="secondary" size={buttonSize} block={narrow} disabled={busy} onPress={cancel}>{options.cancelText || m.cancel}</KjunButton>
        </View>
        <View style={narrow ? { flex: 1 } : undefined}>
          <KjunButton variant={danger ? "danger" : "primary"} size={buttonSize} block={narrow} loading={busy} disabled={!ready} onPress={submit}>{options.confirmText || m.confirm}</KjunButton>
        </View>
      </View>
    </KjunModal>
  );
}
export interface KjunFeedbackProviderProps {
  children: ReactNode; style?: StyleProp<ViewStyle>;
  /** A feedback API from createKjunFeedback(), for calls outside components. */
  controller?: KjunFeedback;
  /** Stacks toasts at the top (default) or the bottom of the screen; both keep clear of KjunProvider's safe area. */
  placement?: ToastPlacement;
  /** Extra space between the toasts and their edge, e.g. a bottom navigation's height. */
  offset?: number;
  /** How many toasts stay on screen at once (default 3); a fuller stack closes the oldest self-closing toast first. */
  maxToasts?: number;
}
export function KjunFeedbackProvider({ children, style, controller: controllerProp, placement = "top", offset = 0, maxToasts = 3 }: KjunFeedbackProviderProps) {
  // An app-made controller (createKjunFeedback) outlives this Provider; only one the Provider made is disposed.
  const [owned] = useState(() => controllerProp ? undefined : createFeedbackController());
  const controller = controllerProp ? feedbackControllerOf(controllerProp) : owned!;
  useEffect(() => controller.attach(), [controller]);
  useEffect(() => controller.setToastLimit(maxToasts), [controller, maxToasts]);
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
  const renderToasts = () => <ToastStack items={toasts} controller={controller} placement={placement} offset={offset} />;

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
