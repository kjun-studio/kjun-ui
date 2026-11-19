import { content } from "./internal";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { KpiNumberLine } from "./kpi-number-line";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { useState, type ReactNode } from "react";
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
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  KPI_MASK, KPI_MISSING, KPI_NUMERAL_HEIGHT, kpiDelta, kpiDeltaIcon, kpiDeltaValue, kpiFormat, kpiNumber, kpiPresent, kpiShowDelta, kpiTone,
} from "../../../shared/package-runtime/kpi";

export interface KpiValue {
  label?: string;
  /** null, undefined and non-finite numbers are missing and show missingText. */
  value: number | string | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  semantic?: "price" | "status";
  showSign?: boolean;
  formatter?: (value: number) => string;
  /** Shown for a missing value; defaults to an em dash. */
  missingText?: string;
  desc?: string;
  descColor?: ColorValue;
  valueColor?: ColorValue;
}
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
  /** null, undefined and non-finite numbers are missing and show missingText. */
  value: number | string | null;
  /** Shown for a missing value; defaults to an em dash. */
  missingText?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  deltaAbsolute?: number | null;
  deltaPercent?: number | null;
  /** Digits after the point in the percent change. Defaults to 1. */
  deltaPercentDecimals?: number;
  deltaDescription?: string;
  secondary?: KpiValue[];
  animated?: boolean;
  size?: "md" | "sm";
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface?: "card" | "none";
  aside?: ReactNode;
  /** An app control after the label, such as a mask toggle or an info tooltip trigger; it keeps the label's line height. */
  labelAside?: ReactNode;
  /** Narrow screens: "below" (default) moves the aside under the delta line at full width; "hidden" drops it. */
  asideMobile?: "below" | "hidden";
  /** Draws the direction as a filled caret before the first delta number, in place of its sign. */
  deltaIcon?: boolean;
  /** Hides every amount behind a mask, with no direction colour; screen readers hear "hidden". */
  masked?: boolean;
  formatter?: (value: number) => string;
  deltaFormatter?: (value: number, kind: "absolute" | "percent") => string;
  renderSecondary?: (item: KpiValue, index: number) => ReactNode;
}
export function KjunKpiHero(props: KjunKpiHeroProps) {
  const {
    loading = false,
    label,
    value,
    missingText,
    prefix = "",
    suffix = "",
    decimals = 0,
    deltaPercentDecimals = 1,
    deltaDescription = "",
    secondary = [],
    animated = true,
    size = "md",
    surface = "card",
    aside,
    asideMobile = "below",
    deltaIcon = false,
    masked = false,
    formatter,
    deltaFormatter,
    renderSecondary,
    labelAside,
  } = props;
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    windowWidth = useWindowDimensions().width,
    mobile = windowWidth <= tokens.responsive.kpiHero,
    small = size === "sm";
  // Like Web's container query, the main column steps its value down by its own width, not only the screen's,
  // so a hero in a narrow column keeps its number whole.
  const [mainWidth, setMainWidth] = useState(0);
  const compact = mobile || (mainWidth > 0 && mainWidth <= tokens.responsive.kpiHeroValue),
    numberRole = small ? "displaySm" : compact ? "displayMd" : "displayLg",
    // Units sit one weight below their number.
    unitStyle = { ...typeStyle(small ? "numberSm" : compact ? "numberMd" : "numberLg"), fontWeight: typeStyle("numberSm").fontWeight };
  const geometry = tokens.extensions.kpiHero;
  const spec = small ? geometry.sm : mobile ? geometry.mobile : geometry.md;
  const numeric: TextStyle = {
    fontFamily: numericFontFamily || fontFamily,
    fontVariant: ["tabular-nums"],
  };
  const scope = useKjunMessageScope(), locale = scope.intl;
  const absolute = kpiDeltaValue(props.deltaAbsolute), percent = kpiDeltaValue(props.deltaPercent);
  const deltaOptions = { decimals, percentDecimals: deltaPercentDecimals, locale, formatted: !!deltaFormatter };
  const deltaDirection = (v: number, kind: "absolute" | "percent") => (masked ? 0 : kpiDelta(v, kind, deltaOptions).direction);
  const direction = (d: number, neutral: ColorValue = colors.textTertiary) =>
    d === 0 ? neutral : domainColor(domainColors, d > 0 ? "priceUp" : "priceDown");
  const showDelta = kpiShowDelta(absolute, percent, deltaDescription, loading, props);
  const tint = (d: number) =>
    d === 0 ? colors.secondary : domainColor(domainColors, d > 0 ? "priceUpBg" : "priceDownBg");
  // Masked digits: the mask is drawn, screen readers hear the hidden word.
  const hidden = (style: TextStyle) => <KText accessibilityLabel={scope.messages.hiddenValue} style={style}>{KPI_MASK}</KText>;
  // Units sit 2px from their number, like Web; nested Text cannot take a margin, so each unit is its own Text.
  const delta = (v: number, kind: "absolute" | "percent", style: TextStyle) => {
    if (masked) return hidden(style);
    // The caret marks the first delta number shown, in place of its sign; the spoken label keeps the sign.
    const parts = kpiDelta(v, kind, deltaOptions),
      icon = kpiDeltaIcon(deltaIcon, parts.direction, kind, absolute !== null),
      signText = parts.sign,
      sign = icon ? "" : signText,
      gap = geometry.secondaryAffixGap,
      unit = typeStyle("meta"),
      number = parts.number;
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
        <View style={{ marginRight: geometry.prefixGap, transform: [{ rotate: parts.direction > 0 ? "0deg" : "180deg" }] }}>
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
        <View style={{ minWidth: 0, flexShrink: 1, flexGrow: 1 }} onLayout={event => setMainWidth(event.nativeEvent.layout.width)}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spec.labelGap }}>
            <KText style={{ color: colors.textSecondary, ...typeStyle("label"), flexShrink: 1, minWidth: 0 }}>{label}</KText>
            {hasContent(labelAside) && (
              // The aside holds the label's line height; a larger control centres on it and spills over evenly.
              <View style={{ height: typeStyle("label").lineHeight, justifyContent: "center", flexShrink: 0, marginLeft: geometry.labelAsideGap }}>
                {content(labelAside)}
              </View>
            )}
          </View>
          {loading ? (
            // Placeholders fill each line's height, like Web's 1lh; the value width approximates Web's 7ch.
            <KjunSkeleton type="line" role={numberRole} height={typeStyle(numberRole).fontSize * KPI_NUMERAL_HEIGHT}
              width={small ? tokens.extensions.kpiHero.smValueSkeletonWidth : compact ? tokens.extensions.kpiHero.mobileValueSkeletonWidth : tokens.extensions.kpiHero.valueSkeletonWidth} />
          ) : masked && kpiPresent(value) ? hidden({ ...numeric, ...typeStyle(numberRole), color: colors.text })
          : !kpiPresent(value) ? <KText style={{ ...numeric, ...typeStyle(numberRole), color: colors.text }}>{missingText ?? KPI_MISSING}</KText>
          : (
            <KpiNumberLine prefix={prefix} suffix={suffix} prefixGap={geometry.prefixGap} suffixGap={geometry.suffixGap}
              style={{ ...numeric, ...typeStyle(numberRole) }} unitStyle={unitStyle}>
              <KjunAnimatedNumber value={value} decimals={decimals} animated={animated} formatter={formatter ?? (n => kpiNumber(n, decimals, locale))} style={typeStyle(numberRole)} />
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
                  {absolute !== null &&
                    delta(absolute, "absolute", { ...numeric, color: direction(deltaDirection(absolute, "absolute")), ...typeStyle("numberMd") })}
                  {percent !== null &&
                    // The percent is a tinted chip, so amount and rate read as two values without dimming either. A View has no text
                    // baseline, so the chip centres on the line, which lands its text within a pixel of Web's baseline.
                    <View style={{ alignSelf: "center", backgroundColor: tint(deltaDirection(percent, "percent")), paddingHorizontal: geometry.deltaChipPaddingX, borderRadius: geometry.deltaChipRadius }}>
                      {delta(percent, "percent", { ...numeric, color: direction(deltaDirection(percent, "percent")), ...typeStyle("numberSm"), fontWeight: typeStyle("numberMd").fontWeight })}
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
            const custom = loading ? null : renderSecondary?.(item, i);
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
                <KjunSkeleton type="line" role="numberSm" height={typeStyle("numberSm").fontSize * KPI_NUMERAL_HEIGHT} width={geometry.secondarySkeletonWidth} />
              ) : masked && kpiPresent(item.value) ? hidden({ ...numeric, ...typeStyle("numberSm"), color: colors.text })
              : (
                hasContent(custom) ? content(custom) : (
                  <KpiNumberLine prefix={kpiPresent(item.value) ? item.prefix : undefined} suffix={kpiPresent(item.value) ? item.suffix : undefined}
                    prefixGap={geometry.secondaryAffixGap} suffixGap={geometry.secondaryAffixGap}
                    unitStyle={typeStyle("meta")}
                    style={{ ...numeric, ...typeStyle("numberSm"), color: item.valueColor ||
                      direction(kpiTone(item) === "up" ? 1 : kpiTone(item) === "down" ? -1 : 0, colors.text) }}>
                    {kpiFormat(item, item.value, locale)}
                  </KpiNumberLine>
                )
              )}
              {!!item.desc &&
                (loading ? (
                  // The placeholder keeps the description's gap, so the item does not grow when the data arrives.
                  <View style={{ marginTop: small ? geometry.sm.descriptionGap : geometry.md.descriptionGap }}>
                    <KjunSkeleton type="line" role="caption" width={geometry.descriptionSkeletonWidth} />
                  </View>
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
