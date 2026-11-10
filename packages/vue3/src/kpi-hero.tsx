import { getCurrentInstance, type ExtractPublicPropTypes, type PropType, type VNodeChild, type SlotsType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import {
  KPI_MASK, KPI_MISSING, kpiCssColor, kpiCssTint, kpiDelta, kpiDeltaIcon, kpiDeltaValue, kpiFormat, kpiHeroNeedsDomain,
  kpiNumber, kpiPresent, kpiShowDelta, kpiTone,
} from "../../../shared/package-runtime/kpi";
import { KjunSkeleton } from "./display";
import { KjunAnimatedNumber } from "./number-display";
import { KjunIcon } from "./button";
import { domainRef } from "./runtime/refs";
import { hasContent } from "./runtime/slots";
import { useKjunMessageScope } from "./runtime/messages";

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
export const slotContent = (nodes: VNodeChild) => hasContent(nodes) ? nodes : undefined;
/** Masked digits: the mask is drawn, screen readers hear the hidden word. */
export const kpiMasked = (label: string): VNodeChild => <><span aria-hidden="true">{KPI_MASK}</span><span class="kjun-sr-only">{label}</span></>;

const kjunKpiHeroProps = {
  loading: { type: Boolean, default: false },
  label: { type: String, required: true },
  /** null, undefined and non-finite numbers are missing and show missingText. */
  value: { type: [Number, String] as PropType<number | string | null>, default: null },
  /** Shown for a missing value; defaults to an em dash. */
  missingText: { type: String, default: undefined },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  decimals: { type: Number, default: 0 },
  deltaAbsolute: { type: Number as PropType<number | null>, default: null },
  deltaPercent: { type: Number as PropType<number | null>, default: null },
  /** Digits after the point in the percent change. Defaults to 1. */
  deltaPercentDecimals: { type: Number, default: 1 },
  deltaDescription: { type: String, default: "" },
  secondary: { type: Array as PropType<KpiValue[]>, default: () => [] },
  animated: { type: Boolean, default: true },
  size: { type: String as PropType<"md" | "sm">, default: "md" },
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface: { type: String as PropType<"card" | "none">, default: "card" },
  /** Narrow screens: "below" (default) moves the aside under the delta line at full width; "hidden" drops it. */
  asideMobile: { type: String as PropType<"below" | "hidden">, default: "below" },
  /** Draws the direction as a filled caret before the first delta number, in place of its sign. */
  deltaIcon: { type: Boolean, default: false },
  /** Hides every amount behind a mask, with no direction colour; screen readers hear "hidden". */
  masked: { type: Boolean, default: false },
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
    const instance = getCurrentInstance()!, scope = useKjunMessageScope();
    return () => {
      const { loading, prefix, suffix, decimals, deltaDescription, secondary, masked, value } = props;
      const locale = scope.value.intl, hidden = kpiMasked(scope.value.messages.hiddenValue);
      const absolute = kpiDeltaValue(props.deltaAbsolute), percent = kpiDeltaValue(props.deltaPercent);
      const deltaOptions = { decimals, percentDecimals: props.deltaPercentDecimals, locale, formatted: !!props.deltaFormatter };
      // While loading, a delta line passed by the app keeps its placeholder even before its numbers arrive.
      const showDelta = kpiShowDelta(absolute, percent, deltaDescription, loading, instance.vnode.props);
      const direction = (v: number, kind: "absolute" | "percent") => (masked ? 0 : kpiDelta(v, kind, deltaOptions).direction);
      const delta = (v: number, kind: "absolute" | "percent"): VNodeChild => {
        if (masked) return hidden;
        const { direction, sign, number } = kpiDelta(v, kind, deltaOptions);
        // The caret marks the first delta number shown; screen readers still hear its sign.
        const icon = kpiDeltaIcon(props.deltaIcon, direction, kind, absolute !== null);
        return <>
          {icon && <KjunIcon name="caret-up" filled class="kjun-kpi-hero__delta-icon" data-direction={direction > 0 ? "up" : "down"} aria-hidden="true" />}
          {icon && !props.deltaFormatter && <span class="kjun-sr-only">{sign}</span>}
          {props.deltaFormatter ? props.deltaFormatter(v, kind) : <>
            {!icon && sign}
            {kind === "absolute" && prefix && <span class="kjun-number-affix" data-side="prefix">{prefix}</span>}
            {number}
            {kind === "absolute" && suffix && <span class="kjun-number-affix" data-side="suffix">{suffix}</span>}
            {kind === "percent" && <span class="kjun-number-affix" data-side="suffix">%</span>}
          </>}
        </>;
      };
      const aside = slots.aside?.();
      return (
        <div class={"kjun-kpi-hero" + (props.size === "sm" ? " kjun-kpi-hero--sm" : "")} data-surface={props.surface === "none" ? "none" : undefined}
          data-aside-mobile={props.asideMobile === "hidden" ? "hidden" : undefined} aria-busy={loading}
          ref={domainRef(kpiHeroNeedsDomain({ loading, masked, absolute, percent, secondary, ...deltaOptions }))}>
          <div class="kjun-kpi-hero__layout">
            <div class="kjun-kpi-hero__main">
              <div class="kjun-kpi-hero__label">{props.label}</div>
              <div class="kjun-kpi-hero__value">
                {loading ? <KjunSkeleton type="line" width="7ch" />
                  : masked && kpiPresent(value) ? hidden
                  : !kpiPresent(value) ? props.missingText ?? KPI_MISSING
                  : <>
                    {prefix && <span class="kjun-kpi-hero__affix">{prefix}</span>}
                    <KjunAnimatedNumber value={value} decimals={decimals} animated={props.animated} formatter={props.formatter ?? ((n: number) => kpiNumber(n, decimals, locale))} />
                    {suffix && <span class="kjun-kpi-hero__affix">{suffix}</span>}
                  </>}
              </div>
              {showDelta && (
                <div class="kjun-kpi-hero__delta-line">
                  {loading ? (
                    // The placeholder takes the delta numbers' line height so the hero keeps its loaded height.
                    <span class="kjun-kpi-hero__delta-abs"><KjunSkeleton type="line" width={tokens.extensions.kpiHero.deltaSkeletonWidth} /></span>
                  ) : <>
                    {absolute !== null && <span class="kjun-kpi-hero__delta-abs" style={{ color: kpiCssColor(direction(absolute, "absolute"), "text-tertiary") }}>{delta(absolute, "absolute")}</span>}
                    {percent !== null && <span class="kjun-kpi-hero__delta-pct"
                      style={{ color: kpiCssColor(direction(percent, "percent"), "text-tertiary"), background: kpiCssTint(direction(percent, "percent")) }}>{delta(percent, "percent")}</span>}
                    {deltaDescription && <span class="kjun-kpi-hero__delta-desc">{deltaDescription}</span>}
                  </>}
                </div>
              )}
            </div>
            {hasContent(aside) && <div class="kjun-kpi-hero__aside">{aside}</div>}
          </div>
          {secondary.length > 0 && (
            <div class="kjun-kpi-hero__secondary">
              {secondary.map((item, i) => {
                const present = kpiPresent(item.value);
                return (
                  <div key={i} class="kjun-kpi-hero__sec-item">
                    <div class="kjun-kpi-hero__sec-label">{item.label}</div>
                    <div class={"kjun-kpi-hero__sec-value " + (item.valueClass || "")} style={{ color: item.valueClass ? undefined : kpiCssColor(masked ? null : kpiTone(item)) }}>
                      {loading ? <KjunSkeleton type="line" width="5ch" />
                        : masked && present ? hidden
                        : slotContent(slots.secondary?.({ item, index: i })) ?? (present ? <>
                          {item.prefix && <span class="kjun-kpi-hero__sec-affix">{item.prefix}</span>}
                          <span>{kpiFormat(item, item.value, locale)}</span>
                          {item.suffix && <span class="kjun-kpi-hero__sec-affix">{item.suffix}</span>}
                        </> : kpiFormat(item, item.value, locale))}
                    </div>
                    {item.desc && (
                      // Like KpiRow, a descClass owns the colour; otherwise the description is tertiary text.
                      <div class={"kjun-kpi-hero__sec-desc " + (item.descClass || "")} style={{ color: item.descClass ? undefined : "var(--_kjun-color-text-tertiary)" }}>
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
    };
  },
});
