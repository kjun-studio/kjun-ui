import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { developmentMode } from "../../../shared/package-runtime/development";
import { stepDetail, stepSelectable, stepSpoken, stepsCurrent, stepsHead, stepsRootStatus, stepsStatuses, type KjunStepItem, type KjunStepStatus, type KjunStepsCurrentStatus, type KjunStepsLayout, type KjunStepsSelectable } from "../../../shared/package-runtime/steps";
import { useEffect, type CSSProperties } from "react";
import { KjunIcon } from "./button";

export type { KjunStepItem, KjunStepStatus, KjunStepsCurrentStatus, KjunStepsLayout, KjunStepsSelectable };

export interface KjunStepsProps {
  /** The steps in order. Two or more. */
  items: KjunStepItem[];
  /** Index of the current step, counted from 0. items.length means every step is complete. Optional when the items carry
   * their own status: the first step marked current or error is then the current one. */
  current?: number;
  /** error marks the current step as failed (a failed payment, a failed delivery). */
  currentStatus?: KjunStepsCurrentStatus;
  orientation?: "horizontal" | "vertical";
  /** Horizontal only. auto folds to a compact header and bare markers when the container is narrower than 80px per step. */
  layout?: KjunStepsLayout;
  /** Names the list; defaults to the "진행 단계" message. */
  ariaLabel?: string;
  /** Makes steps buttons in the wide horizontal layout and in the vertical one: completed ones, or with selectable="all" every step but the current one. */
  onStepSelect?: (index: number) => void;
  /** "complete" (default) lets onStepSelect go back only; "all" also lets it skip ahead to a later step. */
  selectable?: KjunStepsSelectable;
  className?: string;
  style?: CSSProperties;
  id?: string;
  [data: `data-${string}`]: string | undefined;
}

/** Progress through an ordered flow: a wizard, a checkout, a delivery trail. */
export function KjunSteps({ items, current, currentStatus = "active", orientation = "horizontal", layout = "auto", ariaLabel,
  onStepSelect, selectable = "complete", className, style, id, ...rest }: KjunStepsProps) {
  const m = useKjunMessages();
  const count = items.length;
  useEffect(() => {
    if (count < 2 && developmentMode()) console.warn("[KJUN] KjunSteps expects two or more items.");
  }, [count]);
  const at = stepsCurrent(items, current), statuses = stepsStatuses(items, at, currentStatus);
  const vertical = orientation === "vertical";
  const head = stepsHead(m, items, at);

  return (
    <div {...rest} id={id} className={"kjun-steps" + (className ? " " + className : "")} style={style}
      data-orientation={orientation} data-layout={layout} data-count={count} data-status={stepsRootStatus(statuses)}>
      {!vertical && head.item && (
        <div className="kjun-steps-head" aria-hidden="true">
          <span className="kjun-steps-head-title" aria-hidden="true">{head.item.label}</span>
          <span className="kjun-steps-head-count" aria-hidden="true">{head.lead && <b>{head.lead}</b>}{head.rest}</span>
          {head.next && <span className="kjun-steps-head-next" aria-hidden="true">{m.stepNext} · {head.next.label}</span>}
        </div>
      )}
      <ol className="kjun-steps-list" aria-label={ariaLabel ?? m.steps}>
        {items.map((item, i) => {
          const status = statuses[i];
          const detail = stepDetail(item, vertical), spoken = stepSpoken(m, i, item, status, detail);
          const body = (
            <>
              {/* steps.css sizes the icon from extensions.steps.markerIcon. */}
              <span className="kjun-steps-marker" aria-hidden="true">
                {status === "complete" ? <KjunIcon name="check" />
                  : status === "error" ? <KjunIcon name="exclamation-mark" />
                  : i + 1}
              </span>
              <span className="kjun-steps-label" title={item.label} aria-hidden="true">{item.label}</span>
              {detail && (
                <span className="kjun-steps-detail" aria-hidden="true">
                  {item.meta && <span className="kjun-steps-meta">{item.meta}</span>}
                  {item.meta && item.description ? " · " : ""}{item.description}
                </span>
              )}
            </>
          );
          return (
            <li key={item.key ?? i} className="kjun-steps-item" data-status={status} data-disabled={item.disabled || undefined} aria-current={status === "current" || status === "error" ? "step" : undefined}>
              <span className="kjun-steps-static">{body}<span className="kjun-sr-only">{spoken}</span></span>
              {onStepSelect && stepSelectable(status, selectable, item.disabled) && (
                <button type="button" className="kjun-steps-hit" aria-label={spoken} onClick={() => onStepSelect(i)}>{body}</button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
