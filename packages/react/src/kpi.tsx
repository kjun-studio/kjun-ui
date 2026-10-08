import { tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { type ReactNode } from "react";
import { DsSkeleton } from "./display";
import { DsAnimatedNumber } from "./financial";
export interface KpiValue {
  label?: string;
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  semantic?: "price" | "status";
  showSign?: boolean;
  formatter?: (value: number) => string;
  desc?: string;
  descClass?: string;
  valueClass?: string;
}
export const kpiFormat = (item: KpiValue, value = item.value): string =>
  typeof value === "string"
    ? value
    : item.formatter
    ? item.formatter(value)
    : (item.showSign && value > 0
        ? "+"
        : item.semantic === "price" && value < 0
        ? "−"
        : "") +
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: item.decimals ?? 0,
        maximumFractionDigits: item.decimals ?? 0,
      }).format(item.semantic === "price" ? Math.abs(value) : value);
export const kpiColor = (value: unknown, semantic?: string, neutral = "text") =>
  semantic === "price" && Number(value) !== 0
    ? `var(--_kjun-color-price-${Number(value) > 0 ? "up" : "down"})`
    : `var(--_kjun-color-${neutral})`;
export interface DsKpiHeroProps {
  loading?: boolean;
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  deltaAbsolute?: number | null;
  deltaPercent?: number | null;
  deltaDescription?: string;
  secondary?: KpiValue[];
  animated?: boolean;
  size?: "md" | "sm";
  aside?: ReactNode;
  formatter?: (value: number) => string;
  deltaFormatter?: (value: number, kind: "absolute" | "percent") => string;
  renderSecondary?: (item: KpiValue, index: number) => ReactNode;
}
export function DsKpiHero(props: DsKpiHeroProps) {
  const {
    loading = false,
    label,
    value,
    prefix = "",
    suffix = "",
    decimals = 0,
    deltaAbsolute = null,
    deltaPercent = null,
    deltaDescription = "",
    secondary = [],
    animated = true,
    size = "md",
    aside,
    formatter,
    deltaFormatter,
    renderSecondary,
  } = props;
  const showDelta =
    deltaAbsolute !== null ||
    deltaPercent !== null ||
    !!deltaDescription ||
    (loading &&
      ["deltaAbsolute", "deltaPercent", "deltaDescription"].some((key) =>
        Object.prototype.hasOwnProperty.call(props, key)
      ));
  const delta = (v: number, kind: "absolute" | "percent") =>
    deltaFormatter ? deltaFormatter(v, kind) : <>
      {v > 0 ? "+" : v < 0 ? "−" : ""}
      {kind === "absolute" && prefix && <span className="kjun-number-affix" data-side="prefix">{prefix}</span>}
      {new Intl.NumberFormat(undefined, {
        minimumFractionDigits: kind === "absolute" ? decimals : 1,
        maximumFractionDigits: kind === "absolute" ? decimals : 1,
      }).format(Math.abs(v))}
      {kind === "percent" && <span className="kjun-number-affix" data-side="suffix">%</span>}
    </>;
  return (
    <div
      className={"kjun-kpi-hero" + (size === "sm" ? " kjun-kpi-hero--sm" : "")}
      ref={domainColorRef(!loading && (Number(deltaAbsolute) !== 0 || Number(deltaPercent) !== 0 ||
        secondary.some(item => item.semantic === 'price' && Number(item.value) !== 0)))}
      aria-busy={loading}
    >
      <div className="kjun-kpi-hero__layout">
        <div className="kjun-kpi-hero__main">
          <div className="kjun-kpi-hero__label">{label}</div>
          <div className="kjun-kpi-hero__value">
            {loading ? (
              <DsSkeleton type="block" height="1lh" width="7ch" />
            ) : (
              <>
                {prefix && (
                  <span className="kjun-kpi-hero__affix">{prefix}</span>
                )}
                <DsAnimatedNumber
                  value={value}
                  decimals={decimals}
                  animated={animated}
                  formatter={formatter}
                />
                {suffix && (
                  <span className="kjun-kpi-hero__affix">{suffix}</span>
                )}
              </>
            )}
          </div>
          {showDelta && (
            <div className="kjun-kpi-hero__delta-line">
              {loading ? (
                // The placeholder takes the delta numbers' line height, like Vue, so the hero keeps its loaded height.
                <span className="kjun-kpi-hero__delta-abs"><DsSkeleton type="block" height="1lh" width={tokens.extensions.kpiHero.deltaSkeletonWidth} /></span>
              ) : (
                <>
                  {deltaAbsolute !== null && (
                    <span
                      className="kjun-kpi-hero__delta-abs"
                      style={{
                        color: kpiColor(
                          deltaAbsolute,
                          "price",
                          "text-tertiary"
                        ),
                      }}
                    >
                      {delta(deltaAbsolute, "absolute")}
                    </span>
                  )}
                  {deltaPercent !== null && (
                    <span
                      className="kjun-kpi-hero__delta-pct"
                      style={{
                        color: kpiColor(deltaPercent, "price", "text-tertiary"),
                      }}
                    >
                      {delta(deltaPercent, "percent")}
                    </span>
                  )}
                  {deltaDescription && (
                    <span className="kjun-kpi-hero__delta-desc">
                      {deltaDescription}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        {aside && <div className="kjun-kpi-hero__aside">{aside}</div>}
      </div>
      {secondary.length > 0 && (
        <div className="kjun-kpi-hero__secondary">
          {secondary.map((item, i) => (
            <div key={i} className="kjun-kpi-hero__sec-item">
              <div className="kjun-kpi-hero__sec-label">{item.label}</div>
              <div
                className="kjun-kpi-hero__sec-value"
                style={{ color: kpiColor(item.value, item.semantic) }}
              >
                {loading ? (
                  <DsSkeleton type="block" height="1lh" width="5ch" />
                ) : (
                  renderSecondary?.(item, i) || (
                    <>
                      {item.prefix && (
                        <span className="kjun-kpi-hero__sec-affix">
                          {item.prefix}
                        </span>
                      )}
                      <span>{kpiFormat(item)}</span>
                      {item.suffix && (
                        <span className="kjun-kpi-hero__sec-affix">
                          {item.suffix}
                        </span>
                      )}
                    </>
                  )
                )}
              </div>
              {item.desc && (
                <div
                  className={
                    "kjun-kpi-hero__sec-desc " + (item.descClass || "")
                  }
                  style={{ color: "var(--_kjun-color-text-tertiary)" }}
                >
                  {loading ? (
                    <DsSkeleton type="block" width="7ch" height="1lh" />
                  ) : (
                    item.desc
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export interface KpiRowItem extends KpiValue {
  loading?: boolean;
  clickable?: boolean;
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
  badge?: {
    text: string;
    variant?:
      | "warning"
      | "success"
      | "danger"
      | "price-up"
      | "price-down"
      | "info"
      | "neutral";
  };
  badgePlacement?: "label" | "value";
}
export interface DsKpiRowProps {
  loading?: boolean;
  items: KpiRowItem[];
  size?: "md" | "sm";
  mobileSummary?: boolean;
  onItemClick?: (item: KpiRowItem, index: number) => void;
  renderValue?: (item: KpiRowItem, index: number) => ReactNode;
}
export function DsKpiRow({
  loading = false,
  items,
  size = "md",
  mobileSummary = true,
  onItemClick,
  renderValue,
}: DsKpiRowProps) {
  const explicit = items.some(
      (item) => typeof item.mobileSecondary === "boolean"
    ),
    hasFull = items.some((item) => item.mobileFull),
    secondary = items.map((item, i) =>
      explicit
        ? item.mobileSecondary === true
        : hasFull
        ? !item.mobileFull
        : i >= 2
    ),
    primary = items.flatMap((item, i) =>
      !secondary[i] && !item.mobileFull ? [i] : []
    ),
    lastFull = primary.length % 2 ? primary[primary.length - 1] : -1;
  const badge = (item: KpiRowItem) => {
    if (!item.badge) return null;
    const v = item.badge.variant || "neutral",
      dot = ["warning", "success", "danger", "price-up", "price-down"].includes(
        v
      ),
      role = v === "neutral" ? "text-secondary" : v === "info" ? "brand" : v;
    return (
      <span
        className="kjun-kpi-row__badge"
        style={{
          color: `var(--_kjun-color-${role})`,
          background: `var(--_kjun-color-${
            v === "neutral" ? "secondary" : v === "info" ? "info-bg" : v + "-bg"
          })`,
        }}
      >
        {dot && (
          <span
            className="kjun-kpi-row__badge-dot"
            style={{ background: "currentColor" }}
          />
        )}
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
      aria-busy={loading || items.some((item) => item.loading)}
      ref={domainColorRef(!loading && items.some(item => !item.loading && (
        item.semantic === 'price' && Number(item.value) !== 0 || item.badge?.variant?.startsWith('price-'))))}
    >
      {items.map((item, i) => {
        const busy = loading || !!item.loading,
          click = () => {
            if (!busy && item.clickable) onItemClick?.(item, i);
          };
        return (
          <div
            key={i}
            role={item.clickable ? "button" : undefined}
            tabIndex={item.clickable && !busy ? 0 : undefined}
            aria-disabled={(item.clickable && busy) || undefined}
            className={
              "kjun-kpi-row__item" +
              (item.clickable ? " kjun-kpi-row__item--clickable" : "") +
              (item.mobileFull ? " kjun-kpi-row__item--full" : "") +
              (mobileSummary && i === lastFull
                ? " kjun-kpi-row__item--summary-full"
                : "") +
              (secondary[i] ? " kjun-kpi-row__item--secondary" : "") +
              (item.valueSegments?.some((s) => s.label)
                ? " kjun-kpi-row__item--labeled-segments"
                : "")
            }
            onClick={click}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                click();
              }
            }}
          >
            <div className="kjun-kpi-row__label-row">
              <div className="kjun-kpi-row__label">
                {busy && !item.label ? (
                  <DsSkeleton type="block" width={tokens.extensions.kpiRow.labelSkeletonWidth} height={tokens.extensions.kpiRow.labelSkeletonHeight} />
                ) : (
                  item.label
                )}
              </div>
              {!busy && item.badgePlacement !== "value" && badge(item)}
            </div>
            <div className="kjun-kpi-row__value-row">
              <div
                className={
                  "kjun-kpi-row__value " +
                  (item.valueClass || "") +
                  (item.valueKind === "text"
                    ? " kjun-kpi-row__value--text"
                    : "") +
                  (item.mobileNeutral
                    ? " kjun-kpi-row__value--mobile-neutral"
                    : "")
                }
                title={
                  item.valueKind === "text" ? String(item.value) : undefined
                }
                style={{
                  color: item.valueClass
                    ? undefined
                    : kpiColor(item.value, item.semantic),
                }}
              >
                {item.valueSegments ? (
                  item.valueSegments.map((seg, j) => (
                    <span
                      key={j}
                      className={
                        (seg.class || "") +
                        (seg.label ? " kjun-kpi-row__segment--labeled" : "") +
                        (seg.separator
                          ? " kjun-kpi-row__segment--separator"
                          : "")
                      }
                    >
                      {seg.label && (
                        <span className="kjun-kpi-row__segment-label">
                          {seg.label}
                        </span>
                      )}
                      {busy && !seg.separator ? (
                        <DsSkeleton type="block" height="1lh" width="3ch" />
                      ) : (
                        seg.text
                      )}
                    </span>
                  ))
                ) : busy ? (
                  <DsSkeleton type="block" height="1lh" width="5ch" />
                ) : (
                  renderValue?.(item, i) || (
                    <>
                      {item.prefix && (
                        <span className="kjun-kpi-row__affix">
                          {item.prefix}
                        </span>
                      )}
                      {item.animated && typeof item.value === "number" ? (
                        <DsAnimatedNumber
                          fromPrevious
                          value={item.value}
                          formatter={(v) => kpiFormat(item, v)}
                        />
                      ) : (
                        kpiFormat(item)
                      )}
                      {item.suffix && (
                        <span className="kjun-kpi-row__affix">
                          {item.suffix}
                        </span>
                      )}
                    </>
                  )
                )}
              </div>
              {!busy && item.badgePlacement === "value" && badge(item)}
            </div>
            {item.desc && (
              <div
                className={"kjun-kpi-row__desc " + (item.descClass || "")}
                style={{
                  color: item.descClass
                    ? undefined
                    : kpiColor(item.value, item.semantic, "text-secondary"),
                }}
              >
                {busy ? (
                  <DsSkeleton type="block" height="1lh" width="7ch" />
                ) : (
                  item.desc
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
