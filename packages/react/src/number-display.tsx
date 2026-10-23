import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { useReducedMotion } from "./use-reduced-motion";
import { useNumberMotion } from "../../../shared/package-runtime/use-number-motion";
import {
useEffect,
useRef,
useState
} from "react";
import { KjunBadge,KjunSkeleton } from "./display";
import { KjunTooltip } from "./popover";
import { formatRelativeTime } from "../../../shared/package-runtime/relative-time";

export const finiteNumber = (value: unknown): number | null =>
  value == null ||
  typeof value === "boolean" ||
  (typeof value === "string" && !value.trim()) ||
  !["number", "string"].includes(typeof value) ||
  !Number.isFinite(Number(value))
    ? null
    : Number(value) || 0;
export const format = (value: number, decimals = 0) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: Math.max(0, Math.min(20, decimals)),
    maximumFractionDigits: Math.max(0, Math.min(20, decimals)),
  }).format(value);
export function useCountUp(
  value: number | string,
  animated: boolean,
  fromPrevious: boolean
) {
  return useNumberMotion(value, animated, fromPrevious, useReducedMotion());
}

export interface KjunAnimatedNumberProps {
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  animated?: boolean;
  fromPrevious?: boolean;
  formatter?: (value: number) => string;
  className?: string;
}
export function KjunAnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  animated = true,
  fromPrevious = false,
  formatter,
  className = "",
}: KjunAnimatedNumberProps) {
  const n = useCountUp(value, animated, fromPrevious);
  return (
    <span className={"kjun-animated-number " + className}>
      {prefix && <span className="kjun-number-affix" data-side="prefix">{prefix}</span>}
      <span>
        {typeof n === "string"
          ? n
          : formatter
          ? formatter(n)
          : format(n, decimals)}
      </span>
      {suffix && <span className="kjun-number-affix" data-side="suffix">{suffix}</span>}
    </span>
  );
}
export interface KjunFreshnessProps {
  stale?: boolean;
  source?: string | null;
  fetchedAt?: string | null;
  formatter?: (time: string) => string;
}
export function KjunFreshness({
  stale = false,
  source,
  fetchedAt,
  formatter,
}: KjunFreshnessProps) {
  const scope = useKjunMessageScope();
  // A focusable tooltip target, so keyboard and touch reach when the value was fetched (not only a hover title).
  return stale ? (
    <KjunTooltip
      content={
        (source === "close"
          ? scope.messages.noRealtimeQuote
          : scope.messages.realtimeDelayed) +
        (fetchedAt ? " · " + (formatter?.(fetchedAt) || formatRelativeTime(fetchedAt, undefined, scope)) : "")
      }
    >
      <span tabIndex={0} className="kjun-freshness">
        <KjunBadge variant="warning" size="xs">
          {source === "close" ? scope.messages.closePrice : scope.messages.delayed}
        </KjunBadge>
      </span>
    </KjunTooltip>
  ) : null;
}
export interface KjunPriceCellProps extends Omit<KjunFreshnessProps, "formatter"> {
  value?: number | null;
  formatter?: (value: number) => string;
  flashClass?: string;
  fromPrevious?: boolean;
  showFreshness?: boolean;
}
export function KjunPriceCell({
  value,
  formatter,
  stale = false,
  showFreshness = true,
  source,
  fetchedAt,
  flashClass = "",
  fromPrevious = true,
}: KjunPriceCellProps) {
  return value == null ? (
    <KjunSkeleton type="block" height={tokens.extensions.financial.priceSkeletonHeight} width={tokens.extensions.financial.priceSkeletonWidth} />
  ) : (
    <>
      <span
        className={"kjun-price-cell " + flashClass}
        ref={domainColorRef(/\bkjun-price-flash-(up|down)/.test(flashClass))}
        style={{ color: stale ? "var(--_kjun-color-text-tertiary)" : undefined }}
      >
        <KjunAnimatedNumber
          value={value}
          formatter={formatter}
          fromPrevious={fromPrevious}
        />
      </span>
      {showFreshness && (
        <KjunFreshness stale={stale} source={source} fetchedAt={fetchedAt} />
      )}
    </>
  );
}
export interface KjunSignedValueProps {
  value?: number | string | null;
  format?: "number" | "percent";
  isRaw?: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  tone?: "plain" | "pill";
  loading?: boolean;
  stale?: boolean;
  showFreshness?: boolean;
  formatter?: (value: number) => string;
}
export function KjunSignedValue({
  value,
  format: kind = "number",
  isRaw = false,
  decimals = 2,
  prefix = "",
  suffix = "",
  showSign = true,
  tone = "plain",
  loading = false,
  stale = false,
  showFreshness = true,
  formatter,
}: KjunSignedValueProps) {
  const n = finiteNumber(value),
    role =
      loading || n === null
        ? "text-secondary"
        : stale
        ? "text-tertiary"
        : n > 0
        ? "price-up"
        : n < 0
        ? "price-down"
        : "price-neutral";
  const display =
    n === null
      ? "—"
      : formatter
      ? formatter(n)
      : prefix +
        (showSign && n > 0 ? "+" : "") +
        format(kind === "percent" && !isRaw ? n * 100 : n, decimals) +
        (kind === "percent" ? "%" : "") +
        suffix;
  return (
    <span
      className="kjun-signed-value"
      ref={domainColorRef(role.startsWith('price-'))}
      data-tone={tone}
      aria-busy={loading}
      style={{
        color: `var(--_kjun-color-${role})`,
        background:
          tone === "pill" && !stale && n !== null
            ? `var(--_kjun-color-${role}-bg)`
            : undefined,
      }}
    >
      {loading ? <KjunSkeleton type="block" width={tokens.extensions.financial.signedSkeletonWidth} height="1lh" /> : display}
      {!loading && showFreshness && stale && n !== null && (
        <KjunFreshness stale />
      )}
    </span>
  );
}
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
