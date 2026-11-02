import { defineComponent, onBeforeUnmount, ref, watch, type ExtractPublicPropTypes, type PropType, type Ref, type SlotsType, type VNode } from "vue";
import { hasContent } from "./runtime/slots";
import { tokens } from "@kjun-ui/tokens";
import { createNumberMotion } from "../../../shared/package-runtime/number-motion";
import { KjunSkeleton } from "./display";
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

/** The status slot after a price; nothing when the app's slot renders nothing. */
export const priceStatus = (nodes: VNode[] | undefined) =>
  hasContent(nodes) ? <span class="kjun-price-status">{nodes}</span> : null;

const kjunPriceCellProps = {
  value: { type: Number as PropType<number | null>, default: undefined },
  formatter: { type: Function as PropType<(value: number) => string>, default: undefined },
  stale: { type: Boolean, default: false },
  flashClass: { type: String, default: "" },
  fromPrevious: { type: Boolean, default: true },
} as const;
export type KjunPriceCellProps = ExtractPublicPropTypes<typeof kjunPriceCellProps>;
/** Slot: status — the app's badge or text after the price; KJUN owns only its spacing and alignment. */
export const KjunPriceCell = defineComponent({
  name: "KjunPriceCell",
  props: kjunPriceCellProps,
  slots: Object as SlotsType<{ status?: () => VNode[] }>,
  setup(props, { slots }) {
    // With no price a status still shows after a dash, for states such as "거래정지"; without one null is loading.
    return () => props.value == null
      ? hasContent(slots.status?.()) ? <><span class="kjun-price-cell" data-missing="">—</span>{priceStatus(slots.status?.())}</>
        : <KjunSkeleton type="block" height={tokens.extensions.financial.priceSkeletonHeight} width={tokens.extensions.financial.priceSkeletonWidth} />
      : <>
        <span class={"kjun-price-cell " + props.flashClass} ref={domainRef(/\bkjun-price-flash-(up|down)/.test(props.flashClass))}
          style={{ color: props.stale ? "var(--_kjun-color-text-tertiary)" : undefined }}>
          <KjunAnimatedNumber value={props.value} formatter={props.formatter} fromPrevious={props.fromPrevious} />
        </span>
        {priceStatus(slots.status?.())}
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
        </span>
      );
    };
  },
});
