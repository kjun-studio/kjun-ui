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
import { DsSkeleton } from "./display";
import { DsAnimatedNumber } from "./financial";
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
export interface DsKpiHeroProps {
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
  aside?: ReactNode;
  formatter?: (value: number) => string;
  deltaFormatter?: (value: number, kind: "absolute" | "percent") => string;
  renderSecondary?: (item: KpiValue, index: number) => ReactNode;
}
export function DsKpiHero(props: DsKpiHeroProps) {
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
    aside,
    formatter,
    deltaFormatter,
    renderSecondary,
  } = props;
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    mobile = useWindowDimensions().width <= tokens.responsive.kpiHero,
    small = size === "sm",
    numberRole = small ? "displaySm" : mobile ? "displayMd" : "displayLg",
    font = typeStyle(numberRole).fontSize,
    unitStyle = typeStyle(small ? "numberSm" : mobile ? "numberMd" : "numberLg");
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
  // Units sit apart from their number by the financial affix gap, like Web; nested Text cannot take a margin.
  const delta = (v: number, kind: "absolute" | "percent", style: TextStyle) => {
    if (deltaFormatter) return <KText style={style}>{deltaFormatter(v, kind)}</KText>;
    const sign = v > 0 ? "+" : v < 0 ? "−" : "",
      gap = tokens.extensions.financial.affixGap,
      number = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: kind === "absolute" ? decimals : 1,
        maximumFractionDigits: kind === "absolute" ? decimals : 1,
      }).format(Math.abs(v));
    if (kind === "percent")
      return <KpiNumberLine suffix="%" prefixGap={gap} suffixGap={gap} style={style} unitStyle={typeStyle("caption")}>{sign + number}</KpiNumberLine>;
    if (!prefix) return <KText style={style}>{sign + number}</KText>;
    return (
      <View style={{ flexDirection: "row", alignItems: "baseline", minWidth: 0, maxWidth: "100%" }}>
        {!!sign && <KText style={style}>{sign}</KText>}
        <KpiNumberLine prefix={prefix} prefixGap={gap} suffixGap={gap} style={style} unitStyle={typeStyle("caption")}>{number}</KpiNumberLine>
      </View>
    );
  };
  return (
    <View
      accessibilityState={{ busy: loading }}
      style={{
        paddingVertical: spec.paddingY,
        paddingHorizontal: spec.paddingX,
        backgroundColor: colors.surface,
        borderRadius: geometry.radius,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: geometry.layoutGap,
        }}
      >
        <View style={{ minWidth: 0, flexShrink: 1 }}>
          <KText
            style={{
              color: colors.textSecondary,
              ...typeStyle("caption"),
              marginBottom: spec.labelGap,
            }}
          >
            {label}
          </KText>
          {loading ? (
            // Placeholders fill each line's height, like Web's 1lh; the value width approximates Web's 7ch.
            <DsSkeleton type="block" height={typeStyle(numberRole).lineHeight} width={font * 4.8} />
          ) : (
            <KpiNumberLine prefix={prefix} suffix={suffix} prefixGap={geometry.prefixGap} suffixGap={geometry.suffixGap}
              style={{ ...numeric, ...typeStyle(numberRole) }} unitStyle={unitStyle}>
              <DsAnimatedNumber value={value} decimals={decimals} animated={animated} formatter={formatter} style={typeStyle(numberRole)} />
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
                <DsSkeleton type="block" height={typeStyle("numberMd").lineHeight} width={geometry.deltaSkeletonWidth} />
              ) : (
                <>
                  {deltaAbsolute !== null &&
                    delta(deltaAbsolute, "absolute", { ...numeric, color: direction(deltaAbsolute), ...typeStyle("numberMd") })}
                  {deltaPercent !== null &&
                    delta(deltaPercent, "percent", { ...numeric, color: direction(deltaPercent), ...typeStyle("numberMd"), opacity: 0.9 })}
                  {deltaDescription && (
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
        {aside && !mobile && <View>{aside}</View>}
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
          {secondary.map((item, i) => (
            <View
              key={i}
              style={
                mobile && !small
                  ? {
                      flex: 1,
                      minWidth: 0,
                      paddingLeft: i ? geometry.itemPadding : 0,
                      paddingRight: i === secondary.length - 1 ? 0 : geometry.itemPadding,
                      borderLeftWidth: i ? tokens.border.defaultWidth : 0,
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
                <DsSkeleton
                  type="block"
                  height={typeStyle("numberMd").lineHeight}
                  width={geometry.secondarySkeletonWidth}
                />
              ) : (
                renderSecondary?.(item, i) || (
                  <KpiNumberLine prefix={item.prefix} suffix={item.suffix}
                    prefixGap={geometry.secondaryAffixGap} suffixGap={geometry.secondaryAffixGap}
                    unitStyle={typeStyle("caption")}
                    style={{ ...numeric, ...typeStyle("numberMd"), color: item.valueColor ||
                      (item.semantic === "price" && Number(item.value) !== 0 ? direction(Number(item.value)) : colors.text) }}>
                    {kpiFormat(item)}
                  </KpiNumberLine>
                )
              )}
              {item.desc &&
                (loading ? (
                  <DsSkeleton
                    type="block"
                    width={geometry.descriptionSkeletonWidth}
                    height={typeStyle("caption").lineHeight}
                  />
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
          ))}
        </View>
      )}
    </View>
  );
}
