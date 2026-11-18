import { tokens } from "@kjun-ui/tokens";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { useNumberMotion } from "../../../shared/package-runtime/use-number-motion";
import { createContext,useContext,useEffect,useRef,useState,type ReactNode } from "react";
import {
Animated,
StyleSheet,
type ColorValue,
Text,
View,
type StyleProp,
type TextStyle
} from "react-native";
import { KjunSkeleton } from "./display";
import { KText,content,domainColor,useReducedMotion, FontText } from "./internal";
import { useKjunStyles } from "./provider";
import { KpiNumberLine } from "./kpi-number-line";
import { splitNumberSign } from "../../../shared/package-runtime/number-sign";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { usePriceFlash } from "./price-flash";
import type { PriceFlash } from "../../../shared/package-runtime/data-cells";
/** A leading sign drawn tight to its digits (see splitNumberSign), nested in the value's Text; other content passes through. */
export function signedText(value: ReactNode): ReactNode {
  const parts = splitNumberSign(value);
  return parts ? <><FontText style={{ fontVariant: ["proportional-nums"] }}>{parts[0]}</FontText>{parts[1]}</> : value;
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
  style?: StyleProp<TextStyle>;
}
/** Internal: market lists set price and change type like Web .kjun-market-price/.kjun-market-change (Text styles do not inherit). */
export const MarketQuoteTypeContext = createContext<{ price: TextStyle; change: TextStyle } | null>(null);
// Inside a market list the price drops its flash pill inset so price and change share a right edge.
export function KjunAnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  animated = true,
  fromPrevious = false,
  formatter,
  style,
}: KjunAnimatedNumberProps) {
  const n = useCountUp(value, animated, fromPrevious),
    { numericFontFamily, fontFamily } = useKjunStyles();
  const text = typeof n === "string" ? n : formatter ? formatter(n) : format(n, decimals);
  const numeric = StyleSheet.flatten([{ fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] }, style]);
  // Like Web: a unit takes its number's size and sits a unit gap away; each part is its own Text so it can take the gap.
  if (prefix || suffix)
    return <KpiNumberLine prefix={prefix} suffix={suffix} prefixGap={tokens.extensions.financial.unitGap}
      suffixGap={tokens.extensions.financial.unitGap} style={numeric} unitStyle={{}}>{text}</KpiNumberLine>;
  return <KText style={numeric}>{text}</KText>;
}
/** The status slot after a price; nothing when the app gives no status. Text statuses get the system text. */
export function PriceStatus({ status }: { status?: ReactNode }) {
  return hasContent(status) ? <View style={{ alignSelf: "center", flexShrink: 1, minWidth: 0 }}>{content(status)}</View> : null;
}
export interface KjunPriceCellProps {
  value?: number | null;
  formatter?: (value: number) => string;
  stale?: boolean;
  /** The app's status after the price, such as a KjunBadge; KJUN owns only its spacing and alignment. */
  status?: ReactNode;
  /** Flash when the value moves: true or "text" colours the digits up or down, "background" fills the cell's pill.
   * Off under reduced motion. */
  flash?: PriceFlash;
  fromPrevious?: boolean;
}
export function KjunPriceCell({
  value,
  formatter,
  stale = false,
  status,
  flash,
  fromPrevious = true,
}: KjunPriceCellProps) {
  const { colors, domainColors } = useKjunStyles(), quoteType = useContext(MarketQuoteTypeContext), m = useKjunMessages();
  const { kind, direction, opacity } = usePriceFlash(value, flash);
  // With no price a status still shows after a dash, for states such as "거래정지"; without one null is loading.
  if (value == null) return hasContent(status)
    ? <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.financial.statusGap }}><KText style={{ ...quoteType?.price, color: colors.textTertiary }}>—</KText><PriceStatus status={status} /></View>
    : <View accessible accessibilityLabel={m.loading} accessibilityState={{ busy: true }}><KjunSkeleton type="line" role="numberSm" width={tokens.extensions.financial.priceSkeletonWidth} /></View>;
  // Like Web: only a background flash keeps room around the digits.
  const pill = quoteType || kind !== "background" ? undefined : { paddingVertical: tokens.extensions.financial.pillPaddingY, paddingHorizontal: tokens.extensions.financial.pillPaddingX, borderRadius: tokens.radius.radius9999 };
  const number = (color: ColorValue) => <KjunAnimatedNumber value={value} formatter={formatter} fromPrevious={fromPrevious} style={{ ...quoteType?.price, color }} />;
  const tone = direction === "down" ? "priceDown" : "priceUp";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.financial.statusGap }}>
      <View style={pill}>
        {kind === "background" && direction && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: tokens.radius.radius9999, backgroundColor: domainColor(domainColors, `${tone}Bg`), opacity }]} />}
        {number(stale ? colors.textTertiary : colors.text)}
        {/* The text flash is the same number in the move's colour over the plain one, fading out; both count together. */}
        {kind === "text" && <Animated.View pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants"
          style={[StyleSheet.absoluteFill, pill, { opacity: direction ? opacity : 0 }]}>{number(domainColor(domainColors, tone))}</Animated.View>}
      </View>
      <PriceStatus status={status} />
    </View>
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
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    quoteType = useContext(MarketQuoteTypeContext),
    { text: display, direction, missing } = signedValueText(value, { decimals, percent: kind === "percent", prefix, suffix, showSign, formatter }),
    role = direction > 0 ? "priceUp" : direction < 0 ? "priceDown" : "priceNeutral",
    color =
      loading || missing
        ? colors.textSecondary
        : stale
        ? colors.textTertiary
        : domainColor(domainColors, role);
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
          tone === "pill" && !stale && !loading && !missing
            ? domainColor(domainColors, role + "Bg")
            : undefined,
      }}
    >
      {loading ? (
        <KjunSkeleton type="line" role="numberSm" width={tokens.extensions.financial.signedSkeletonWidth} />
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
          {signedText(display)}
        </KText>
      )}
    </View>
  );
}
