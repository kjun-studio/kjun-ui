import { toastPresentation } from "../../../shared/package-runtime/toast-presentation";
import { attachToastSwipe } from "../../../shared/package-runtime/toast-swipe";
import { useKjunMessages } from "./runtime/messages";
import { defineComponent, onBeforeUnmount, onMounted, ref, type PropType } from "vue";
import { createFeedbackController, type ToastItem } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";

type Controller = ReturnType<typeof createFeedbackController>;
export const ToastView = defineComponent({
  name: "KjunToastView",
  props: { toast: { type: Object as PropType<ToastItem>, required: true }, controller: { type: Object as PropType<Controller>, required: true } },
  setup(props) {
    const m = useKjunMessages();
    const card = ref<HTMLElement | null>(null);
    const reasons = { hover: Symbol("kjunToastHover"), focus: Symbol("kjunToastFocus"), swipe: Symbol("kjunToastSwipe") };
    let detach: (() => void) | undefined;
    onMounted(() => {
      if (card.value) detach = attachToastSwipe(card.value, {
        hold: () => props.controller.pauseToast(props.toast.id, reasons.swipe),
        release: () => props.controller.resumeToast(props.toast.id, reasons.swipe),
        close: () => props.controller.closeToast(props.toast.id, "close"),
      });
    });
    onBeforeUnmount(() => {
      detach?.();
      for (const reason of Object.values(reasons)) props.controller.resumeToast(props.toast.id, reason);
    });
    return () => {
      const toast = props.toast, { tone, icon, compact, closable, sideAction, role, live } = toastPresentation(toast);
      const action = toast.action && (
        <button type="button" class="kjun-toast-action" onClick={() => { try { toast.action?.onClick(); } finally { props.controller.closeToast(toast.id, "action"); } }}>{toast.action.label}</button>
      );
      return (
        <div ref={card} class="kjun-toast" data-tone={tone} data-title={String(!!toast.title)} data-compact={compact ? "true" : undefined}
          data-loading={toast.loading ? "true" : undefined} data-side={String(sideAction || closable)} role={role} aria-live={live}
          onMouseenter={() => props.controller.pauseToast(toast.id, reasons.hover)}
          onMouseleave={() => props.controller.resumeToast(toast.id, reasons.hover)}
          onFocusin={() => props.controller.pauseToast(toast.id, reasons.focus)}
          onFocusout={(event: FocusEvent) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) props.controller.resumeToast(toast.id, reasons.focus); }}>
          <span class="kjun-toast-icon" style={{ color: `var(--_kjun-color-${tone}-accent)` }}><KjunIcon name={icon} spin={!!toast.loading} /></span>
          <div class="kjun-toast-content">
            {toast.title && <strong>{toast.title}</strong>}
            <span class="kjun-toast-message">{toast.message}</span>
            {toast.action && !sideAction && <div class="kjun-toast-actions">{action}</div>}
          </div>
          {(sideAction || closable) && (
            <div class="kjun-toast-side">
              {sideAction && action}
              {closable && <button type="button" class="kjun-toast-close" aria-label={m.value.closeNotification} onClick={() => props.controller.closeToast(toast.id, "close")}><KjunIcon name="x" /></button>}
            </div>
          )}
        </div>
      );
    };
  },
});
