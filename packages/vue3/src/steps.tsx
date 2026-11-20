import { useKjunMessages } from "./runtime/messages";
import { getCurrentInstance, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { developmentMode } from "../../../shared/package-runtime/development";
import { stepDetail, stepSelectable, stepSpoken, stepsCurrent, stepsHead, stepsRootStatus, stepsStatuses, type KjunStepItem, type KjunStepStatus, type KjunStepsCurrentStatus, type KjunStepsLayout, type KjunStepsSelectable } from "../../../shared/package-runtime/steps";
import { KjunIcon } from "./button";

export type { KjunStepItem, KjunStepStatus, KjunStepsCurrentStatus, KjunStepsLayout, KjunStepsSelectable };

const kjunStepsProps = {
  /** The steps in order. Two or more. */
  items: { type: Array as PropType<KjunStepItem[]>, required: true },
  /** Index of the current step, counted from 0. items.length means every step is complete. Optional when the items carry
   * their own status: the first step marked current or error is then the current one. */
  current: { type: Number, default: undefined },
  /** error marks the current step as failed (a failed payment, a failed delivery). */
  currentStatus: { type: String as PropType<KjunStepsCurrentStatus>, default: "active" },
  orientation: { type: String as PropType<"horizontal" | "vertical">, default: "horizontal" },
  /** Horizontal only. auto folds to a compact header and bare markers when the container is narrower than 80px per step. */
  layout: { type: String as PropType<KjunStepsLayout>, default: "auto" },
  /** Names the list; defaults to the "진행 단계" message. */
  ariaLabel: { type: String, default: undefined },
  /** "complete" (default) lets step-select go back only; "all" also lets it skip ahead to a later step. */
  selectable: { type: String as PropType<KjunStepsSelectable>, default: "complete" },
} as const;
export type KjunStepsProps = ExtractPublicPropTypes<typeof kjunStepsProps>;

/** Progress through an ordered flow: a wizard, a checkout, a delivery trail. Listen to step-select to make completed steps buttons
 * (with selectable="all", every step but the current one). */
export const KjunSteps = defineComponent({
  name: "KjunSteps",
  props: kjunStepsProps,
  emits: { "step-select": (_index: number) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    // Steps become buttons only when someone listens for step-select.
    const instance = getCurrentInstance();
    watch(() => props.items.length, count => {
      if (count < 2 && developmentMode()) console.warn("[KJUN] KjunSteps expects two or more items.");
    }, { immediate: true });

    return () => {
      const { items, orientation, layout, currentStatus } = props;
      const count = items.length;
      const at = stepsCurrent(items, props.current), statuses = stepsStatuses(items, at, currentStatus);
      const vertical = orientation === "vertical";
      const selectable = !!(instance?.vnode.props?.onStepSelect || instance?.vnode.props?.["onStep-select"]);
      const head = stepsHead(m.value, items, at);

      return (
        <div class="kjun-steps" data-orientation={orientation} data-layout={layout} data-count={count} data-status={stepsRootStatus(statuses)}>
          {!vertical && head.item && (
            <div class="kjun-steps-head" aria-hidden="true">
              <span class="kjun-steps-head-title" aria-hidden="true">{head.item.label}</span>
              <span class="kjun-steps-head-count" aria-hidden="true">{head.lead && <b>{head.lead}</b>}{head.rest}</span>
              {head.next && <span class="kjun-steps-head-next" aria-hidden="true">{m.value.stepNext} · {head.next.label}</span>}
            </div>
          )}
          <ol class="kjun-steps-list" aria-label={props.ariaLabel ?? m.value.steps}>
            {items.map((item, i) => {
              const status = statuses[i];
              const detail = stepDetail(item, vertical), spoken = stepSpoken(m.value, i, item, status, detail);
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
                <li key={item.key ?? i} class="kjun-steps-item" data-status={status} data-disabled={item.disabled || undefined} aria-current={status === "current" || status === "error" ? "step" : undefined}>
                  <span class="kjun-steps-static">{body}<span class="kjun-sr-only">{spoken}</span></span>
                  {selectable && stepSelectable(status, props.selectable, item.disabled) && (
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
