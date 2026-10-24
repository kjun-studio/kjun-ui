import { useKjunMessageScope } from "./runtime/messages";
import { defineComponent, onBeforeUnmount, ref, watch, type ExtractPublicPropTypes, type PropType, type Ref } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { createNumberMotion } from "../../../shared/package-runtime/number-motion";
import { formatRelativeTime } from "../../../shared/package-runtime/relative-time";
import { KjunBadge, KjunSkeleton } from "./display";
import { KjunTooltip } from "./popover";
import { useReducedMotion } from "./runtime/presence";
import { domainRef } from "./runtime/refs";

export const finiteNumber = (value: unknown): number | null =>
  value == null || typeof value === "boolean" || (typeof value === "string" && !value.trim()) ||
  !["number", "string"].includes(typeof value) || !Number.isFinite(Number(value))
    ? null
    : Number(value) || 0;
export const format = (value: number, decimals = 0) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: Math.max(0, Math.min(20, decimals)),
    maximumFractionDigits: Math.max(0, Math.min(20, decimals)),
  }).format(value);

/** The displayed number while a value counts up; strings pass through. */
export function useCountUp(value: () => number | string, animated: () => boolean, fromPrevious: () => boolean): Readonly<Ref<number | string>> {
  const reduced = useReducedMotion();
  const initial = value();
  const display = ref<number | string>(typeof initial === "string" || fromPrevious() || !animated() || reduced.value ? initial : 0);
  const motion = createNumberMotion(next => { display.value = next; });
  watch([value, animated, fromPrevious, reduced], ([v, a, f, r]) => motion.update(v, a, f, r), { immediate: true, flush: "sync" });
  onBeforeUnmount(() => motion.cancel());
  return display;
}

const kjunAnimatedNumberProps = {
  value: { type: [Number, String] as PropType<number | string>, required: true },
  decimals: { type: Number, default: 0 },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  animated: { type: Boolean, default: true },
  fromPrevious: { type: Boolean, default: false },
  formatter: { type: Function as PropType<(value: number) => string>, default: undefined },
} as const;
export type KjunAnimatedNumberProps = ExtractPublicPropTypes<typeof kjunAnimatedNumberProps>;
export const KjunAnimatedNumber = defineComponent({
  name: "KjunAnimatedNumber",
  props: kjunAnimatedNumberProps,
  setup(props) {
    const n = useCountUp(() => props.value, () => props.animated, () => props.fromPrevious);
    return () => (
      <span class="kjun-animated-number">
        {props.prefix && <span class="kjun-number-affix" data-side="prefix">{props.prefix}</span>}
        <span>{typeof n.value === "string" ? n.value : props.formatter ? props.formatter(n.value) : format(n.value, props.decimals)}</span>
        {props.suffix && <span class="kjun-number-affix" data-side="suffix">{props.suffix}</span>}
      </span>
    );
  },
});

const kjunFreshnessProps = {
  stale: { type: Boolean, default: false },
  source: { type: String as PropType<string | null>, default: undefined },
  fetchedAt: { type: String as PropType<string | null>, default: undefined },
  formatter: { type: Function as PropType<(time: string) => string>, default: undefined },
} as const;
export type KjunFreshnessProps = ExtractPublicPropTypes<typeof kjunFreshnessProps>;
export const KjunFreshness = defineComponent({
  name: "KjunFreshness",
  props: kjunFreshnessProps,
  setup(props) {
    const scope = useKjunMessageScope();
    // A focusable tooltip target, so keyboard and touch reach when the value was fetched (not only a hover title).
    return () => props.stale ? (
      <KjunTooltip content={(props.source === "close" ? scope.value.messages.noRealtimeQuote : scope.value.messages.realtimeDelayed) +
        (props.fetchedAt ? " · " + (props.formatter?.(props.fetchedAt) || formatRelativeTime(props.fetchedAt, undefined, scope.value)) : "")}>
        <span tabindex={0} class="kjun-freshness"><KjunBadge variant="warning" size="xs">{props.source === "close" ? scope.value.messages.closePrice : scope.value.messages.delayed}</KjunBadge></span>
      </KjunTooltip>
    ) : null;
  },
});

const kjunPriceCellProps = {
  value: { type: Number as PropType<number | null>, default: undefined },
  formatter: { type: Function as PropType<(value: number) => string>, default: undefined },
  stale: { type: Boolean, default: false },
  showFreshness: { type: Boolean, default: true },
  source: { type: String as PropType<string | null>, default: undefined },
  fetchedAt: { type: String as PropType<string | null>, default: undefined },
  flashClass: { type: String, default: "" },
  fromPrevious: { type: Boolean, default: true },
} as const;
export type KjunPriceCellProps = ExtractPublicPropTypes<typeof kjunPriceCellProps>;
export const KjunPriceCell = defineComponent({
  name: "KjunPriceCell",
  props: kjunPriceCellProps,
  setup(props) {
    return () => props.value == null
      ? <KjunSkeleton type="block" height={tokens.extensions.financial.priceSkeletonHeight} width={tokens.extensions.financial.priceSkeletonWidth} />
      : <>
        <span class={"kjun-price-cell " + props.flashClass} ref={domainRef(/\bkjun-price-flash-(up|down)/.test(props.flashClass))}
          style={{ color: props.stale ? "var(--_kjun-color-text-tertiary)" : undefined }}>
          <KjunAnimatedNumber value={props.value} formatter={props.formatter} fromPrevious={props.fromPrevious} />
        </span>
        {props.showFreshness && <KjunFreshness stale={props.stale} source={props.source} fetchedAt={props.fetchedAt} />}
      </>;
  },
});

const kjunSignedValueProps = {
  value: { type: [Number, String, null] as PropType<number | string | null>, default: undefined },
  format: { type: String as PropType<"number" | "percent">, default: "number" },
  isRaw: { type: Boolean, default: false },
  decimals: { type: Number, default: 2 },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  showSign: { type: Boolean, default: true },
  tone: { type: String as PropType<"plain" | "pill">, default: "plain" },
  loading: { type: Boolean, default: false },
  stale: { type: Boolean, default: false },
  showFreshness: { type: Boolean, default: true },
  formatter: { type: Function as PropType<(value: number) => string>, default: undefined },
} as const;
export type KjunSignedValueProps = ExtractPublicPropTypes<typeof kjunSignedValueProps>;
export const KjunSignedValue = defineComponent({
  name: "KjunSignedValue",
  props: kjunSignedValueProps,
  setup(props) {
    return () => {
      const n = finiteNumber(props.value);
      const role = props.loading || n === null ? "text-secondary" : props.stale ? "text-tertiary" : n > 0 ? "price-up" : n < 0 ? "price-down" : "price-neutral";
      const display = n === null ? "—" : props.formatter ? props.formatter(n)
        : props.prefix + (props.showSign && n > 0 ? "+" : "") + format(props.format === "percent" && !props.isRaw ? n * 100 : n, props.decimals) +
          (props.format === "percent" ? "%" : "") + props.suffix;
      return (
        <span class="kjun-signed-value" ref={domainRef(role.startsWith("price-"))} data-tone={props.tone} aria-busy={props.loading}
          style={{ color: `var(--_kjun-color-${role})`, background: props.tone === "pill" && !props.stale && n !== null ? `var(--_kjun-color-${role}-bg)` : undefined }}>
          {props.loading ? <KjunSkeleton type="block" width={tokens.extensions.financial.signedSkeletonWidth} height="1lh" /> : display}
          {!props.loading && props.showFreshness && props.stale && n !== null && <KjunFreshness stale />}
        </span>
      );
    };
  },
});
