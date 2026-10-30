import { defineComponent, getCurrentInstance, type ExtractPublicPropTypes, type PropType, type VNodeChild, type SlotsType } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunSkeleton } from "./display";
import { KjunAnimatedNumber } from "./number-display";
import { domainRef } from "./runtime/refs";
import { hasContent } from "./runtime/slots";
import type { VNode } from "vue";

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
  typeof value === "string" ? value
    : item.formatter ? item.formatter(value)
    : (item.showSign && value > 0 ? "+" : item.semantic === "price" && value < 0 ? "−" : "") +
      new Intl.NumberFormat(undefined, { minimumFractionDigits: item.decimals ?? 0, maximumFractionDigits: item.decimals ?? 0 })
        .format(item.semantic === "price" ? Math.abs(value) : value);
export const kpiColor = (value: unknown, semantic?: string, neutral = "text") =>
  semantic === "price" && Number.isFinite(Number(value)) && Number(value) !== 0 ? `var(--_kjun-color-price-${Number(value) > 0 ? "up" : "down"})` : `var(--_kjun-color-${neutral})`;
const slotContent = (nodes: VNodeChild) => hasContent(nodes) ? nodes : undefined;

const kjunKpiHeroProps = {
  loading: { type: Boolean, default: false },
  label: { type: String, required: true },
  value: { type: [Number, String] as PropType<number | string>, required: true },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  decimals: { type: Number, default: 0 },
  deltaAbsolute: { type: Number as PropType<number | null>, default: null },
  deltaPercent: { type: Number as PropType<number | null>, default: null },
  deltaDescription: { type: String, default: "" },
  secondary: { type: Array as PropType<KpiValue[]>, default: () => [] },
  animated: { type: Boolean, default: true },
  size: { type: String as PropType<"md" | "sm">, default: "md" },
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface: { type: String as PropType<"card" | "none">, default: "card" },
  formatter: { type: Function as PropType<(value: number) => string>, default: undefined },
  deltaFormatter: { type: Function as PropType<(value: number, kind: "absolute" | "percent") => string>, default: undefined },
} as const;
export type KjunKpiHeroProps = ExtractPublicPropTypes<typeof kjunKpiHeroProps>;
/** Slots: aside, secondary({ item, index }). */
export const KjunKpiHero = defineComponent({
  name: "KjunKpiHero",
  props: kjunKpiHeroProps,
  slots: Object as SlotsType<{
    aside?: () => VNodeChild;
    secondary?: (scope: { item: KpiValue; index: number }) => VNodeChild;
  }>,
  setup(props, { slots }) {
    const instance = getCurrentInstance()!;
    // While loading, a delta line passed by the app keeps its placeholder even before its numbers arrive.
    const deltaPassed = () => ["deltaAbsolute", "deltaPercent", "deltaDescription", "delta-absolute", "delta-percent", "delta-description"]
      .some(key => Object.prototype.hasOwnProperty.call(instance.vnode.props ?? {}, key));
    return () => {
      const { loading, prefix, decimals, deltaAbsolute, deltaPercent, deltaDescription, secondary } = props;
      const showDelta = deltaAbsolute !== null || deltaPercent !== null || !!deltaDescription || (loading && deltaPassed());
      const delta = (v: number, kind: "absolute" | "percent"): VNodeChild => props.deltaFormatter ? props.deltaFormatter(v, kind) : <>
        {v > 0 ? "+" : v < 0 ? "−" : ""}
        {kind === "absolute" && prefix && <span class="kjun-number-affix" data-side="prefix">{prefix}</span>}
        {new Intl.NumberFormat(undefined, { minimumFractionDigits: kind === "absolute" ? decimals : 1, maximumFractionDigits: kind === "absolute" ? decimals : 1 }).format(Math.abs(v))}
        {kind === "percent" && <span class="kjun-number-affix" data-side="suffix">%</span>}
      </>;
      const aside = slots.aside?.();
      return (
        <div class={"kjun-kpi-hero" + (props.size === "sm" ? " kjun-kpi-hero--sm" : "")} data-surface={props.surface === "none" ? "none" : undefined} aria-busy={loading}
          ref={domainRef(!loading && (Number(deltaAbsolute) !== 0 || Number(deltaPercent) !== 0 || secondary.some(item => item.semantic === "price" && Number(item.value) !== 0)))}>
          <div class="kjun-kpi-hero__layout">
            <div class="kjun-kpi-hero__main">
              <div class="kjun-kpi-hero__label">{props.label}</div>
              <div class="kjun-kpi-hero__value">
                {loading ? <KjunSkeleton type="block" height="1lh" width="7ch" /> : <>
                  {prefix && <span class="kjun-kpi-hero__affix">{prefix}</span>}
                  <KjunAnimatedNumber value={props.value} decimals={decimals} animated={props.animated} formatter={props.formatter} />
                  {props.suffix && <span class="kjun-kpi-hero__affix">{props.suffix}</span>}
                </>}
              </div>
              {showDelta && (
                <div class="kjun-kpi-hero__delta-line">
                  {loading ? (
                    // The placeholder takes the delta numbers' line height so the hero keeps its loaded height.
                    <span class="kjun-kpi-hero__delta-abs"><KjunSkeleton type="block" height="1lh" width={tokens.extensions.kpiHero.deltaSkeletonWidth} /></span>
                  ) : <>
                    {deltaAbsolute !== null && <span class="kjun-kpi-hero__delta-abs" style={{ color: kpiColor(deltaAbsolute, "price", "text-tertiary") }}>{delta(deltaAbsolute, "absolute")}</span>}
                    {deltaPercent !== null && <span class="kjun-kpi-hero__delta-pct" style={{ color: kpiColor(deltaPercent, "price", "text-tertiary") }}>{delta(deltaPercent, "percent")}</span>}
                    {deltaDescription && <span class="kjun-kpi-hero__delta-desc">{deltaDescription}</span>}
                  </>}
                </div>
              )}
            </div>
            {hasContent(aside) && <div class="kjun-kpi-hero__aside">{aside}</div>}
          </div>
          {secondary.length > 0 && (
            <div class="kjun-kpi-hero__secondary">
              {secondary.map((item, i) => (
                <div key={i} class="kjun-kpi-hero__sec-item">
                  <div class="kjun-kpi-hero__sec-label">{item.label}</div>
                  <div class="kjun-kpi-hero__sec-value" style={{ color: kpiColor(item.value, item.semantic) }}>
                    {loading ? <KjunSkeleton type="block" height="1lh" width="5ch" /> : slotContent(slots.secondary?.({ item, index: i })) ?? <>
                      {item.prefix && <span class="kjun-kpi-hero__sec-affix">{item.prefix}</span>}
                      <span>{kpiFormat(item)}</span>
                      {item.suffix && <span class="kjun-kpi-hero__sec-affix">{item.suffix}</span>}
                    </>}
                  </div>
                  {item.desc && (
                    <div class={"kjun-kpi-hero__sec-desc " + (item.descClass || "")} style={{ color: "var(--_kjun-color-text-tertiary)" }}>
                      {loading ? <KjunSkeleton type="block" width="7ch" height="1lh" /> : item.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };
  },
});

export interface KpiRowItem extends Omit<KpiValue, "value"> {
  /** null/undefined and non-finite numbers are missing, never zero. Loading still takes precedence. */
  value?: number | string | null;
  missingText?: string;
  loading?: boolean;
  clickable?: boolean;
  mobileFull?: boolean;
  mobileSecondary?: boolean;
  mobileNeutral?: boolean;
  valueKind?: "text" | "number";
  animated?: boolean;
  valueSegments?: { text: string; label?: string; separator?: boolean; class?: string }[];
  badge?: { text: string; variant?: "warning" | "success" | "danger" | "price-up" | "price-down" | "info" | "neutral" } | null;
  badgePlacement?: "label" | "value";
}
const kjunKpiRowProps = {
  loading: { type: Boolean, default: false },
  items: { type: Array as PropType<KpiRowItem[]>, required: true },
  size: { type: String as PropType<"md" | "sm">, default: "md" },
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface: { type: String as PropType<"card" | "none">, default: "card" },
  mobileSummary: { type: Boolean, default: true },
} as const;
export type KjunKpiRowProps = ExtractPublicPropTypes<typeof kjunKpiRowProps>;
/** Slot value({ item, index }). Event: item-click(item, index) for clickable items. */
export const KjunKpiRow = defineComponent({
  name: "KjunKpiRow",
  props: kjunKpiRowProps,
  emits: { "item-click": (_item: KpiRowItem, _index: number) => true },
  slots: Object as SlotsType<{ value?: (scope: { item: KpiRowItem; index: number }) => VNodeChild }>,
  setup(props, { slots, emit }) {
    const badge = (item: KpiRowItem) => {
      if (!item.badge) return null;
      const v = item.badge.variant || "neutral", dot = ["warning", "success", "danger", "price-up", "price-down"].includes(v);
      const role = v === "neutral" ? "text-secondary" : v === "info" ? "brand" : v;
      return (
        <span class="kjun-kpi-row__badge" style={{ color: `var(--_kjun-color-${role})`, background: `var(--_kjun-color-${v === "neutral" ? "secondary" : v === "info" ? "info-bg" : v + "-bg"})` }}>
          {dot && <span class="kjun-kpi-row__badge-dot" style={{ background: "currentColor" }} />}
          {item.badge.text}
        </span>
      );
    };
    return () => {
      const { items, loading, mobileSummary, size } = props;
      const explicit = items.some(item => typeof item.mobileSecondary === "boolean"), hasFull = items.some(item => item.mobileFull);
      const secondary = items.map((item, i) => explicit ? item.mobileSecondary === true : hasFull ? !item.mobileFull : i >= 2);
      const primary = items.flatMap((item, i) => !secondary[i] && !item.mobileFull ? [i] : []);
      const lastFull = primary.length % 2 ? primary[primary.length - 1] : -1;
      return (
        <div class={"kjun-kpi-row" + (size === "sm" ? " kjun-kpi-row--sm" : "") + (items[0]?.mobileFull ? " kjun-kpi-row--hero-first" : "") +
          (mobileSummary && size !== "sm" ? " kjun-kpi-row--mobile-summary" : "")}
          data-surface={props.surface === "none" ? "none" : undefined}
          aria-busy={loading || items.some(item => item.loading)}
          ref={domainRef(!loading && items.some(item => !item.loading && (item.semantic === "price" && Number.isFinite(Number(item.value)) && Number(item.value) !== 0 || !!item.badge?.variant?.startsWith("price-"))))}>
          {items.map((item, i) => {
            const busy = loading || !!item.loading;
            const value = item.value;
            const present = value != null && (typeof value !== "number" || Number.isFinite(value));
            const format = (number: number | string) => kpiFormat({ ...item, value: number });
            const click = () => { if (!busy && item.clickable) emit("item-click", item, i); };
            return (
              <div key={i} role={item.clickable ? "button" : undefined} tabindex={item.clickable && !busy ? 0 : undefined}
                data-state={busy ? "loading" : present || item.valueSegments ? "ready" : "missing"}
                aria-disabled={(item.clickable && busy) || undefined}
                class={"kjun-kpi-row__item" + (item.clickable ? " kjun-kpi-row__item--clickable" : "") + (item.mobileFull ? " kjun-kpi-row__item--full" : "") +
                  (mobileSummary && i === lastFull ? " kjun-kpi-row__item--summary-full" : "") + (secondary[i] ? " kjun-kpi-row__item--secondary" : "") +
                  (item.valueSegments?.some(s => s.label) ? " kjun-kpi-row__item--labeled-segments" : "")}
                onClick={click} onKeydown={(event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); click(); } }}>
                <div class="kjun-kpi-row__label-row">
                  <div class="kjun-kpi-row__label">
                    {busy && !item.label ? <KjunSkeleton type="block" width={tokens.extensions.kpiRow.labelSkeletonWidth} height={tokens.extensions.kpiRow.labelSkeletonHeight} /> : item.label}
                  </div>
                  {!busy && item.badgePlacement !== "value" && badge(item)}
                </div>
                <div class="kjun-kpi-row__value-row">
                  <div class={"kjun-kpi-row__value " + (item.valueClass || "") + (item.valueKind === "text" ? " kjun-kpi-row__value--text" : "") + (item.mobileNeutral ? " kjun-kpi-row__value--mobile-neutral" : "")}
                    title={item.valueKind === "text" && present ? String(value) : undefined} style={{ color: item.valueClass ? undefined : kpiColor(value, item.semantic) }}>
                    {item.valueSegments ? item.valueSegments.map((seg, j) => (
                      <span key={j} class={(seg.class || "") + (seg.label ? " kjun-kpi-row__segment--labeled" : "") + (seg.separator ? " kjun-kpi-row__segment--separator" : "")}>
                        {seg.label && <span class="kjun-kpi-row__segment-label">{seg.label}</span>}
                        {busy && !seg.separator ? <KjunSkeleton type="block" height="1lh" width="3ch" /> : seg.text}
                      </span>
                    )) : busy ? <KjunSkeleton type="block" height="1lh" width="5ch" /> : slotContent(slots.value?.({ item, index: i })) ?? (present ? <>
                      {item.prefix && <span class="kjun-kpi-row__affix">{item.prefix}</span>}
                      {item.animated && typeof value === "number"
                        ? <KjunAnimatedNumber fromPrevious value={value} formatter={format} />
                        : format(value!)}
                      {item.suffix && <span class="kjun-kpi-row__affix">{item.suffix}</span>}
                    </> : item.missingText ?? "—")}
                  </div>
                  {!busy && item.badgePlacement === "value" && badge(item)}
                </div>
                {item.desc && (
                  <div class={"kjun-kpi-row__desc " + (item.descClass || "")} style={{ color: item.descClass ? undefined : kpiColor(item.value, item.semantic, "text-secondary") }}>
                    {busy ? <KjunSkeleton type="block" height="1lh" width="7ch" /> : item.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    };
  },
});
