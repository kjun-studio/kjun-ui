import { tokens } from "@kjun-ui/tokens";
import { useReducedMotion } from "./use-reduced-motion";
import { useNumberMotion } from "../../../shared/package-runtime/use-number-motion";
import {
useEffect,
useRef,
useState,
type ReactNode
} from "react";
import { KjunSkeleton } from "./display";

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
/** The status slot after a price; nothing when the app gives no status. */
export function PriceStatus({ status }: { status?: ReactNode }) {
  return status == null || status === false ? null : <span className="kjun-price-status">{status}</span>;
}
export interface KjunPriceCellProps {
  value?: number | null;
  formatter?: (value: number) => string;
  stale?: boolean;
  /** The app's status after the price, such as a KjunBadge; KJUN owns only its spacing and alignment. */
  status?: ReactNode;
  flashClass?: string;
  fromPrevious?: boolean;
}
export function KjunPriceCell({
  value,
  formatter,
  stale = false,
  status,
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
      <PriceStatus status={status} />
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
    </span>
  );
}
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
