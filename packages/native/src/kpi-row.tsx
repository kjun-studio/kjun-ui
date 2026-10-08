import { tokens } from "@kjun/tokens";
import { typeStyle } from "./typography";
import { useState, type ReactNode } from "react";
import {
Text,
View,
useWindowDimensions,
type ColorValue,
type TextStyle,
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsSkeleton } from "./display";
import { BadgeView } from "./display-primitives";
import { DsAnimatedNumber } from "./financial";
import { KText,domainColor } from "./internal";
import { KpiValue,kpiFormat } from "./kpi-hero";
import { useKjunStyles } from "./provider";
export interface KpiRowItem extends KpiValue {
  loading?: boolean;
  clickable?: boolean;
  mobileFull?: boolean;
  mobileSecondary?: boolean;
  mobileNeutral?: boolean;
  valueKind?: "text" | "number";
  animated?: boolean;
  valueSegments?: {
    text: string;
    label?: string;
    separator?: boolean;
    color?: ColorValue;
  }[];
  badge?: {
    text: string;
    variant?:
      | "warning"
      | "success"
      | "danger"
      | "price-up"
      | "price-down"
      | "info"
      | "neutral";
  };
  badgePlacement?: "label" | "value";
}
export interface DsKpiRowProps {
  loading?: boolean;
  items: KpiRowItem[];
  size?: "md" | "sm";
  mobileSummary?: boolean;
  onItemClick?: (item: KpiRowItem, index: number) => void;
  renderValue?: (item: KpiRowItem, index: number) => ReactNode;
}
export function DsKpiRow({
  loading = false,
  items,
  size = "md",
  mobileSummary = true,
  onItemClick,
  renderValue,
}: DsKpiRowProps) {
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    mobile = useWindowDimensions().width <= tokens.responsive.kpiRow,
    small = size === "sm",
    summary = mobileSummary && mobile && !small;
  const geometry = tokens.extensions.kpiRow;
  const spec = small ? geometry.sm : mobile ? geometry.mobile : geometry.md;
  const [width, setWidth] = useState(0);
  const paddingX = summary ? geometry.summary.paddingX : spec.paddingX;
  const gapX = summary ? geometry.summary.gapX : 0;
  const explicit = items.some(
      (item) => typeof item.mobileSecondary === "boolean"
    ),
    hasFull = items.some((item) => item.mobileFull),
    secondary = items.map((item, i) =>
      explicit
        ? item.mobileSecondary === true
        : hasFull
        ? !item.mobileFull
        : i >= 2
    ),
    primary = items.flatMap((item, i) =>
      !secondary[i] && !item.mobileFull ? [i] : []
    ),
    lastFull = primary.length % 2 ? primary[primary.length - 1] : -1;
  const color = (item: KpiValue) =>
    item.valueColor ||
    (item.semantic === "price" && Number(item.value) !== 0
      ? domainColor(
          domainColors,
          Number(item.value) > 0 ? "priceUp" : "priceDown"
        )
      : colors.text);
  const badge = (item: KpiRowItem) =>
    item.badge ? (
      <BadgeView dotSize={geometry.dotSize}
        variant={
          item.badge.variant === "neutral"
            ? "secondary"
            : item.badge.variant === "info"
            ? "info"
            : item.badge.variant || "secondary"
        }
        size="xs"
        style={{ borderRadius: geometry.badgeRadius, gap: geometry.badgeGap, paddingHorizontal: geometry.badgePadding.x, paddingVertical: geometry.badgePadding.y }}
        dot={[
          "warning",
          "success",
          "danger",
          "price-up",
          "price-down",
        ].includes(item.badge.variant || "")}
      >
        {item.badge.text}
      </BadgeView>
    ) : null;
  return (
    <View
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      accessibilityState={{
        busy: loading || items.some((item) => item.loading),
      }}
      style={{
        flexDirection: "row",
        flexWrap: mobile ? "wrap" : "nowrap",
        paddingVertical: summary ? geometry.summary.paddingY : spec.paddingY,
        paddingHorizontal: paddingX,
        borderRadius: geometry.radius,
        backgroundColor: colors.surface,
        rowGap: summary ? geometry.summary.gapY : 0,
        columnGap: gapX,
      }}
    >
      {items.map((item, i) => {
        const busy = loading || !!item.loading,
          sub = summary && secondary[i],
          full =
            item.mobileFull ||
            (summary && i === lastFull) ||
            (!summary &&
              mobile &&
              i === items.length - 1 &&
              items.length % 2 === 1),
          numberRole = sub ? "numberSm" : small ? "numberLg" : mobile && !summary ? "numberLg" : "displaySm",
          numberSize = typeStyle(numberRole).fontSize;
        const valueStyle: TextStyle = {
          fontFamily: item.valueKind === "text" ? fontFamily : numericFontFamily || fontFamily,
          fontVariant: item.valueKind === "text" ? [] : ["tabular-nums"],
          ...typeStyle(item.valueKind === "text" ? "body" : numberRole),
          color: summary && item.mobileNeutral ? colors.text : color(item),
        };
        return (
          <Pressable
            key={i}
            accessible={!!item.clickable}
            accessibilityRole={item.clickable ? "button" : undefined}
            accessibilityLabel={item.clickable ? item.label : undefined}
            disabled={!item.clickable || busy}
            onPress={() => onItemClick?.(item, i)}
            style={{
              flex: mobile ? undefined : 1,
              flexBasis:
                mobile
                  ? sub
                    ? "auto"
                    : full
                    ? "100%"
                    : width ? Math.max(0, (width - 2 * paddingX - gapX) / 2) : "50%"
                  : undefined,
              flexGrow: sub ? 0 : 1,
              // Like Web, the last secondary summary item closes the line at the far edge.
              marginLeft: sub && i === items.length - 1 ? "auto" : undefined,
              minWidth: 0,
              paddingVertical: summary ? 0 : small && mobile ? geometry.smallMobile.itemPaddingY : spec.itemPaddingY,
              paddingHorizontal: summary ? 0 : small && mobile ? geometry.smallMobile.itemPaddingX : spec.itemPaddingX,
              borderLeftWidth: summary
                ? 0
                : mobile && !small
                ? i % 2 && !full
                  ? tokens.border.defaultWidth
                  : 0
                : i
                ? tokens.border.defaultWidth
                : 0,
              borderTopWidth: mobile && !small && !summary && i >= 2 ? tokens.border.defaultWidth : 0,
              borderColor: colors.border,
              borderRadius: item.clickable ? geometry.itemRadius : 0,
              flexDirection: sub ? "row" : "column",
              alignItems: sub ? "baseline" : undefined,
              gap: sub ? geometry.summary.secondaryGap : 0,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spec.labelGap,
                marginBottom: sub ? 0 : spec.labelMargin,
              }}
            >
              {busy && !item.label ? (
                <DsSkeleton type="block" width={geometry.labelSkeletonWidth} height={geometry.labelSkeletonHeight} />
              ) : (
                <KText style={{ minWidth: 0, flexShrink: 1, color: colors.textSecondary, ...typeStyle('caption') }}>
                  {item.label}
                </KText>
              )}
              {!busy && item.badgePlacement !== "value" && badge(item)}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: sub ? geometry.summary.secondaryGap : geometry.valueGap,
                minWidth: 0,
              }}
            >
              {item.valueSegments ? (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.segmentGap }}
                >
                  {item.valueSegments.map((seg, j) => (
                    <View key={j} style={{ flexDirection: sub ? 'row' : 'column', alignItems: 'center', display: summary && sub && seg.separator ? 'none' : 'flex' }}>
                      {summary && sub && seg.label && item.valueSegments!.slice(0, j).some(previous => previous.label) &&
                        <KText aria-hidden style={{ ...typeStyle('caption'), marginHorizontal: geometry.separatorGap, color: colors.textTertiary }}>·</KText>}
                      {summary && seg.label && (
                        <KText
                          style={{ ...typeStyle('caption'), marginRight: sub ? tokens.dimension.value4 : 0, color: colors.textTertiary }}
                        >
                          {seg.label}
                        </KText>
                      )}
                      {busy && !seg.separator ? (
                        <DsSkeleton
                          type="block"
                          height={valueStyle.lineHeight}
                          width={geometry.segmentSkeletonWidth}
                        />
                      ) : (
                        <KText
                          style={[
                            valueStyle,
                            { color: seg.color || valueStyle.color },
                          ]}
                        >
                          {seg.text}
                        </KText>
                      )}
                    </View>
                  ))}
                </View>
              ) : busy ? (
                // Like Web's 1lh × 5ch: the placeholder fills the value line, and its width (set for the display
                // number) scales with the value's font so a text value gets a text-sized bar.
                <DsSkeleton type="block" height={valueStyle.lineHeight}
                  width={geometry.valueSkeletonWidth * (valueStyle.fontSize ?? numberSize) / typeStyle("displaySm").fontSize} />
              ) : (
                renderValue?.(item, i) || (
                  <KText

                    style={[valueStyle, { flexShrink: 1, minWidth: 0 }]}
                  >
                    {item.prefix && (
                      <Text
                        style={{

                          ...typeStyle(item.valueKind !== "text" && numberRole === "displaySm" ? "numberSm" : "caption"),
                        }}
                      >
                        {item.prefix}
                      </Text>
                    )}
                    {item.animated && typeof item.value === "number" ? (
                      <DsAnimatedNumber
                        fromPrevious
                        value={item.value}
                        formatter={(v) => kpiFormat(item, v)}
                        style={[valueStyle, { flexShrink: 1, minWidth: 0 }]}
                      />
                    ) : (
                      kpiFormat(item)
                    )}
                    {item.suffix && (
                      <Text
                        style={{

                          ...typeStyle(item.valueKind !== "text" && numberRole === "displaySm" ? "numberSm" : "caption"),
                        }}
                      >
                        {item.suffix}
                      </Text>
                    )}
                  </KText>
                )
              )}
              {!busy && item.badgePlacement === "value" && badge(item)}
            </View>
            {item.desc &&
              (busy ? (
                <DsSkeleton type="block" height={typeStyle("caption").lineHeight} width={geometry.descriptionSkeletonWidth} />
              ) : (
                <KText
                  style={{
                    ...typeStyle("caption"),

                    marginTop: spec.descriptionGap,
                    color:
                      item.descColor ||
                      (item.semantic === "price"
                        ? color(item)
                        : colors.textSecondary),
                  }}
                >
                  {item.desc}
                </KText>
              ))}
          </Pressable>
        );
      })}
    </View>
  );
}
