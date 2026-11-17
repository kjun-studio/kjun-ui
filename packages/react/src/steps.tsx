import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { clampCurrent, stepStatus, stepsRootStatus, type KjunStepItem, type KjunStepStatus, type KjunStepsCurrentStatus, type KjunStepsLayout } from "../../../shared/package-runtime/steps";
import { useEffect, type CSSProperties } from "react";
import { KjunIcon } from "./button";

export type { KjunStepItem, KjunStepStatus, KjunStepsCurrentStatus, KjunStepsLayout };

export interface KjunStepsProps {
  /** The steps in order. Two or more. */
  items: KjunStepItem[];
  /** Index of the current step, counted from 0. items.length means every step is complete. */
  current: number;
  /** error marks the current step as failed (a failed payment, a failed delivery). */
  currentStatus?: KjunStepsCurrentStatus;
  orientation?: "horizontal" | "vertical";
  /** Horizontal only. auto folds to a compact header and bare markers when the container is narrower than 80px per step. */
  layout?: KjunStepsLayout;
  /** Names the list; defaults to the "진행 단계" message. */
  ariaLabel?: string;
  /** Makes each completed step a button in the wide horizontal layout and in the vertical one. */
  onStepSelect?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
  [data: `data-${string}`]: string | undefined;
}

function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}

/** Progress through an ordered flow: a wizard, a checkout, a delivery trail. */
export function KjunSteps({ items, current, currentStatus = "active", orientation = "horizontal", layout = "auto", ariaLabel,
  onStepSelect, className, style, id, ...rest }: KjunStepsProps) {
  const m = useKjunMessages();
  const count = items.length;
  useEffect(() => {
    if (count < 2 && developmentMode()) console.warn("[KJUN] KjunSteps expects two or more items.");
  }, [count]);
  const at = clampCurrent(current, count);
  const vertical = orientation === "vertical";
  const statusText: Record<KjunStepStatus, string> = { complete: m.stepComplete, current: m.stepCurrent, error: m.stepError, upcoming: m.stepUpcoming };
  // The compact header names the current step, or the last one once everything is complete.
  const shown = Math.min(at, count - 1), headItem = items[shown], next = at < count ? items[at + 1] : undefined;
  const total = m.stepCount(shown + 1, count), lead = String(shown + 1);

  return (
    <div {...rest} id={id} className={"kjun-steps" + (className ? " " + className : "")} style={style}
      data-orientation={orientation} data-layout={layout} data-count={count} data-status={stepsRootStatus(at, count, currentStatus)}>
      {!vertical && headItem && (
        <div className="kjun-steps-head" aria-hidden="true">
          <span className="kjun-steps-head-title">{headItem.label}</span>
          <span className="kjun-steps-head-count">{total.startsWith(lead) ? <><b>{lead}</b>{total.slice(lead.length)}</> : total}</span>
          {next && <span className="kjun-steps-head-next">{m.stepNext} · {next.label}</span>}
        </div>
      )}
      <ol className="kjun-steps-list" aria-label={ariaLabel ?? m.steps}>
        {items.map((item, i) => {
          const status = stepStatus(i, at, currentStatus);
          const detail = vertical ? [item.meta, item.description].filter(Boolean).join(" · ") : "";
          // One phrase names the step for a screen reader: the button carries it as its name, the static copy as hidden text.
          const spoken = m.stepPosition(i + 1) + ", " + item.label + ", " + statusText[status] + (detail ? ", " + detail : "");
          const body = (
            <>
              {/* steps.css sizes the icon from extensions.steps.markerIcon. */}
              <span className="kjun-steps-marker" aria-hidden="true">
                {status === "complete" ? <KjunIcon name="check" />
                  : status === "error" ? <KjunIcon name="exclamation-mark" />
                  : i + 1}
              </span>
              <span className="kjun-steps-label" title={item.label} aria-hidden="true">{item.label}</span>
              {detail && <span className="kjun-steps-detail" aria-hidden="true">{detail}</span>}
            </>
          );
          return (
            <li key={item.key ?? i} className="kjun-steps-item" data-status={status} aria-current={status === "current" || status === "error" ? "step" : undefined}>
              <span className="kjun-steps-static">{body}<span className="kjun-sr-only">{spoken}</span></span>
              {onStepSelect && status === "complete" && (
                <button type="button" className="kjun-steps-hit" aria-label={spoken} onClick={() => onStepSelect(i)}>{body}</button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
