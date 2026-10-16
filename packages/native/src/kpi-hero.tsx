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
            <KjunSkeleton type="block" height={typeStyle(numberRole).lineHeight} width={font * 4.8} />
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
                <KjunSkeleton type="block" height={typeStyle("numberMd").lineHeight} width={geometry.deltaSkeletonWidth} />
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
                <KjunSkeleton
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
                  <KjunSkeleton
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
            );
          })}
        </View>
      )}
    </View>
  );
}
