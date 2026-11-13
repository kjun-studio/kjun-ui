import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { distributionNumber, gaugeNeighbours, gaugePosition, gaugeSliver, gaugeSegments, gaugeSpoken, gaugeZoneIndex, type GaugeZone } from "../../../shared/package-runtime/distribution";
import { useState } from "react";
import { I18nManager, Platform, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type KjunGaugeZone = Omit<GaugeZone, "color"> & { color?: ColorValue };
export interface KjunZoneGaugeProps {
  /** Where the marker sits. null, undefined and non-finite numbers are missing: no axis is drawn, and 0 is a real value. */
  value: number | null | undefined;
  min?: number;
  max?: number;
  /** The axis from min to max in order: each zone ends at `to`, with the app's label and colour. */
  zones: readonly KjunGaugeZone[];
  /** Shown above the axis and read first. */
  label?: string;
  /** The accessible name when there is no visible label, or a fuller one than it. */
  ariaLabel?: string;
  size?: "sm" | "md";
  /** Zone names under the axis, so zones are not told apart by colour alone. */
  zoneLabels?: boolean;
  /** The value and its zone name at the end of the caption line. */
  showValue?: boolean;
  formatValue?: (value: number) => string;
  /** Shown in place of the value when it is missing; defaults to an em dash. */
  missingText?: string;
  style?: StyleProp<ViewStyle>;
}

const geometry = tokens.extensions.zoneGauge;
// Screen readers hear the root's one sentence; the drawn parts stay out of their way.
export const hiddenParts = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const,
  ...(Platform.OS === "web" ? { "aria-hidden": true } : {}) };

/** A value's place on a fixed axis of zones. It shows a reading; it is not a control. */
export function KjunZoneGauge({ value, min = 0, max = 100, zones, label, ariaLabel, size = "md", zoneLabels = true, showValue = true,
  formatValue, missingText, style }: KjunZoneGaugeProps) {
  const scope = useKjunMessageScope();
  const { colors } = useKjunStyles();
  const segments = gaugeSegments(zones as readonly GaugeZone[], min, max);
  const ready = typeof value === "number" && Number.isFinite(value) && segments.length > 0;
  const zone = ready ? segments[gaugeZoneIndex(value, segments)] : undefined;
  const valueText = ready ? formatValue ? formatValue(value) : distributionNumber(value, scope.intl) : missingText ?? "—";
  const spoken = gaugeSpoken(ariaLabel ?? label, ready ? valueText : missingText ?? scope.messages.noData, zone?.label);
  const track = size === "sm" ? geometry.smTrackHeight : geometry.trackHeight, position = ready ? gaugePosition(value, min, max) : 0;
  const end = tokens.radius.radius9999, neutral = colors.switchTrack ?? colors.border;
  // Like Web: a zone sliver thinner than the minimum between a boundary and the marker's ring is covered.
  const [width, setWidth] = useState(0), near = ready ? gaugeNeighbours(position, segments) : {};
  const covers = (["before", "after"] as const).map(side => ({ side, sliver: gaugeSliver(width, position, segments.length, near[side], side, geometry) }));
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={spoken} style={[{ minWidth: 0 }, style]}>
      <View {...hiddenParts}>
        {(!!label || showValue || !ready) && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: tokens.dimension.value12, marginBottom: geometry.captionGap }}>
            <KText numberOfLines={1} style={{ ...typeStyle("label"), color: colors.textSecondary, flexShrink: 1 }}>{label}</KText>
            {(showValue || !ready) && <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: ready ? colors.text : colors.textTertiary }}>{valueText}{zone?.label ? " · " + zone.label : ""}</KText>}
          </View>
        )}
        {/* Like Web: a missing value keeps the axis and the zone names, without colours or a marker. */}
        {segments.length > 0 && (
          <View style={{ paddingVertical: geometry.markerOverhang }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
            <View style={{ flexDirection: "row", gap: geometry.segmentGap, height: track }}>
              {segments.map((segment, i) => (
                <View key={i} style={{ flexGrow: segment.share, flexBasis: 0, minWidth: 0, backgroundColor: (ready ? segment.color as ColorValue | undefined : undefined) ?? neutral,
                  ...(i === 0 ? { borderTopStartRadius: end, borderBottomStartRadius: end } : {}),
                  ...(i === segments.length - 1 ? { borderTopEndRadius: end, borderBottomEndRadius: end } : {}) }} />
              ))}
            </View>
            {covers.map(({ side, sliver }) => sliver && (
              <View key={side} style={{ position: "absolute", top: geometry.markerOverhang, bottom: geometry.markerOverhang, start: sliver.start, width: sliver.size, backgroundColor: colors.surface }} />
            ))}
            {/* The marker stays inside the axis at both ends, with a ring in the surface colour over any zone colour. */}
            {ready && <View style={{ position: "absolute", top: 0, bottom: 0, start: `${position}%`, marginStart: -geometry.markerWidth * position / 100,
              width: geometry.markerWidth, borderRadius: end, backgroundColor: colors.text,
              boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: geometry.markerRing, color: colors.surface }] } as ViewStyle} />}
          </View>
        )}
        {segments.length > 0 && zoneLabels && segments.some(segment => segment.label) && (
          <View style={{ flexDirection: "row", gap: geometry.segmentGap, marginTop: geometry.labelsGap }}>
            {segments.map((segment, i) => (
              <KText key={i} numberOfLines={1} style={{ ...typeStyle("caption"), color: colors.textSecondary, flexGrow: segment.share, flexBasis: 0, minWidth: 0,
                textAlign: i === 0 ? "auto" : i === segments.length - 1 ? I18nManager.isRTL ? "left" : "right" : "center" }}>{segment.label}</KText>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
