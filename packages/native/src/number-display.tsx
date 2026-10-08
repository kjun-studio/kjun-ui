import { tokens } from "@kjun/tokens";
import { typeStyle } from "./typography";
import { useNumberMotion } from "../../../shared/package-runtime/use-number-motion";
import { createContext,useContext,useEffect,useRef,useState } from "react";
import {
Text,
View,
type StyleProp,
type TextStyle
} from "react-native";
import { DsBadge,DsSkeleton } from "./display";
import { AccessiblePressable } from "./a11y";
import { DsTooltip } from "./popover";
import { formatRelativeTime } from "../../../shared/package-runtime/relative-time";
import { KText,domainColor,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";

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
  style?: StyleProp<TextStyle>;
}
/** Internal: market lists set price and change type like Web .kjun-market-price/.kjun-market-change (Text styles do not inherit). */
export const MarketQuoteTypeContext = createContext<{ price: TextStyle; change: TextStyle } | null>(null);
// Inside a market list the price drops its flash pill inset so price and change share a right edge.
export function DsAnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  animated = true,
  fromPrevious = false,
  formatter,
  style,
}: DsAnimatedNumberProps) {
  const n = useCountUp(value, animated, fromPrevious),
    { numericFontFamily, fontFamily } = useKjunStyles();
  return (
    <KText
      style={[
        {
          fontFamily: numericFontFamily || fontFamily,
          fontVariant: ["tabular-nums"],
        },
        style,
      ]}
    >
      {prefix && <Text style={typeStyle("caption")}>{prefix} </Text>}
      {typeof n === "string"
        ? n
        : formatter
        ? formatter(n)
        : format(n, decimals)}
      {suffix && <Text style={typeStyle("caption")}> {suffix}</Text>}
    </KText>
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
  const label = source === "close" ? "종가" : "지연";
  // Like Web: a focusable tooltip target, so keyboard and touch (long press) reach when the value was fetched.
  return stale ? (
    <DsTooltip
      content={
        (source === "close"
          ? "실시간 시세 없음 · 최근 종가 표시"
          : "실시간 시세 지연") +
        (fetchedAt ? " · " + (formatter?.(fetchedAt) || formatRelativeTime(fetchedAt)) : "")
      }
    >
      <AccessiblePressable accessibilityLabel={label} focusRingRadius={tokens.extensions.badge.radius}>
        <DsBadge variant="warning" size="xs">{label}</DsBadge>
      </AccessiblePressable>
    </DsTooltip>
  ) : null;
}
export interface DsPriceCellProps extends Omit<DsFreshnessProps, "formatter"> {
  value?: number | null;
  formatter?: (value: number) => string;
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
  fromPrevious = true,
}: DsPriceCellProps) {
  const { colors } = useKjunStyles(), quoteType = useContext(MarketQuoteTypeContext);
  return value == null ? (
    <DsSkeleton type="block" height={tokens.extensions.financial.priceSkeletonHeight} width={tokens.extensions.financial.priceSkeletonWidth} />
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.financial.affixGap }}>
      <View
        style={quoteType ? undefined : { paddingVertical: tokens.extensions.financial.pillPaddingY, paddingHorizontal: tokens.extensions.financial.pillPaddingX, borderRadius: tokens.radius.radius9999 }}
      >
        <DsAnimatedNumber
          value={value}
          formatter={formatter}
          fromPrevious={fromPrevious}
          style={{ ...quoteType?.price, color: stale ? colors.textTertiary : colors.text }}
        />
      </View>
      {/* The tooltip wrapper hugs its trigger from the top; this View centres the badge on the value line. */}
      {showFreshness && (
        <View style={{ alignSelf: "center" }}>
          <DsFreshness stale={stale} source={source} fetchedAt={fetchedAt} />
        </View>
      )}
    </View>
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
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    quoteType = useContext(MarketQuoteTypeContext),
    n = finiteNumber(value),
    role =
      n === null || n === 0 ? "priceNeutral" : n > 0 ? "priceUp" : "priceDown",
    color =
      loading || n === null
        ? colors.textSecondary
        : stale
        ? colors.textTertiary
        : domainColor(domainColors, role);
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
    <View
      accessibilityState={{ busy: loading }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: tokens.extensions.financial.affixGap,
        paddingVertical: tone === "pill" ? tokens.extensions.financial.pillPaddingY : 0,
        paddingHorizontal: tone === "pill" ? tokens.extensions.financial.pillPaddingX : 0,
        borderRadius: tokens.extensions.financial.pillRadius,
        backgroundColor:
          tone === "pill" && !stale && !loading && n !== null
            ? domainColor(domainColors, role + "Bg")
            : undefined,
      }}
    >
      {loading ? (
        <DsSkeleton type="block" width={tokens.extensions.financial.signedSkeletonWidth} height={tokens.extensions.financial.signedSkeletonHeight} />
      ) : (
        <KText
          style={{
            color,
            fontFamily: numericFontFamily || fontFamily,
            fontVariant: ["tabular-nums"],
            ...typeStyle(tone === "pill" ? "controlSmall" : "numberSm"),
            // Like Web, a plain value keeps the body weight; market lists set their own weight via quoteType.
            ...(tone !== "pill" ? { fontWeight: typeStyle("body").fontWeight, ...quoteType?.change } : undefined),

          }}
        >
          {display}
        </KText>
      )}
      {!loading && showFreshness && stale && n !== null && (
        <View style={{ alignSelf: "center" }}>
          <DsFreshness stale />
        </View>
      )}
    </View>
  );
}
