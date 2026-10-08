import { createFeedbackController,type ToastItem } from "@kjun/tokens";
import { useEffect,useRef,type CSSProperties } from "react";
import { DsIcon } from "./button";
export function ToastView({
  toast,
  controller,
}: {
  toast: ToastItem;
  controller: ReturnType<typeof createFeedbackController>;
}) {
  const previous = useRef<HTMLElement | null>(null);
  const reasons = useRef({ hover: Symbol("hover"), focus: Symbol("focus") }).current;
  useEffect(() => {
    previous.current = document.activeElement as HTMLElement;
    return () => {
      controller.resumeToast(toast.id, reasons.hover);
      controller.resumeToast(toast.id, reasons.focus);
    };
  }, [controller, toast.id, reasons]);
  const dismiss = () => {
    if (previous.current?.isConnected) previous.current.focus();
    controller.api.toast.dismiss(toast.id);
  };
  const tone = toast.type === "error" ? "danger" : toast.type || "info";
  const icon = {
    success: "circle-check",
    danger: "alert-circle",
    warning: "alert-triangle",
    info: "info-circle",
  }[tone];
  return (
    <div
      className="kjun-toast"
      data-tone={tone}
      data-title={!!toast.title}
      role="alert"
      aria-live={tone === "danger" ? "assertive" : "polite"}
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
        <DsIcon name={icon} />
      </span>
      <div className="kjun-toast-content">
        {toast.title && <strong>{toast.title}</strong>}
        <span className="kjun-toast-message">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            className="kjun-toast-action"
            onClick={() => {
              try {
                toast.action?.onClick();
              } finally {
                dismiss();
              }
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.closable !== false && (
        <button
          type="button"
          className="kjun-toast-close"
          aria-label="알림 닫기"
          onClick={() => dismiss()}
        >
          <DsIcon name="x" />
        </button>
      )}
      {toast.showProgress !== false && !!toast.duration && (
        <div
          key={toast.startedAt + ":" + toast.paused}
          aria-hidden="true"
          className="kjun-toast-progress"
          style={
            {
              "--toast-start": `${(toast.remaining / toast.duration) * 100}%`,
              animationDuration: `${toast.remaining}ms`,
              animationPlayState: toast.paused ? "paused" : "running",
              background: `var(--_kjun-color-${tone})`,
            } as CSSProperties
          }
        />
      )}
    </div>
  );
}
