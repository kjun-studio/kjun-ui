import { tokens } from "@kjun-ui/tokens";
import { useReducedMotion } from "./use-reduced-motion";
import { useNumberMotion } from "../../../shared/package-runtime/use-number-motion";
import {
useEffect,
useRef,
useState
} from "react";
import { DsBadge,DsSkeleton } from "./display";
import { DsTooltip } from "./popover";
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

export interface DsAnimatedNumberProps {
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  animated?: boolean;
  fromPrevious?: boolean;
  formatter?: (value: number) => string;
  className?: string;
}
export function DsAnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  animated = true,
  fromPrevious = false,
  formatter,
  className = "",
}: DsAnimatedNumberProps) {
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
export interface DsFreshnessProps {
  stale?: boolean;
  source?: string | null;
  fetchedAt?: string | null;
  formatter?: (time: string) => string;
}
export function DsFreshness({
  stale = false,
  source,
  fetchedAt,
  formatter,
}: DsFreshnessProps) {
  // A focusable tooltip target, so keyboard and touch reach when the value was fetched (not only a hover title).
  return stale ? (
    <DsTooltip
      content={
        (source === "close"
          ? "실시간 시세 없음 · 최근 종가 표시"
          : "실시간 시세 지연") +
        (fetchedAt ? " · " + (formatter?.(fetchedAt) || formatRelativeTime(fetchedAt)) : "")
      }
    >
      <span tabIndex={0} className="kjun-freshness">
        <DsBadge variant="warning" size="xs">
          {source === "close" ? "종가" : "지연"}
        </DsBadge>
      </span>
    </DsTooltip>
  ) : null;
}
export interface DsPriceCellProps extends Omit<DsFreshnessProps, "formatter"> {
  value?: number | null;
  formatter?: (value: number) => string;
  flashClass?: string;
  fromPrevious?: boolean;
  showFreshness?: boolean;
}
export function DsPriceCell({
  value,
  formatter,
  stale = false,
  showFreshness = true,
  source,
  fetchedAt,
  flashClass = "",
  fromPrevious = true,
}: DsPriceCellProps) {
  return value == null ? (
    <DsSkeleton type="block" height={tokens.extensions.financial.priceSkeletonHeight} width={tokens.extensions.financial.priceSkeletonWidth} />
  ) : (
    <>
      <span
        className={"kjun-price-cell " + flashClass}
        ref={domainColorRef(/\bprice-flash-(up|down)/.test(flashClass))}
        style={{ color: stale ? "var(--_kjun-color-text-tertiary)" : undefined }}
      >
        <DsAnimatedNumber
          value={value}
          formatter={formatter}
          fromPrevious={fromPrevious}
        />
      </span>
      {showFreshness && (
        <DsFreshness stale={stale} source={source} fetchedAt={fetchedAt} />
      )}
    </>
  );
}
export interface DsSignedValueProps {
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
export function DsSignedValue({
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
}: DsSignedValueProps) {
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
      {loading ? <DsSkeleton type="block" width={tokens.extensions.financial.signedSkeletonWidth} height="1lh" /> : display}
      {!loading && showFreshness && stale && n !== null && (
        <DsFreshness stale />
      )}
    </span>
  );
}
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
