import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { gaugeHole, gaugeModel, gaugePieces, type GaugeZone } from "../../../shared/package-runtime/distribution";
import { useState } from "react";
import { I18nManager, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KText, hiddenParts } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type KjunGaugeZone = Omit<GaugeZone, "color"> & { color?: ColorValue };
export interface KjunZoneGaugeProps {
  /** Where the marker sits. null, undefined and non-finite numbers are missing: the axis stays, without zone colours or a marker, and 0 is a real value. */
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
/** A value's place on a fixed axis of zones. It shows a reading; it is not a control. */
export function KjunZoneGauge({ value, min = 0, max = 100, zones, label, ariaLabel, size = "md", zoneLabels = true, showValue = true,
  formatValue, missingText, style }: KjunZoneGaugeProps) {
  const scope = useKjunMessageScope();
  const { colors } = useKjunStyles();
  const { segments, ready, position, near, caption, spoken } = gaugeModel({ value, min, max, zones: zones as readonly GaugeZone[], label, ariaLabel, formatValue, missingText,
    noData: scope.messages.noData, locale: scope.intl });
  const track = size === "sm" ? geometry.smTrackHeight : geometry.trackHeight;
  const end = tokens.radius.radius9999, neutral = colors.switchTrack ?? colors.border;
  // Like Web: the track leaves a gap around the marker (widened over a sliver too thin to read), so any background shows
  // through it. Until the axis is measured the zones are laid out by flex, without the gap.
  const [width, setWidth] = useState(0);
  const pieces = width > 0 && ready ? gaugePieces(width, segments, geometry.segmentGap, gaugeHole(width, position, segments.length, near, geometry)) : null;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={spoken} style={[{ minWidth: 0 }, style]}>
      <View {...hiddenParts}>
        {(!!label || showValue || !ready) && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: tokens.dimension.value12, marginBottom: geometry.captionGap }}>
            <KText numberOfLines={1} style={{ ...typeStyle("label"), color: colors.textSecondary, flexShrink: 1 }}>{label}</KText>
            {(showValue || !ready) && <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: ready ? colors.text : colors.textTertiary }}>{caption}</KText>}
          </View>
        )}
        {/* Like Web: a missing value keeps the axis and the zone names, without colours or a marker. */}
        {segments.length > 0 && (
          <View style={{ paddingVertical: geometry.markerOverhang }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
            {pieces ? (
              <View style={{ flexDirection: "row", height: track }}>
                {pieces.map((piece, i) => (
                  <View key={i} style={{ marginStart: piece.start - (i ? pieces[i - 1].start + pieces[i - 1].size : 0), width: piece.size, backgroundColor: (piece.color as ColorValue | undefined) ?? neutral,
                    ...(piece.first ? { borderTopStartRadius: end, borderBottomStartRadius: end } : {}),
                    ...(piece.last ? { borderTopEndRadius: end, borderBottomEndRadius: end } : {}) }} />
                ))}
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: geometry.segmentGap, height: track }}>
                {segments.map((segment, i) => (
                  <View key={i} style={{ flexGrow: segment.share, flexBasis: 0, minWidth: 0, backgroundColor: (ready ? segment.color as ColorValue | undefined : undefined) ?? neutral,
                    ...(i === 0 ? { borderTopStartRadius: end, borderBottomStartRadius: end } : {}),
                    ...(i === segments.length - 1 ? { borderTopEndRadius: end, borderBottomEndRadius: end } : {}) }} />
                ))}
              </View>
            )}
            {/* The marker stays inside the axis at both ends; the track's gap keeps it readable over any zone colour. */}
            {ready && <View style={{ position: "absolute", top: 0, bottom: 0, start: `${position}%`, marginStart: -geometry.markerWidth * position / 100,
              width: geometry.markerWidth, borderRadius: end, backgroundColor: colors.text }} />}
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
