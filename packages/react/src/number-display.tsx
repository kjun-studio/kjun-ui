import { tokens } from "@kjun-ui/tokens";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { useReducedMotion } from "./use-reduced-motion";
import { useNumberMotion } from "../../../shared/package-runtime/use-number-motion";
import {
useEffect,
useRef,
useState,
type ReactNode
} from "react";
import { KjunSkeleton } from "./display";
import { splitNumberSign } from "../../../shared/package-runtime/number-sign";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { priceFlashClass, priceFlashDirection, priceFlashKind, type PriceFlash } from "../../../shared/package-runtime/data-cells";
/** A leading sign drawn tight to its digits (see splitNumberSign); other content passes through. */
export function signedText(value: ReactNode): ReactNode {
  const parts = splitNumberSign(value);
  return parts ? <><span className="kjun-number-sign">{parts[0]}</span>{parts[1]}</> : value;
}

export { finiteNumber, format } from "../../../shared/package-runtime/signed-number";
import { format, signedValueText } from "../../../shared/package-runtime/signed-number";
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
  className,
}: KjunAnimatedNumberProps) {
  const n = useCountUp(value, animated, fromPrevious);
  return (
    <span className={"kjun-animated-number" + (className ? " " + className : "")}>
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
  return hasContent(status) ? <span className="kjun-price-status">{status}</span> : null;
}
export interface KjunPriceCellProps {
  value?: number | null;
  formatter?: (value: number) => string;
  stale?: boolean;
  /** The app's status after the price, such as a KjunBadge; KJUN owns only its spacing and alignment.
   * With no price (value null) a status still shows after a dash, for states such as "거래정지"; without one null is loading. */
  status?: ReactNode;
  /** Flash when the value moves: true or "text" colours the digits up or down, "background" fills the cell's pill.
   * Off under reduced motion. */
  flash?: PriceFlash;
  /** @deprecated Use flash. A class the app adds and removes itself. */
  flashClass?: string;
  fromPrevious?: boolean;
}
/** The flash class for the latest move, restarted on every move and cleared when its animation ends. */
function usePriceFlash(value: number | null | undefined, flash: PriceFlash | undefined) {
  const kind = priceFlashKind(flash), previous = useRef(value), [shown, setShown] = useState("");
  useEffect(() => {
    const direction = kind ? priceFlashDirection(previous.current, value) : null;
    previous.current = value;
    if (!kind || !direction) return;
    // Drop the class for a frame so a move during a running flash starts it again.
    setShown("");
    const frame = requestAnimationFrame(() => setShown(priceFlashClass(kind, direction)));
    return () => cancelAnimationFrame(frame);
  }, [value, kind]);
  return [kind ? shown : "", () => setShown("")] as const;
}
export function KjunPriceCell({
  value,
  formatter,
  stale = false,
  status,
  flash,
  flashClass = "",
  fromPrevious = true,
}: KjunPriceCellProps) {
  const m = useKjunMessages(), [flashing, endFlash] = usePriceFlash(value, flash);
  if (value == null) return hasContent(status)
    ? <><span className="kjun-price-cell" data-missing="">—</span><PriceStatus status={status} /></>
    : <span className="kjun-price-loading"><KjunSkeleton type="line" width={tokens.extensions.financial.priceSkeletonWidth} /><span className="kjun-sr-only">{m.loading}</span></span>;
  const className = ["kjun-price-cell", flashClass, flashing].filter(Boolean).join(" ");
  return (
    <>
      <span
        className={className}
        data-flash={priceFlashKind(flash) ?? undefined}
        ref={domainColorRef(/\bkjun-price-flash-(up|down)/.test(className))}
        style={{ color: stale ? "var(--_kjun-color-text-tertiary)" : undefined }}
        onAnimationEnd={event => { if (event.target === event.currentTarget) endFlash(); }}
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
  decimals = 2,
  prefix = "",
  suffix = "",
  showSign = true,
  tone = "plain",
  loading = false,
  stale = false,
  formatter,
}: KjunSignedValueProps) {
  const { text: display, direction, missing } = signedValueText(value, { decimals, percent: kind === "percent", prefix, suffix, showSign, formatter }),
    role = loading || missing ? "text-secondary" : stale ? "text-tertiary"
      : direction > 0 ? "price-up" : direction < 0 ? "price-down" : "price-neutral";
  return (
    <span
      className="kjun-signed-value"
      ref={domainColorRef(role.startsWith('price-'))}
      data-tone={tone}
      aria-busy={loading}
      style={{
        color: `var(--_kjun-color-${role})`,
        background:
          tone === "pill" && !stale && !missing
            ? `var(--_kjun-color-${role}-bg)`
            : undefined,
      }}
    >
      {loading ? <KjunSkeleton type="line" width={tokens.extensions.financial.signedSkeletonWidth} /> : signedText(display)}
    </span>
  );
}
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
