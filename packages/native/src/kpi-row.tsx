import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { useState, type ReactNode } from "react";
import {
Platform,
View,
useWindowDimensions,
type ColorValue,
type GestureResponderEvent,
type TextStyle,
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunSkeleton } from "./display";
import { BadgeView } from "./display-primitives";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  KPI_MASK, KPI_NUMERAL_HEIGHT, kpiBadgeRoles, kpiBadgeVariant, kpiFormat, kpiGridLayout, kpiPresent, kpiSpoken, kpiSummaryLayout, kpiTone, type KpiBadgeVariant,
} from "../../../shared/package-runtime/kpi";
import { KjunAnimatedNumber } from "./financial";
import { KjunIcon } from "./button";
import { KpiNumberLine } from "./kpi-number-line";
import { KText, content, domainColor } from "./internal";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import type { KpiValue } from "./kpi-hero";
import { useKjunStyles } from "./provider";
export interface KpiRowItem extends Omit<KpiValue, "value"> {
  /** null/undefined and non-finite numbers are missing, never zero. Loading still takes precedence. */
  value?: number | string | null;
  loading?: boolean;
  clickable?: boolean;
  /** A link cell: on React Native Web it is a real link to this address; on a device it is a button and onItemClick navigates. */
  href?: string;
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
  badge?: { text: string; variant?: KpiBadgeVariant } | null;
  badgePlacement?: "label" | "value";
  /** An app control after the label, such as an info tooltip trigger or a mask toggle; it keeps the label's line height. */
  labelAside?: ReactNode;
}
export interface KjunKpiRowProps {
  loading?: boolean;
  items: KpiRowItem[];
  size?: "md" | "sm";
  /** "none" drops the card background, padding and radius, for a KPI placed inside a card, modal or full-width list. */
  surface?: "card" | "none";
  mobileSummary?: boolean;
  /** Hides number values and segments behind a mask, with no direction colour; text values, badges and descriptions stay. */
  masked?: boolean;
  onItemClick?: (item: KpiRowItem, index: number, event: GestureResponderEvent) => void;
  renderValue?: (item: KpiRowItem, index: number) => ReactNode;
}
export function KjunKpiRow({
  loading = false,
  items,
  size = "md",
  surface = "card",
  mobileSummary = true,
  masked = false,
  onItemClick,
  renderValue,
}: KjunKpiRowProps) {
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    windowWidth = useWindowDimensions().width,
    mobile = windowWidth <= tokens.responsive.kpiRow,
    // Like Web: on a phone the summary's half-width cells step their headline numbers down one type level.
    narrowSummary = windowWidth <= tokens.responsive.kpiRowNarrow,
    small = size === "sm",
    summary = mobileSummary && mobile && !small;
  const geometry = tokens.extensions.kpiRow;
  const spec = small ? geometry.sm : mobile ? geometry.mobile : geometry.md;
  const [width, setWidth] = useState(0);
  const paddingX = summary ? geometry.summary.paddingX : spec.paddingX;
  // surface="none" has no padding of its own, so its cells measure from its edges.
  const inset = surface === "none" ? 0 : paddingX;
  const gapX = summary ? geometry.summary.gapX : 0;
  const scope = useKjunMessageScope(), locale = scope.intl;
  // Only items marked mobileSecondary fold into the summary's inline footnote; the rest keep their two-column cells.
  const { secondary, lastFull } = kpiSummaryLayout(items);
  // Phone grid and sm wrap: the same columns, full lines and dividers as Web (shared kpiGridLayout).
  const grid = kpiGridLayout(items);
  // Like Web's container query, a cell steps its display number down by its own width, so a row in a narrow column
  // keeps every number whole: a wide row's cells share its width, a summary headline takes half.
  const cellWidth = !width ? 0 : !mobile ? (width - 2 * inset) / Math.max(1, items.length) - 2 * spec.itemPaddingX
    : summary ? (width - 2 * inset - gapX) / 2 : 0;
  const narrowCell = cellWidth > 0 && cellWidth <= tokens.responsive.kpiRowCell;
  const toneColor = (item: KpiRowItem, hide: boolean, neutral: ColorValue) => {
    const tone = hide ? null : kpiTone(item);
    return tone ? domainColor(domainColors, tone === "up" ? "priceUp" : "priceDown") : neutral;
  };
  const color = (item: KpiRowItem, hide: boolean) => item.valueColor || toneColor(item, hide, colors.text);
  const badge = (item: KpiRowItem) =>
    item.badge ? (
      <BadgeView
        variant={kpiBadgeVariant(item.badge.variant)}
        // Like Web's .kjun-kpi-row__badge: the xs badge's geometry and type, painted in its tone, with no dot.
        paint={kpiBadgeRoles(item.badge.variant)}
        typeRole="meta"
        size="xs"
        style={{ borderRadius: geometry.badgeRadius, gap: geometry.badgeGap, paddingHorizontal: geometry.badgePadding.x, paddingVertical: geometry.badgePadding.y }}
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
        // surface="none" sits inside the app's own card or list, so it drops its own card box.
        ...(surface === "none" ? {} : {
          paddingVertical: summary ? geometry.summary.paddingY : spec.paddingY,
          paddingHorizontal: paddingX,
          borderRadius: geometry.radius,
          backgroundColor: colors.surface,
        }),
        rowGap: summary ? geometry.summary.gapY : 0,
        columnGap: gapX,
      }}
    >
      {items.map((item, i) => {
        const busy = loading || !!item.loading,
          value = item.value,
          present = kpiPresent(value),
          link = !!item.href,
          clickable = !!item.clickable || link,
          hide = masked && item.valueKind !== "text" && (present || !!item.valueSegments),
          format = (number: number | string | null | undefined) => kpiFormat(item, number, locale),
          sub = summary && secondary[i],
          full = summary ? !!item.mobileFull || i === lastFull : mobile && grid[i].full,
          numberRole = sub ? "numberSm" : small ? "numberLg" : (mobile && (!summary || narrowSummary)) || narrowCell ? "numberLg" : "displaySm",
          numberSize = typeStyle(numberRole).fontSize;
        // A text value is a card title beside number cells; in a summary footnote it stays body text.
        const valueRole = item.valueKind === "text" ? (sub ? "body" : "cardTitle") : numberRole;
        // Summary headline units stay number-sm, like Web, also once a narrow phone steps the number down.
        const unitRole = item.valueKind !== "text" && (numberRole === "displaySm" || (summary && !sub)) ? "numberSm" : "meta";
        const dividerLeft = summary ? 0
          : mobile ? (!small && grid[i].column ? tokens.border.defaultWidth : 0)
          : i ? tokens.border.defaultWidth : 0;
        const dividerTop = mobile && !summary && grid[i].top ? tokens.border.defaultWidth : 0;
        // Like Web: a text value stands on an invisible strut of the value line's number, so its baseline meets the
        // numbers beside it; a summary footnote has no value line and keeps its own.
        const textStrut = (node: ReactNode) => item.valueKind !== "text" || sub ? node : (
          <View style={{ flexDirection: "row", alignItems: "baseline", minWidth: 0, flexShrink: 1 }}>
            <KText aria-hidden style={{ fontFamily: numericFontFamily || fontFamily, ...typeStyle(numberRole), width: 0 }}>{"\u200b"}</KText>
            {node}
          </View>
        );
        // Like React: a custom value of 0 or text is drawn; only nothing falls back to the built-in value.
        const custom = busy || hide || item.valueSegments ? null : renderValue?.(item, i);
        const valueStyle: TextStyle = {
          fontFamily: item.valueKind === "text" ? fontFamily : numericFontFamily || fontFamily,
          fontVariant: item.valueKind === "text" ? [] : ["tabular-nums"],
          ...typeStyle(valueRole),
          color: summary && item.mobileNeutral ? colors.text : color(item, hide),
        };
        // A clickable cell is one control, so it speaks every part it shows: label, badges, value and description.
        // A custom renderValue is unknown here, so that cell keeps the platform's reading of its children.
        const valueText = hide ? scope.messages.hiddenValue
          : item.valueSegments ? item.valueSegments.filter(seg => !seg.separator).map(seg => (seg.label ? seg.label + " " : "") + seg.text).join(" ")
          : present ? (item.prefix ?? "") + format(value) + (item.suffix ?? "") : format(value);
        const spoken = clickable && !busy && !renderValue
          ? kpiSpoken(item.label, item.badgePlacement !== "value" && item.badge?.text, valueText, item.badgePlacement === "value" && item.badge?.text, item.desc)
          : clickable ? item.label : undefined;
        return (
          <Pressable
            key={i}
            accessible={clickable}
            accessibilityRole={clickable ? (link && Platform.OS === "web" ? "link" : "button") : undefined}
            accessibilityLabel={spoken}
            {...(Platform.OS === "web" && link && !busy ? { href: item.href } : {})}
            disabled={!clickable || busy}
            onPress={event => onItemClick?.(item, i, event)}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
              // Like Web: hover fills the cell, pressing fills it one step deeper.
              backgroundColor: clickable && !busy && (pressed || hovered) ? (pressed ? colors.active : colors.hover) : undefined,
              flex: mobile ? undefined : 1,
              flexBasis:
                mobile
                  ? sub
                    ? "auto"
                    : full
                    ? "100%"
                    : width ? Math.max(0, (width - 2 * inset - gapX) / 2) : "50%"
                  : undefined,
              flexGrow: sub ? 0 : 1,
              // Like Web, the last secondary summary item closes the line at the far edge.
              marginLeft: sub && i === items.length - 1 ? "auto" : undefined,
              minWidth: 0,
              paddingVertical: summary ? 0 : small && mobile ? geometry.smallMobile.itemPaddingY : spec.itemPaddingY,
              paddingHorizontal: summary ? 0 : small && mobile ? geometry.smallMobile.itemPaddingX : spec.itemPaddingX,
              // Keep the separator's space; its straight paint lives outside the rounded background.
              borderLeftWidth: dividerLeft,
              borderTopWidth: dividerTop,
              borderColor: "transparent",
              borderRadius: clickable ? geometry.itemRadius : 0,
              flexDirection: sub ? "row" : "column",
              alignItems: sub ? "baseline" : undefined,
              gap: sub ? geometry.summary.secondaryGap : 0,
            })}
          >
            {!!(dividerLeft || dividerTop) && (
              <View
               
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ pointerEvents: "none",
                  position: "absolute",
                  top: -dividerTop,
                  left: -dividerLeft,
                  right: 0,
                  bottom: 0,
                  borderLeftWidth: dividerLeft,
                  borderTopWidth: dividerTop,
                  borderColor: colors.border,
                }}
              />
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                // A label badge sits right after its label, as that label's state.
                justifyContent: "flex-start",
                gap: spec.labelGap,
                marginBottom: sub ? 0 : spec.labelMargin,
              }}
            >
              {busy && !item.label ? (
                <KjunSkeleton type="line" role="caption" width={geometry.labelSkeletonWidth} />
              ) : (
                <KText style={{ minWidth: 0, flexShrink: 1, color: colors.textSecondary, ...typeStyle('caption') }}>
                  {item.label}
                </KText>
              )}
              {hasContent(item.labelAside) && (
                // The aside holds the label's line height; a larger control centres on it and spills over evenly.
                <View style={{ height: typeStyle("caption").lineHeight, justifyContent: "center", flexShrink: 0 }}>
                  {content(item.labelAside)}
                </View>
              )}
              {!busy && item.badgePlacement !== "value" && badge(item)}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: sub ? geometry.summary.secondaryGap : geometry.valueGap,
                minWidth: 0,
                // Every value line is as tall as this size's number line, so text values and dashes keep the row even.
                minHeight: sub ? undefined : typeStyle(numberRole).lineHeight,
              }}
            >
              {hide && !busy ? (
                <KText accessibilityLabel={scope.messages.hiddenValue} style={valueStyle}>{KPI_MASK}</KText>
              ) : item.valueSegments ? (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.segmentGap }}
                >
                  {item.valueSegments.map((seg, j) => (
                    <View key={j} style={{ flexDirection: sub ? 'row' : 'column', alignItems: 'center', display: summary && sub && seg.separator ? 'none' : 'flex' }}>
                      {summary && sub && seg.label && item.valueSegments!.slice(0, j).some(previous => previous.label) &&
                        <KText aria-hidden style={{ ...typeStyle('caption'), marginHorizontal: geometry.separatorGap, color: colors.textTertiary }}>·</KText>}
                      {sub && seg.label && (
                        // Like Web, segment labels show only in the summary footnote, in the label colour.
                        <KText
                          style={{ ...typeStyle('caption'), marginRight: geometry.segmentLabelGap, color: colors.textSecondary }}
                        >
                          {seg.label}
                        </KText>
                      )}
                      {busy && !seg.separator ? (
                        <KjunSkeleton type="line" role={valueRole} height={typeStyle(valueRole).fontSize * KPI_NUMERAL_HEIGHT} width={geometry.segmentSkeletonWidth} />
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
                <KjunSkeleton type="line" role={valueRole} height={typeStyle(valueRole).fontSize * KPI_NUMERAL_HEIGHT}
                  width={geometry.valueSkeletonWidth * (valueStyle.fontSize ?? numberSize) / typeStyle("displaySm").fontSize} />
              ) : (
                hasContent(custom) ? content(custom) : textStrut(!present ? (
                  <KText style={valueStyle}>{format(value)}</KText>
                ) : (
                  // Units sit 2px from their number, like Web; each is its own Text so it can take the gap.
                  <KpiNumberLine prefix={item.prefix} suffix={item.suffix} prefixGap={geometry.affixGap} suffixGap={geometry.affixGap}
                    style={{ ...valueStyle, flexShrink: 1, minWidth: 0 }} unitStyle={typeStyle(unitRole)}>
                    {item.animated && typeof value === "number" ? (
                      <KjunAnimatedNumber
                        fromPrevious
                        value={value}
                        formatter={format}
                        style={[valueStyle, { flexShrink: 1, minWidth: 0 }]}
                      />
                    ) : (
                      format(value!)
                    )}
                  </KpiNumberLine>
                ))
              )}
              {!busy && item.badgePlacement === "value" && badge(item)}
              {clickable && !sub && (
                <View style={{ marginLeft: "auto" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <KjunIcon name="chevron-right" size={geometry.chevronSize} color={colors.textTertiary} />
                </View>
              )}
            </View>
            {!!item.desc &&
              (busy ? (
                // The placeholder keeps the description's gap, so the cell does not grow when the data arrives.
                <View style={{ marginTop: spec.descriptionGap }}>
                  <KjunSkeleton type="line" role="caption" width={geometry.descriptionSkeletonWidth} />
                </View>
              ) : (
                <KText
                  style={{
                    ...typeStyle("caption"),

                    marginTop: spec.descriptionGap,
                    color:
                      item.descColor ||
                      toneColor(item, hide, colors.textSecondary),
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
