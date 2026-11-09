import { content } from "./internal";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { KpiNumberLine } from "./kpi-number-line";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { type ReactNode } from "react";
import {
View,
useWindowDimensions,
type ColorValue,
type TextStyle,
} from "react-native";
import { KjunSkeleton } from "./display";
import { KjunAnimatedNumber } from "./financial";
import Svg, { Path } from "react-native-svg";
import { useIcon } from "../../../shared/package-runtime/icon-context";
import { KText,domainColor } from "./internal";
import { useKjunStyles } from "./provider";

export interface KpiValue {
  label?: string;
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  semantic?: "price" | "status";
  showSign?: boolean;
  formatter?: (value: number) => string;
  desc?: string;
  descColor?: ColorValue;
  valueColor?: ColorValue;
}
export const kpiFormat = (item: KpiValue, value = item.value): string =>
  typeof value === "string"
    ? value
    : item.formatter
    ? item.formatter(value)
    : (item.showSign && value > 0
        ? "+"
        : item.semantic === "price" && value < 0
        ? "−"
        : "") +
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: item.decimals ?? 0,
        maximumFractionDigits: item.decimals ?? 0,
      }).format(item.semantic === "price" ? Math.abs(value) : value);
/** The direction caret: the caret icon's closed outline, filled and stroked in the text colour, like Web. */
function DeltaCaret({ size, color }: { size: number; color: ColorValue | undefined }) {
  const { nodes } = useIcon("caret-up", false);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {nodes.map(([tag, attrs], i) => tag === "path" ? <Path key={i} {...(attrs as { d: string })} /> : null)}
    </Svg>
  );
}
export interface KjunKpiHeroProps {
  loading?: boolean;
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  deltaAbsolute?: number | null;
  deltaPercent?: number | null;
  deltaDescription?: string;
  secondary?: KpiValue[];
  animated?: boolean;
  size?: "md" | "sm";
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface?: "card" | "none";
  aside?: ReactNode;
  /** Narrow screens: "below" (default) moves the aside under the delta line at full width; "hidden" drops it. */
  asideMobile?: "below" | "hidden";
  /** Draws the direction as a filled caret before the first delta number, in place of its sign. */
  deltaIcon?: boolean;
  formatter?: (value: number) => string;
  deltaFormatter?: (value: number, kind: "absolute" | "percent") => string;
  renderSecondary?: (item: KpiValue, index: number) => ReactNode;
}
export function KjunKpiHero(props: KjunKpiHeroProps) {
  const {
    loading = false,
    label,
    value,
    prefix = "",
    suffix = "",
    decimals = 0,
    deltaAbsolute = null,
    deltaPercent = null,
    deltaDescription = "",
    secondary = [],
    animated = true,
    size = "md",
    surface = "card",
    aside,
    asideMobile = "below",
    deltaIcon = false,
    formatter,
    deltaFormatter,
    renderSecondary,
  } = props;
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    windowWidth = useWindowDimensions().width,
    mobile = windowWidth <= tokens.responsive.kpiHero,
    small = size === "sm",
    numberRole = small ? "displaySm" : mobile ? "displayMd" : "displayLg",
    font = typeStyle(numberRole).fontSize,
    // Units sit one weight below their number.
    unitStyle = { ...typeStyle(small ? "numberSm" : mobile ? "numberMd" : "numberLg"), fontWeight: typeStyle("numberSm").fontWeight };
  const geometry = tokens.extensions.kpiHero;
  const spec = small ? geometry.sm : mobile ? geometry.mobile : geometry.md;
  const numeric: TextStyle = {
    fontFamily: numericFontFamily || fontFamily,
    fontVariant: ["tabular-nums"],
  };
  const direction = (v: number) =>
    v === 0
      ? colors.textTertiary
      : domainColor(domainColors, v > 0 ? "priceUp" : "priceDown");
  const showDelta =
    deltaAbsolute !== null ||
    deltaPercent !== null ||
    !!deltaDescription ||
    (loading &&
      ["deltaAbsolute", "deltaPercent", "deltaDescription"].some((key) =>
        Object.prototype.hasOwnProperty.call(props, key)
      ));
  const tint = (v: number) =>
    v === 0 ? colors.secondary : domainColor(domainColors, v > 0 ? "priceUpBg" : "priceDownBg");
  // Units sit 2px from their number, like Web; nested Text cannot take a margin, so each unit is its own Text.
  const delta = (v: number, kind: "absolute" | "percent", style: TextStyle) => {
    // The caret marks the first delta number shown, in place of its sign; the spoken label keeps the sign.
    const icon = deltaIcon && v !== 0 && (kind === "absolute" || deltaAbsolute === null),
      signText = v > 0 ? "+" : v < 0 ? "−" : "",
      sign = icon ? "" : signText,
      gap = geometry.secondaryAffixGap,
      unit = typeStyle("meta"),
      number = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: kind === "absolute" ? decimals : 1,
        maximumFractionDigits: kind === "absolute" ? decimals : 1,
      }).format(Math.abs(v));
    const body = deltaFormatter ? <KText style={style}>{deltaFormatter(v, kind)}</KText>
      : kind === "percent" ? <KpiNumberLine suffix="%" prefixGap={gap} suffixGap={gap} style={style} unitStyle={unit}>{sign + number}</KpiNumberLine>
      : !prefix && !suffix ? <KText style={style}>{sign + number}</KText>
      : (
        <View style={{ flexDirection: "row", alignItems: "baseline", minWidth: 0, maxWidth: "100%" }}>
          {!!sign && <KText style={style}>{sign}</KText>}
          <KpiNumberLine prefix={prefix} suffix={suffix} prefixGap={gap} suffixGap={gap} style={style} unitStyle={unit}>{number}</KpiNumberLine>
        </View>
      );
    if (!icon) return body;
    const spoken = deltaFormatter ? deltaFormatter(v, kind)
      : signText + (kind === "percent" ? number + "%" : prefix + number + suffix);
    return (
      <View accessible accessibilityLabel={spoken} style={{ flexDirection: "row", alignItems: "center", minWidth: 0, maxWidth: "100%" }}>
        <View style={{ marginRight: geometry.prefixGap, transform: [{ rotate: v > 0 ? "0deg" : "180deg" }] }}>
          <DeltaCaret size={geometry.deltaIconSize} color={style.color} />
        </View>
        {body}
      </View>
    );
  };
  return (
    <View
      accessibilityState={{ busy: loading }}
      style={{
        // surface="none" sits inside the app's own card or list, so it drops its own card box.
        ...(surface === "none" ? {} : {
          paddingVertical: spec.paddingY,
          paddingHorizontal: spec.paddingX,
          backgroundColor: colors.surface,
          borderRadius: geometry.radius,
        }),
      }}
    >
      <View
        style={{
          // Like Web, a narrow screen moves the aside under the delta line at full width.
          flexDirection: mobile ? "column" : "row",
          alignItems: mobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: mobile ? geometry.asideGap : geometry.layoutGap,
        }}
      >
        <View style={{ minWidth: 0, flexShrink: 1 }}>
          <KText
            style={{
              color: colors.textSecondary,
              ...typeStyle("label"),
              marginBottom: spec.labelGap,
            }}
          >
            {label}
          </KText>
          {loading ? (
            // Placeholders fill each line's height, like Web's 1lh; the value width approximates Web's 7ch.
            <KjunSkeleton type="line" role={numberRole} width={font * 4.8} />
          ) : (
            <KpiNumberLine prefix={prefix} suffix={suffix} prefixGap={geometry.prefixGap} suffixGap={geometry.suffixGap}
              style={{ ...numeric, ...typeStyle(numberRole) }} unitStyle={unitStyle}>
              <KjunAnimatedNumber value={value} decimals={decimals} animated={animated} formatter={formatter} style={typeStyle(numberRole)} />
            </KpiNumberLine>
          )}
          {showDelta && (
            <View
              style={{
                marginTop: spec.deltaMargin,
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: spec.deltaGap,
              }}
            >
              {loading ? (
                <KjunSkeleton type="line" role="numberMd" width={geometry.deltaSkeletonWidth} />
              ) : (
                <>
                  {deltaAbsolute !== null &&
                    delta(deltaAbsolute, "absolute", { ...numeric, color: direction(deltaAbsolute), ...typeStyle("numberMd") })}
                  {deltaPercent !== null &&
                    // The percent is a tinted chip, so amount and rate read as two values without dimming either. A View has no text
                    // baseline, so the chip centres on the line, which lands its text within a pixel of Web's baseline.
                    <View style={{ alignSelf: "center", backgroundColor: tint(deltaPercent), paddingHorizontal: geometry.deltaChipPaddingX, borderRadius: geometry.deltaChipRadius }}>
                      {delta(deltaPercent, "percent", { ...numeric, color: direction(deltaPercent), ...typeStyle("numberSm"), fontWeight: typeStyle("numberMd").fontWeight })}
                    </View>}
                  {!!deltaDescription && (
                    <KText
                      style={{
                        color: colors.textTertiary,
                        ...typeStyle("caption"),
                      }}
                    >
                      {deltaDescription}
                    </KText>
                  )}
                </>
              )}
            </View>
          )}
        </View>
        {hasContent(aside) && !(mobile && asideMobile === "hidden") && <View>{content(aside)}</View>}
      </View>
      {secondary.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: small && mobile ? geometry.smallMobileGap : spec.secondaryGap,
            marginTop: spec.secondaryMargin,
            paddingTop: spec.secondaryPadding,
            borderTopWidth: tokens.border.defaultWidth,
            borderTopColor: colors.border,
          }}
        >
          {secondary.map((item, i) => {
            // Like Web: on a narrow screen three or more metrics take two columns, so a row starts at each even index.
            const columns = mobile && !small && windowWidth <= tokens.responsive.kpiHeroSecondary && secondary.length >= 3 ? 2 : 0;
            const first = columns ? i % columns === 0 : i === 0;
            const last = columns ? i % columns === columns - 1 || i === secondary.length - 1 : i === secondary.length - 1;
            return (
            <View
              key={i}
              style={
                mobile && !small
                  ? {
                      ...(columns ? { width: `${100 / columns}%` as const, marginTop: i >= columns ? spec.secondaryPadding : 0 } : { flex: 1 }),
                      minWidth: 0,
                      paddingLeft: first ? 0 : geometry.itemPadding,
                      paddingRight: last ? 0 : geometry.itemPadding,
                      borderLeftWidth: first ? 0 : tokens.border.defaultWidth,
                      borderLeftColor: colors.border,
                    }
                  : { minWidth: 0, maxWidth: "100%", flexShrink: 1 }
              }
            >
              <KText

                style={{
                  color: colors.textTertiary,
                  ...typeStyle("caption"),
                  marginBottom: spec.secondaryLabelGap,
                }}
              >
                {item.label}
              </KText>
              {loading ? (
                <KjunSkeleton type="line" role="numberSm" width={geometry.secondarySkeletonWidth} />
              ) : (
                renderSecondary?.(item, i) || (
                  <KpiNumberLine prefix={item.prefix} suffix={item.suffix}
                    prefixGap={geometry.secondaryAffixGap} suffixGap={geometry.secondaryAffixGap}
                    unitStyle={typeStyle("meta")}
                    style={{ ...numeric, ...typeStyle("numberSm"), color: item.valueColor ||
                      (item.semantic === "price" && Number(item.value) !== 0 ? direction(Number(item.value)) : colors.text) }}>
                    {kpiFormat(item)}
                  </KpiNumberLine>
                )
              )}
              {!!item.desc &&
                (loading ? (
                  <KjunSkeleton type="line" role="caption" width={geometry.descriptionSkeletonWidth} />
                ) : (
                  <KText
                    style={{
                      ...typeStyle("caption"),

                      marginTop: small ? geometry.sm.descriptionGap : geometry.md.descriptionGap,
                      color: item.descColor || colors.textTertiary,
                    }}
                  >
                    {item.desc}
                  </KText>
                ))}
            </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
