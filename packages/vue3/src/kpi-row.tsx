import { type ExtractPublicPropTypes, type PropType, type VNodeChild, type SlotsType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import {
  kpiBadgeRoles, kpiCssColor, kpiFormat, kpiGridLayout, kpiKeyAction, kpiPresent, kpiRowNeedsDomain, kpiSummaryLayout, kpiTone,
  type KpiBadgeVariant,
} from "../../../shared/package-runtime/kpi";
import { KjunSkeleton } from "./display";
import { KjunAnimatedNumber } from "./number-display";
import { KjunIcon } from "./button";
import { domainRef } from "./runtime/refs";
import { useKjunMessageScope } from "./runtime/messages";
import { kpiMasked, slotContent, type KpiValue } from "./kpi-hero";
import { hasContent } from "./runtime/slots";

export interface KpiRowItem extends Omit<KpiValue, "value"> {
  /** null/undefined and non-finite numbers are missing, never zero. Loading still takes precedence. */
  value?: number | string | null;
  loading?: boolean;
  clickable?: boolean;
  /** Draws the cell as a link to this address; it is clickable, and item-click still fires with the click event. */
  href?: string;
  mobileFull?: boolean;
  mobileSecondary?: boolean;
  mobileNeutral?: boolean;
  valueKind?: "text" | "number";
  animated?: boolean;
  valueSegments?: { text: string; label?: string; separator?: boolean; class?: string }[];
  badge?: { text: string; variant?: KpiBadgeVariant } | null;
  badgePlacement?: "label" | "value";
}
const kjunKpiRowProps = {
  loading: { type: Boolean, default: false },
  items: { type: Array as PropType<KpiRowItem[]>, required: true },
  size: { type: String as PropType<"md" | "sm">, default: "md" },
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface: { type: String as PropType<"card" | "none">, default: "card" },
  mobileSummary: { type: Boolean, default: true },
  /** Hides number values and segments behind a mask, with no direction colour; text values, badges and descriptions stay. */
  masked: { type: Boolean, default: false },
} as const;
export type KjunKpiRowProps = ExtractPublicPropTypes<typeof kjunKpiRowProps>;
/**
 * Slots value({ item, index }) and labelAside({ item, index }) — an app control after the label that keeps the label's line
 * height; its clicks and keys never open a clickable or link cell. Event: item-click(item, index, event) for clickable and link items; a router can call preventDefault. */
export const KjunKpiRow = defineComponent({
  name: "KjunKpiRow",
  props: kjunKpiRowProps,
  emits: { "item-click": (_item: KpiRowItem, _index: number, _event: MouseEvent | KeyboardEvent) => true },
  slots: Object as SlotsType<{
    value?: (scope: { item: KpiRowItem; index: number }) => VNodeChild;
    labelAside?: (scope: { item: KpiRowItem; index: number }) => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const scope = useKjunMessageScope();
    const badge = (item: KpiRowItem) => {
      if (!item.badge) return null;
      const roles = kpiBadgeRoles(item.badge.variant);
      return <span class="kjun-kpi-row__badge" style={{ color: `var(--_kjun-color-${roles.text})`, background: `var(--_kjun-color-${roles.bg})` }}>{item.badge.text}</span>;
    };
    return () => {
      const { items, loading, mobileSummary, size, masked } = props;
      const locale = scope.value.intl;
      const { secondary, lastFull } = kpiSummaryLayout(items);
      const grid = kpiGridLayout(items);
      return (
        <div class={"kjun-kpi-row" + (size === "sm" ? " kjun-kpi-row--sm" : "") + (items[0]?.mobileFull ? " kjun-kpi-row--hero-first" : "") +
          (mobileSummary && size !== "sm" ? " kjun-kpi-row--mobile-summary" : "")}
          data-surface={props.surface === "none" ? "none" : undefined}
          aria-busy={loading || items.some(item => item.loading)}
          ref={domainRef(kpiRowNeedsDomain(loading, masked, items))}>
          {items.map((item, i) => {
            const busy = loading || !!item.loading;
            const value = item.value;
            const present = kpiPresent(value);
            const link = !!item.href, clickable = !!item.clickable || link;
            const hide = masked && item.valueKind !== "text" && (present || !!item.valueSegments);
            const format = (number: number | string | null | undefined) => kpiFormat(item, number, locale);
            const className = "kjun-kpi-row__item" + (clickable ? " kjun-kpi-row__item--clickable" : "") + (item.mobileFull ? " kjun-kpi-row__item--full" : "") +
              (mobileSummary && i === lastFull ? " kjun-kpi-row__item--summary-full" : "") + (secondary[i] ? " kjun-kpi-row__item--secondary" : "") +
              (item.valueSegments?.some(s => s.label) ? " kjun-kpi-row__item--labeled-segments" : "") +
              (grid[i].column ? " kjun-kpi-row__item--grid-end" : "") + (grid[i].top ? " kjun-kpi-row__item--grid-top" : "") +
              (grid[i].full ? " kjun-kpi-row__item--grid-full" : "");
            const labelAside = slots.labelAside?.({ item, index: i });
            const key = (event: KeyboardEvent) => {
              const action = kpiKeyAction(event.type as "keydown" | "keyup", event.key, event.repeat);
              if (action) event.preventDefault();
              if (action === "activate" && !busy) emit("item-click", item, i, event);
            };
            const content = <>
              <div class="kjun-kpi-row__label-row">
                <div class="kjun-kpi-row__label">
                  {busy && !item.label ? <KjunSkeleton type="line" width={tokens.extensions.kpiRow.labelSkeletonWidth} /> : item.label}
                </div>
                {hasContent(labelAside) && (
                  // The aside is its own control: its clicks and keys never open the cell (nor follow a link cell).
                  <span class="kjun-kpi-row__label-aside"
                    onClick={(event: MouseEvent) => { event.stopPropagation(); if (link) event.preventDefault(); }}
                    onKeydown={(event: KeyboardEvent) => event.stopPropagation()} onKeyup={(event: KeyboardEvent) => event.stopPropagation()}>
                    {labelAside}
                  </span>
                )}
                {!busy && item.badgePlacement !== "value" && badge(item)}
              </div>
              <div class="kjun-kpi-row__value-row">
                <div class={"kjun-kpi-row__value " + (item.valueClass || "") + (item.valueKind === "text" ? " kjun-kpi-row__value--text" : "") + (item.mobileNeutral ? " kjun-kpi-row__value--mobile-neutral" : "")}
                  title={item.valueKind === "text" && present ? String(value) : undefined} style={{ color: item.valueClass ? undefined : kpiCssColor(hide ? null : kpiTone(item)) }}>
                  {busy && !item.valueSegments ? <KjunSkeleton type="line" width="5ch" />
                    : hide && !busy ? kpiMasked(scope.value.messages.hiddenValue)
                    : item.valueSegments ? item.valueSegments.map((seg, j) => (
                      <span key={j} class={(seg.class || "") + (seg.label ? " kjun-kpi-row__segment--labeled" : "") + (seg.separator ? " kjun-kpi-row__segment--separator" : "")}>
                        {seg.label && <span class="kjun-kpi-row__segment-label">{seg.label}</span>}
                        {busy && !seg.separator ? <KjunSkeleton type="line" width="3ch" /> : seg.text}
                      </span>
                    ))
                    : slotContent(slots.value?.({ item, index: i })) ?? (present ? <>
                      {item.prefix && <span class="kjun-kpi-row__affix" data-side="prefix">{item.prefix}</span>}
                      {item.animated && typeof value === "number" ? <KjunAnimatedNumber fromPrevious value={value} formatter={format} /> : format(value)}
                      {item.suffix && <span class="kjun-kpi-row__affix" data-side="suffix">{item.suffix}</span>}
                    </> : format(value))}
                </div>
                {!busy && item.badgePlacement === "value" && badge(item)}
                {clickable && <KjunIcon name="chevron-right" class="kjun-kpi-row__chevron" aria-hidden="true" />}
              </div>
              {item.desc && (
                <div class={"kjun-kpi-row__desc " + (item.descClass || "")} style={{ color: item.descClass ? undefined : kpiCssColor(hide ? null : kpiTone(item), "text-secondary") }}>
                  {busy ? <KjunSkeleton type="line" width="7ch" /> : item.desc}
                </div>
              )}
            </>;
            const state = busy ? "loading" : present || item.valueSegments ? "ready" : "missing";
            // A link cell is a real link, so it opens in a new tab and its address can be copied; a busy link has no address.
            if (link) return (
              <a key={i} class={className} href={busy ? undefined : item.href} data-state={state} aria-disabled={busy || undefined}
                onClick={(event: MouseEvent) => (busy ? event.preventDefault() : emit("item-click", item, i, event))}>
                {content}
              </a>
            );
            return (
              <div key={i} role={clickable ? "button" : undefined} tabindex={clickable && !busy ? 0 : undefined}
                data-state={state} aria-disabled={(clickable && busy) || undefined} class={className}
                onClick={clickable ? (event: MouseEvent) => { if (!busy) emit("item-click", item, i, event); } : undefined}
                onKeydown={clickable ? key : undefined} onKeyup={clickable ? key : undefined}>
                {content}
              </div>
            );
          })}
        </div>
      );
    };
  },
});
