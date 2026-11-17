import { useKjunMessages } from "./runtime/messages";
import { getCurrentInstance, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { clampCurrent, stepStatus, stepsRootStatus, type KjunStepItem, type KjunStepStatus, type KjunStepsCurrentStatus, type KjunStepsLayout } from "../../../shared/package-runtime/steps";
import { KjunIcon } from "./button";

export type { KjunStepItem, KjunStepStatus, KjunStepsCurrentStatus, KjunStepsLayout };

function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}

const kjunStepsProps = {
  /** The steps in order. Two or more. */
  items: { type: Array as PropType<KjunStepItem[]>, required: true },
  /** Index of the current step, counted from 0. items.length means every step is complete. */
  current: { type: Number, required: true },
  /** error marks the current step as failed (a failed payment, a failed delivery). */
  currentStatus: { type: String as PropType<KjunStepsCurrentStatus>, default: "active" },
  orientation: { type: String as PropType<"horizontal" | "vertical">, default: "horizontal" },
  /** Horizontal only. auto folds to a compact header and bare markers when the container is narrower than 80px per step. */
  layout: { type: String as PropType<KjunStepsLayout>, default: "auto" },
  /** Names the list; defaults to the "진행 단계" message. */
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunStepsProps = ExtractPublicPropTypes<typeof kjunStepsProps>;

/** Progress through an ordered flow: a wizard, a checkout, a delivery trail. Listen to step-select to make completed steps buttons. */
export const KjunSteps = defineComponent({
  name: "KjunSteps",
  props: kjunStepsProps,
  emits: { "step-select": (_index: number) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    // Completed steps become buttons only when someone listens for step-select.
    const instance = getCurrentInstance();
    watch(() => props.items.length, count => {
      if (count < 2 && developmentMode()) console.warn("[KJUN] KjunSteps expects two or more items.");
    }, { immediate: true });

    return () => {
      const { items, orientation, layout, currentStatus } = props;
      const count = items.length;
      const at = clampCurrent(props.current, count);
      const vertical = orientation === "vertical";
      const selectable = !!(instance?.vnode.props?.onStepSelect || instance?.vnode.props?.["onStep-select"]);
      const statusText: Record<KjunStepStatus, string> = { complete: m.value.stepComplete, current: m.value.stepCurrent, error: m.value.stepError, upcoming: m.value.stepUpcoming };
      // The compact header names the current step, or the last one once everything is complete.
      const shown = Math.min(at, count - 1), headItem = items[shown], next = at < count ? items[at + 1] : undefined;
      const total = m.value.stepCount(shown + 1, count), lead = String(shown + 1);

      return (
        <div class="kjun-steps" data-orientation={orientation} data-layout={layout} data-count={count} data-status={stepsRootStatus(at, count, currentStatus)}>
          {!vertical && headItem && (
            <div class="kjun-steps-head" aria-hidden="true">
              <span class="kjun-steps-head-title" aria-hidden="true">{headItem.label}</span>
              <span class="kjun-steps-head-count" aria-hidden="true">{total.startsWith(lead) ? <><b>{lead}</b>{total.slice(lead.length)}</> : total}</span>
              {next && <span class="kjun-steps-head-next" aria-hidden="true">{m.value.stepNext} · {next.label}</span>}
            </div>
          )}
          <ol class="kjun-steps-list" aria-label={props.ariaLabel ?? m.value.steps}>
            {items.map((item, i) => {
              const status = stepStatus(i, at, currentStatus);
              const detail = vertical ? [item.meta, item.description].filter(Boolean).join(" · ") : "";
              // One phrase names the step for a screen reader: the button carries it as its name, the static copy as hidden text.
              const spoken = m.value.stepPosition(i + 1) + ", " + item.label + ", " + statusText[status] + (detail ? ", " + detail : "");
              const body = [
                // steps.css sizes the icon from extensions.steps.markerIcon.
                <span key="marker" class="kjun-steps-marker" aria-hidden="true">
                  {status === "complete" ? <KjunIcon name="check" />
                    : status === "error" ? <KjunIcon name="exclamation-mark" />
                    : i + 1}
                </span>,
                <span key="label" class="kjun-steps-label" title={item.label} aria-hidden="true">{item.label}</span>,
                detail ? (
                  <span key="detail" class="kjun-steps-detail" aria-hidden="true">
                    {item.meta && <span class="kjun-steps-meta">{item.meta}</span>}
                    {item.meta && item.description ? " · " : ""}{item.description}
                  </span>
                ) : null,
              ];
              return (
                <li key={item.key ?? i} class="kjun-steps-item" data-status={status} aria-current={status === "current" || status === "error" ? "step" : undefined}>
                  <span class="kjun-steps-static">{body}<span class="kjun-sr-only">{spoken}</span></span>
                  {selectable && status === "complete" && (
                    <button type="button" class="kjun-steps-hit" aria-label={spoken} onClick={() => emit("step-select", i)}>{body}</button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      );
    };
  },
});
