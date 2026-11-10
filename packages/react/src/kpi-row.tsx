import { tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  kpiBadgeRoles, kpiCssColor, kpiFormat, kpiKeyAction, kpiPresent, kpiRowNeedsDomain, kpiSummaryLayout, kpiTone,
  type KpiBadgeVariant,
} from "../../../shared/package-runtime/kpi";
import { type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { KjunSkeleton } from "./display";
import { KjunAnimatedNumber } from "./financial";
import { KjunIcon } from "./button";
import { KpiMasked, type KpiValue } from "./kpi-hero";

export interface KpiRowItem extends Omit<KpiValue, "value"> {
  /** null/undefined and non-finite numbers are missing, never zero. Loading still takes precedence. */
  value?: number | string | null;
  loading?: boolean;
  clickable?: boolean;
  /** Draws the cell as a link to this address; it is clickable, and onItemClick still runs with the click event. */
  href?: string;
  mobileFull?: boolean;
  mobileSecondary?: boolean;
  mobileNeutral?: boolean;
  valueKind?: "text" | "number";
  animated?: boolean;
  valueSegments?: {
    text: string;
    label?: string;
    separator?: boolean;
    class?: string;
  }[];
  badge?: { text: string; variant?: KpiBadgeVariant } | null;
  badgePlacement?: "label" | "value";
}
export interface KjunKpiRowProps {
  loading?: boolean;
  items: KpiRowItem[];
  size?: "md" | "sm";
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface?: "card" | "none";
  mobileSummary?: boolean;
  /** Hides number values and segments behind a mask, with no direction colour; text values, badges and descriptions stay. */
  masked?: boolean;
  /** The event lets a link cell's router call preventDefault. */
  onItemClick?: (item: KpiRowItem, index: number, event: MouseEvent | KeyboardEvent) => void;
  renderValue?: (item: KpiRowItem, index: number) => ReactNode;
}
export function KjunKpiRow({
  loading = false,
  items,
  size = "md",
  surface = "card",
  mobileSummary = true,
  masked = false,
  onItemClick,
  renderValue,
}: KjunKpiRowProps) {
  const scope = useKjunMessageScope(), locale = scope.intl;
  const { secondary, lastFull } = kpiSummaryLayout(items);
  const badge = (item: KpiRowItem) => {
    if (!item.badge) return null;
    const roles = kpiBadgeRoles(item.badge.variant);
    return (
      <span className="kjun-kpi-row__badge" style={{ color: `var(--_kjun-color-${roles.text})`, background: `var(--_kjun-color-${roles.bg})` }}>
        {item.badge.text}
      </span>
    );
  };
  return (
    <div
      className={
        "kjun-kpi-row" +
        (size === "sm" ? " kjun-kpi-row--sm" : "") +
        (items[0]?.mobileFull ? " kjun-kpi-row--hero-first" : "") +
        (mobileSummary && size !== "sm" ? " kjun-kpi-row--mobile-summary" : "")
      }
      data-surface={surface === "none" ? "none" : undefined}
      aria-busy={loading || items.some((item) => item.loading)}
      ref={domainColorRef(kpiRowNeedsDomain(loading, masked, items))}
    >
      {items.map((item, i) => {
        const busy = loading || !!item.loading,
          value = item.value,
          present = kpiPresent(value),
          link = !!item.href,
          clickable = !!item.clickable || link,
          hide = masked && item.valueKind !== "text" && (present || !!item.valueSegments),
          format = (number: number | string | null | undefined) => kpiFormat(item, number, locale);
        const className =
          "kjun-kpi-row__item" +
          (clickable ? " kjun-kpi-row__item--clickable" : "") +
          (item.mobileFull ? " kjun-kpi-row__item--full" : "") +
          (mobileSummary && i === lastFull ? " kjun-kpi-row__item--summary-full" : "") +
          (secondary[i] ? " kjun-kpi-row__item--secondary" : "") +
          (item.valueSegments?.some((s) => s.label) ? " kjun-kpi-row__item--labeled-segments" : "");
        const key = (event: KeyboardEvent) => {
          const action = kpiKeyAction(event.type as "keydown" | "keyup", event.key, event.repeat);
          if (action) event.preventDefault();
          if (action === "activate" && !busy) onItemClick?.(item, i, event);
        };
        const content = <>
          <div className="kjun-kpi-row__label-row">
            <div className="kjun-kpi-row__label">
              {busy && !item.label ? <KjunSkeleton type="line" width={tokens.extensions.kpiRow.labelSkeletonWidth} /> : item.label}
            </div>
            {!busy && item.badgePlacement !== "value" && badge(item)}
          </div>
          <div className="kjun-kpi-row__value-row">
            <div
              className={
                "kjun-kpi-row__value " +
                (item.valueClass || "") +
                (item.valueKind === "text" ? " kjun-kpi-row__value--text" : "") +
                (item.mobileNeutral ? " kjun-kpi-row__value--mobile-neutral" : "")
              }
              title={item.valueKind === "text" && present ? String(value) : undefined}
              style={{ color: item.valueClass ? undefined : kpiCssColor(hide ? null : kpiTone(item)) }}
            >
              {busy && !item.valueSegments ? <KjunSkeleton type="line" width="5ch" />
                : hide && !busy ? <KpiMasked label={scope.messages.hiddenValue} />
                : item.valueSegments ? item.valueSegments.map((seg, j) => (
                  <span key={j}
                    className={(seg.class || "") + (seg.label ? " kjun-kpi-row__segment--labeled" : "") + (seg.separator ? " kjun-kpi-row__segment--separator" : "")}>
                    {seg.label && <span className="kjun-kpi-row__segment-label">{seg.label}</span>}
                    {busy && !seg.separator ? <KjunSkeleton type="line" width="3ch" /> : seg.text}
                  </span>
                ))
                : renderValue?.(item, i) || (present ? <>
                  {item.prefix && <span className="kjun-kpi-row__affix" data-side="prefix">{item.prefix}</span>}
                  {item.animated && typeof value === "number" ? <KjunAnimatedNumber fromPrevious value={value} formatter={format} /> : format(value)}
                  {item.suffix && <span className="kjun-kpi-row__affix" data-side="suffix">{item.suffix}</span>}
                </> : format(value))}
            </div>
            {!busy && item.badgePlacement === "value" && badge(item)}
            {clickable && <KjunIcon name="chevron-right" className="kjun-kpi-row__chevron" aria-hidden="true" />}
          </div>
          {item.desc && (
            <div className={"kjun-kpi-row__desc " + (item.descClass || "")}
              style={{ color: item.descClass ? undefined : kpiCssColor(hide ? null : kpiTone(item), "text-secondary") }}>
              {busy ? <KjunSkeleton type="line" width="7ch" /> : item.desc}
            </div>
          )}
        </>;
        const state = busy ? "loading" : present || item.valueSegments ? "ready" : "missing";
        // A link cell is a real link, so it opens in a new tab and its address can be copied; a busy link has no address.
        if (link) return (
          <a key={i} className={className} href={busy ? undefined : item.href} data-state={state} aria-disabled={busy || undefined}
            onClick={(event) => (busy ? event.preventDefault() : onItemClick?.(item, i, event))}>
            {content}
          </a>
        );
        return (
          <div
            key={i}
            role={clickable ? "button" : undefined}
            tabIndex={clickable && !busy ? 0 : undefined}
            data-state={state}
            aria-disabled={(clickable && busy) || undefined}
            className={className}
            onClick={clickable ? (event) => { if (!busy) onItemClick?.(item, i, event); } : undefined}
            onKeyDown={clickable ? key : undefined}
            onKeyUp={clickable ? key : undefined}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
