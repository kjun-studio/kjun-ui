import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useFeedbackDialog } from "../../../shared/package-runtime/feedback-dialog";
import { splitAround } from "../../../shared/package-runtime/feedback-prompt";
import { usePresentedToasts, usePresentedRequest } from "../../../shared/package-runtime/feedback-motion";
import { KjunFeedbackContext, useOptionalKjunFeedback } from "./feedback-context";
import { ToastStack } from "./toast-stack";
import type { ToastPlacement } from "../../../shared/package-runtime/toast-placement";
import {
createFeedbackController,
feedbackControllerOf,
tokens,
type FeedbackRequest,
type KjunFeedback,
} from "@kjun-ui/tokens";
import {
useCallback,
useEffect,
useId,
useRef,
useState,
useSyncExternalStore,
type ReactNode,
} from "react";
import { KjunButton, KjunIcon } from "./button";
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
function RequiredLabel({ text, value }: { text: string; value: string }) {
  const [before, quoted, after] = splitAround(text, value);
  return <>{before}<strong>{quoted}</strong>{after}</>;
}
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
  const { options, value, error, busy, ready, edit, cancel, submit } = useFeedbackDialog(controller, request, m);
  const prompt = request.kind === "prompt", danger = options.type === "danger";
  const title = options.title || (prompt ? m.promptTitle : m.confirmTitle);
  const ids = "kjun-feedback-" + useId().replace(/:/g, ""), input = useRef<HTMLInputElement>(null);
  // Renaming: the starting text opens selected, so typing replaces it.
  useEffect(() => { if (open && prompt && options.initialValue) input.current?.select(); }, [open, prompt, options.initialValue]);
  return (
    <KjunModal
      open={open}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
      // One small surface: no header or footer bands and no close button; Cancel and Escape dismiss it.
      size="sm"
      ariaLabel={title}
      showHeader={false}
      closeOnEsc={!busy}
      closeOnOverlay={!busy}
    >
      <div className="kjun-feedback-dialog">
        <h2>{title}</h2>
        {options.message && (
          <p id={ids + "-message"} className="kjun-feedback-dialog-message" data-tone={danger ? "danger" : undefined}>
            {danger && <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} filled />}
            <span>{options.message}</span>
          </p>
        )}
        {prompt && (
          <div className="kjun-feedback-dialog-field">
            {/* The count stays out of the label, so the field's name does not change while typing. */}
            <div className="kjun-feedback-dialog-label">
              <label htmlFor={ids + "-input"}>
                {options.requiredValue != null ? <RequiredLabel text={m.typeToConfirm(options.requiredValue)} value={options.requiredValue} /> : options.label || title}
              </label>
              {options.maxLength != null && <span className="kjun-feedback-dialog-count" aria-hidden="true">{value.length} / {options.maxLength}</span>}
            </div>
            <KjunInput
              ref={input}
              id={ids + "-input"}
              autoFocus
              value={value}
              maxLength={options.maxLength}
              aria-describedby={options.message ? ids + "-message" : undefined}
              placeholder={options.placeholder}
              errorMessage={error}
              onValueChange={edit}
              onEnter={submit}
            />
          </div>
        )}
        <div className="kjun-feedback-dialog-actions">
          <KjunButton variant="secondary" disabled={busy} onClick={cancel}>{options.cancelText || m.cancel}</KjunButton>
          <KjunButton variant={danger ? "danger" : "primary"} loading={busy} disabled={!ready} onClick={submit}>{options.confirmText || m.confirm}</KjunButton>
        </div>
      </div>
    </KjunModal>
  );
}
export interface KjunFeedbackProviderProps {
  children: ReactNode;
  /** A feedback API from createKjunFeedback(), for calls outside components. */
  controller?: KjunFeedback;
  /** Stacks toasts at the top (default) or the bottom of the screen, right-aligned on wide screens; both keep clear of the safe area. */
  placement?: ToastPlacement;
  /** Extra px between the toasts and their edge, e.g. a bottom navigation's height. */
  offset?: number;
  /** How many toasts stay on screen at once (default 3); a fuller stack closes the oldest self-closing toast first. */
  maxToasts?: number;
}
export function KjunFeedbackProvider({ children, controller: controllerProp, placement = "top", offset = 0, maxToasts = 3 }: KjunFeedbackProviderProps) {
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
  const [layers, setLayers] = useState<{ id: string; order: number }[]>([]);
  const register = useCallback((id: string, order: number) => {
    setLayers((current) => [...current, { id, order }]);
    return () =>
      setLayers((current) => current.filter((value) => value.id !== id));
  }, []);
  const top = [...layers].sort((a, b) => a.order - b.order).at(-1)?.id;
  const renderToasts = () => <ToastStack items={toasts} controller={controller} placement={placement} offset={offset} />;

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

/** An app-owned feedback API that plain functions can call; pass it to KjunFeedbackProvider controller. */
export { createKjunFeedback } from "@kjun-ui/tokens";
