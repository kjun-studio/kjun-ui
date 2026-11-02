import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { toastPresentation } from "../../../shared/package-runtime/toast-presentation";
import { attachToastSwipe } from "../../../shared/package-runtime/toast-swipe";
import { createFeedbackController,type ToastItem } from "@kjun-ui/tokens";
import { useEffect,useRef } from "react";
import { KjunIcon } from "./button";
export function ToastView({
  toast,
  controller,
}: {
  toast: ToastItem;
  controller: ReturnType<typeof createFeedbackController>;
}) {
  const m = useKjunMessages();
  const card = useRef<HTMLDivElement>(null);
  const reasons = useRef({ hover: Symbol("hover"), focus: Symbol("focus"), swipe: Symbol("swipe") }).current;
  useEffect(() => () => {
    for (const reason of Object.values(reasons)) controller.resumeToast(toast.id, reason);
  }, [controller, toast.id, reasons]);
  useEffect(() => card.current ? attachToastSwipe(card.current, {
    hold: () => controller.pauseToast(toast.id, reasons.swipe),
    release: () => controller.resumeToast(toast.id, reasons.swipe),
    close: () => controller.closeToast(toast.id, "close"),
  }) : undefined, [controller, toast.id, reasons]);
  const { tone, icon, compact, closable, sideAction, role, live } = toastPresentation(toast);
  const action = toast.action && (
    <button
      type="button"
      className="kjun-toast-action"
      onClick={() => {
        try {
          toast.action?.onClick();
        } finally {
          controller.closeToast(toast.id, "action");
        }
      }}
    >
      {toast.action.label}
    </button>
  );
  return (
    <div
      ref={card}
      className="kjun-toast"
      data-tone={tone}
      data-title={!!toast.title}
      data-compact={compact || undefined}
      data-loading={toast.loading || undefined}
      data-side={sideAction || closable}
      role={role}
      aria-live={live}
      onMouseEnter={() => controller.pauseToast(toast.id, reasons.hover)}
      onMouseLeave={() => controller.resumeToast(toast.id, reasons.hover)}
      onFocus={() => controller.pauseToast(toast.id, reasons.focus)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          controller.resumeToast(toast.id, reasons.focus);
      }}
    >
      <span
        className="kjun-toast-icon"
        style={{ color: `var(--_kjun-color-${tone}-accent)` }}
      >
        <KjunIcon name={icon} spin={!!toast.loading} />
      </span>
      <div className="kjun-toast-content">
        {toast.title && <strong>{toast.title}</strong>}
        <span className="kjun-toast-message">{toast.message}</span>
        {toast.action && !sideAction && <div className="kjun-toast-actions">{action}</div>}
      </div>
      {(sideAction || closable) && (
        <div className="kjun-toast-side">
          {sideAction && action}
          {closable && (
            <button
              type="button"
              className="kjun-toast-close"
              aria-label={m.closeNotification}
              onClick={() => controller.closeToast(toast.id, "close")}
            >
              <KjunIcon name="x" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
