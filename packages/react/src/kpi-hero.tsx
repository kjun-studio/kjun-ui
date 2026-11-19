import { tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  KPI_MASK, KPI_MISSING, kpiCssColor, kpiCssTint, kpiDelta, kpiDeltaIcon, kpiDeltaValue, kpiFormat, kpiHeroNeedsDomain,
  kpiNumber, kpiPresent, kpiShowDelta, kpiTone,
} from "../../../shared/package-runtime/kpi";
import { type ReactNode } from "react";
import { KjunSkeleton } from "./display";
import { KjunAnimatedNumber } from "./financial";
import { KjunIcon } from "./button";

export interface KpiValue {
  label?: string;
  /** null, undefined and non-finite numbers are missing and show missingText. */
  value: number | string | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  semantic?: "price" | "status";
  showSign?: boolean;
  formatter?: (value: number) => string;
  /** Shown for a missing value; defaults to an em dash. */
  missingText?: string;
  desc?: string;
  descClass?: string;
  valueClass?: string;
}
/** Masked digits: the mask is drawn, screen readers hear the hidden word. */
export function KpiMasked({ label }: { label: string }) {
  return <><span aria-hidden="true">{KPI_MASK}</span><span className="kjun-sr-only">{label}</span></>;
}
export interface KjunKpiHeroProps {
  loading?: boolean;
  label: string;
  /** null, undefined and non-finite numbers are missing and show missingText. */
  value: number | string | null;
  /** Shown for a missing value; defaults to an em dash. */
  missingText?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  deltaAbsolute?: number | null;
  deltaPercent?: number | null;
  /** Digits after the point in the percent change. Defaults to 1. */
  deltaPercentDecimals?: number;
  deltaDescription?: string;
  secondary?: KpiValue[];
  animated?: boolean;
  size?: "md" | "sm";
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface?: "card" | "none";
  aside?: ReactNode;
  /** An app control after the label, such as a mask toggle or an info tooltip trigger; it keeps the label's line height. */
  labelAside?: ReactNode;
  /** Narrow screens: "below" (default) moves the aside under the delta line at full width; "hidden" drops it. */
  asideMobile?: "below" | "hidden";
  /** Draws the direction as a filled caret before the first delta number, in place of its sign. */
  deltaIcon?: boolean;
  /** Hides every amount behind a mask, with no direction colour; screen readers hear "hidden". */
  masked?: boolean;
  formatter?: (value: number) => string;
  deltaFormatter?: (value: number, kind: "absolute" | "percent") => string;
  renderSecondary?: (item: KpiValue, index: number) => ReactNode;
}
export function KjunKpiHero(props: KjunKpiHeroProps) {
  const {
    loading = false, label, value, missingText, prefix = "", suffix = "", decimals = 0, deltaPercentDecimals = 1,
    deltaDescription = "", secondary = [], animated = true, size = "md", surface = "card", aside, asideMobile = "below",
    deltaIcon = false, masked = false, formatter, deltaFormatter, renderSecondary, labelAside,
  } = props;
  const scope = useKjunMessageScope(), locale = scope.intl, hidden = <KpiMasked label={scope.messages.hiddenValue} />;
  const absolute = kpiDeltaValue(props.deltaAbsolute), percent = kpiDeltaValue(props.deltaPercent);
  const deltaOptions = { decimals, percentDecimals: deltaPercentDecimals, locale, formatted: !!deltaFormatter };
  const showDelta = kpiShowDelta(absolute, percent, deltaDescription, loading, props);
  const delta = (v: number, kind: "absolute" | "percent") => {
    if (masked) return hidden;
    const { direction, sign, number } = kpiDelta(v, kind, deltaOptions);
    // The caret marks the first delta number shown; screen readers still hear its sign.
    const icon = kpiDeltaIcon(deltaIcon, direction, kind, absolute !== null);
    return <>
      {icon && <KjunIcon name="caret-up" filled className="kjun-kpi-hero__delta-icon" data-direction={direction > 0 ? "up" : "down"} aria-hidden="true" />}
      {icon && !deltaFormatter && <span className="kjun-sr-only">{sign}</span>}
      {deltaFormatter ? deltaFormatter(v, kind) : <>
        {!icon && sign}
        {kind === "absolute" && prefix && <span className="kjun-number-affix" data-side="prefix">{prefix}</span>}
        {number}
        {kind === "absolute" && suffix && <span className="kjun-number-affix" data-side="suffix">{suffix}</span>}
        {kind === "percent" && <span className="kjun-number-affix" data-side="suffix">%</span>}
      </>}
    </>;
  };
  const direction = (v: number, kind: "absolute" | "percent") => (masked ? 0 : kpiDelta(v, kind, deltaOptions).direction);
  return (
    <div
      className={"kjun-kpi-hero" + (size === "sm" ? " kjun-kpi-hero--sm" : "")}
      data-surface={surface === "none" ? "none" : undefined}
      data-aside-mobile={asideMobile === "hidden" ? "hidden" : undefined}
      ref={domainColorRef(kpiHeroNeedsDomain({ loading, masked, absolute, percent, secondary, ...deltaOptions }))}
      aria-busy={loading}
    >
      <div className="kjun-kpi-hero__layout">
        <div className="kjun-kpi-hero__main">
          <div className="kjun-kpi-hero__label">
            {label}
            {hasContent(labelAside) && <span className="kjun-kpi-hero__label-aside">{labelAside}</span>}
          </div>
          <div className="kjun-kpi-hero__value">
            {loading ? <KjunSkeleton type="line" width="7ch" />
              : masked && kpiPresent(value) ? hidden
              : !kpiPresent(value) ? missingText ?? KPI_MISSING
              : <>
                {prefix && <span className="kjun-kpi-hero__affix">{prefix}</span>}
                <KjunAnimatedNumber value={value} decimals={decimals} animated={animated} formatter={formatter ?? (n => kpiNumber(n, decimals, locale))} />
                {suffix && <span className="kjun-kpi-hero__affix">{suffix}</span>}
              </>}
          </div>
          {showDelta && (
            <div className="kjun-kpi-hero__delta-line">
              {loading ? (
                // The placeholder takes the delta numbers' line height, like Vue, so the hero keeps its loaded height.
                <span className="kjun-kpi-hero__delta-abs"><KjunSkeleton type="line" width={tokens.extensions.kpiHero.deltaSkeletonWidth} /></span>
              ) : <>
                {absolute !== null && (
                  <span className="kjun-kpi-hero__delta-abs" style={{ color: kpiCssColor(direction(absolute, "absolute"), "text-tertiary") }}>
                    {delta(absolute, "absolute")}
                  </span>
                )}
                {percent !== null && (
                  <span className="kjun-kpi-hero__delta-pct"
                    style={{ color: kpiCssColor(direction(percent, "percent"), "text-tertiary"), background: kpiCssTint(direction(percent, "percent")) }}>
                    {delta(percent, "percent")}
                  </span>
                )}
                {deltaDescription && <span className="kjun-kpi-hero__delta-desc">{deltaDescription}</span>}
              </>}
            </div>
          )}
        </div>
        {aside && <div className="kjun-kpi-hero__aside">{aside}</div>}
      </div>
      {secondary.length > 0 && (
        <div className="kjun-kpi-hero__secondary">
          {secondary.map((item, i) => {
            const present = kpiPresent(item.value), custom = loading ? null : renderSecondary?.(item, i);
            return (
              <div key={i} className="kjun-kpi-hero__sec-item">
                <div className="kjun-kpi-hero__sec-label">{item.label}</div>
                <div className={"kjun-kpi-hero__sec-value " + (item.valueClass || "")}
                  style={{ color: item.valueClass ? undefined : kpiCssColor(masked ? null : kpiTone(item)) }}>
                  {loading ? <KjunSkeleton type="line" width="5ch" />
                    : masked && present ? hidden
                    : hasContent(custom) ? custom : (present ? <>
                      {item.prefix && <span className="kjun-kpi-hero__sec-affix">{item.prefix}</span>}
                      <span>{kpiFormat(item, item.value, locale)}</span>
                      {item.suffix && <span className="kjun-kpi-hero__sec-affix">{item.suffix}</span>}
                    </> : kpiFormat(item, item.value, locale))}
                </div>
                {item.desc && (
                  // Like KpiRow, a descClass owns the colour; otherwise the description is tertiary text.
                  <div className={"kjun-kpi-hero__sec-desc " + (item.descClass || "")}
                    style={{ color: item.descClass ? undefined : "var(--_kjun-color-text-tertiary)" }}>
                    {loading ? <KjunSkeleton type="line" width="7ch" /> : item.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
