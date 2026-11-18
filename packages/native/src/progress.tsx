import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { progressCircle, progressPercent, progressState } from "../../../shared/package-runtime/progress-circle";
import { progressMarker, progressMarkerInset } from "../../../shared/package-runtime/progress-marker";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { typeStyle } from "./typography";
import { KText, content, useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { nativeDriver } from "./motion";
import type { SemanticTone } from "./display-primitives";

export interface KjunProgressProps {
  /** null is missing data; omission keeps the zero default. */
  value?: number | null;
  /** Work is active but its completion percentage is unknown; takes precedence over null. */
  indeterminate?: boolean;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: SemanticTone;
  showLabel?: boolean;
  /** Shown and read in place of the rounded percent while the value is known, e.g. "37.4%" or "3.2 / 8 GB". */
  valueText?: string;
  /** A reference point across the bar on the value's own scale (0 to max), such as today's share of a budget. Bars only; not drawn while indeterminate or missing. */
  marker?: number;
  /** Read by screen readers as the bar's hint, e.g. "오늘 기준 53%". Put visible wording in subLabel. */
  markerLabel?: string;
  label?: ReactNode;
  subLabel?: ReactNode;
  shape?: "bar" | "circle";
}
/**
 * The marker line over a rail, as a sibling of the rail inside one wrapper: the rail clips its fill, the line overhangs it.
 * A surface-coloured border keeps the line apart from a fill of its own colour. Internal.
 */
export function ProgressMarker({ percent }: { percent: number }) {
  const { colors } = useKjunStyles(), spec = tokens.extensions.progress.marker;
  return <View pointerEvents="none" style={{ position: "absolute", top: -spec.overhang - spec.gap, bottom: -spec.overhang - spec.gap, left: `${percent}%`,
    marginLeft: -progressMarkerInset(percent) - spec.gap, width: spec.width + 2 * spec.gap, borderWidth: spec.gap, borderColor: colors.surface,
    borderRadius: tokens.radius.radius9999, backgroundColor: colors.text }} />;
}
// Share of the bar the unknown-progress segment covers, like Web's 30% sweep.
const segment = 0.3;
// One 0→1 sweep per spin period while active. With reduced motion it is one breath per shimmer period
// (the circle pulses like the spinner ring; the bar ignores it and parks its segment).
function useSweep(active: boolean, reduced: boolean) {
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { sweep.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: reduced ? tokens.motion.shimmer : tokens.motion.spin,
      easing: reduced ? Easing.inOut(Easing.ease) : Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => { loop.stop(); sweep.setValue(0); };
  }, [active, reduced, sweep]);
  return sweep;
}
export function KjunProgress({
  value = 0,
  indeterminate = false,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  valueText,
  marker,
  markerLabel,
  label,
  subLabel,
  shape = "bar",
}: KjunProgressProps) {
  const m = useKjunMessages();
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const reduced = useReducedMotion();
  const state = progressState(value, max, indeterminate), busy = state === "indeterminate";
  const percentage = state === "determinate" ? progressPercent(value!, max) : 0;
  const text = busy ? m.loadingEllipsis : state === "missing" ? "—" : valueText ?? `${percentage}%`;
  const sweep = useSweep(busy, reduced);
  const [trackWidth, setTrackWidth] = useState(0);
  // A label that is not plain text names the bar through aria-labelledby where the platform supports it
  // (Android, Native Web); the generic name stays as the fallback.
  const labelId = "kjun-progress-label-" + useId().replace(/:/g, ""), linked = !!label && typeof label !== "string" && state !== "missing";
  const named = (node: ReactNode) => (linked ? <View nativeID={labelId}>{node}</View> : node);
  const name = typeof label === "string" ? label : m.progress, color = variant === "primary" ? colors.brand : colors[variant];
  // Missing data is an image named "no data", not a 0% bar. RN Web drops accessibilityValue, so values also go out as aria-*.
  const semantics = state === "missing"
    ? { accessibilityRole: "image" as const, accessibilityLabel: `${name}: ${m.noData}` }
    : { accessibilityRole: "progressbar" as const, accessibilityLabel: name, accessibilityState: { busy }, "aria-labelledby": linked ? labelId : undefined,
      accessibilityValue: busy ? { text: m.loadingEllipsis } : { min: 0, max: 100, now: percentage, ...(valueText ? { text: valueText } : {}) },
      "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": busy ? undefined : percentage,
      "aria-valuetext": busy ? m.loadingEllipsis : valueText, "aria-busy": busy || undefined };
  if (shape === "circle") {
    // Like Web: circle, then label and subLabel centred below it. Unknown progress spins a quarter arc.
    const c = progressCircle(size, busy ? 25 : percentage);
    // Reduced motion: a still quarter arc would read as 25%, so it breathes like the spinner ring.
    const spin = reduced ? { opacity: sweep.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, tokens.states.opacity.spinnerPulse, 1] }) }
      : { transform: [{ rotate: sweep.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] };
    return (
      <View style={{ alignSelf: "flex-start", alignItems: "center" }}>
        <View {...semantics} style={{ width: c.diameter, height: c.diameter, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={[StyleSheet.absoluteFill, busy ? spin : null]}>
            <Svg width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`}>
              <Circle cx={c.centre} cy={c.centre} r={c.radius} stroke={colors.switchTrack ?? colors.border} strokeWidth={c.stroke} fill="none" />
              {(percentage > 0 || busy) && <Circle cx={c.centre} cy={c.centre} r={c.radius} stroke={color} strokeWidth={c.stroke} fill="none"
                strokeLinecap="round" strokeDasharray={c.circumference} strokeDashoffset={c.offset} rotation={-90} origin={`${c.centre}, ${c.centre}`} />}
            </Svg>
          </Animated.View>
          {showLabel && c.showsPercentage && !busy && <KText style={{ ...typeStyle(size === "lg" ? "numberMd" : "meta"), fontFamily: numericFontFamily || fontFamily,
            fontVariant: ["tabular-nums"], color: colors.text }}>{text}</KText>}
        </View>
        {named(content(label, { ...typeStyle("caption"), marginTop: tokens.dimension.value8, color: colors.textSecondary, textAlign: "center" }))}
        {content(subLabel, { ...typeStyle("caption"), marginTop: tokens.dimension.value4, color: colors.textTertiary, textAlign: "center" })}
      </View>
    );
  }
  // Like Web's sweep from -100% to 334% of the segment; reduced motion parks it in the middle (116%).
  const travel = busy ? { transform: [{ translateX: reduced ? trackWidth * segment * 1.16
    : sweep.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth * segment, trackWidth * segment * 3.34] }) }] } : null;
  const mark = state === "determinate" ? progressMarker(marker, max) : null;
  return (
    <View>
      {!!(label || showLabel) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: tokens.dimension.value8 }}>
          {named(content(label, { ...typeStyle("caption"), color: colors.textSecondary }))}
          {showLabel && <KText style={{ ...typeStyle("caption"), color: colors.textSecondary }}>{text}</KText>}
        </View>
      )}
      <View>
      <View
        {...semantics}
        accessibilityHint={mark != null ? markerLabel : undefined}
        onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
        style={{
          height: tokens.extensions.progress.heights[size],
          // One empty-rail role with Slider and RangeSlider, like Web: the switch-track role.
          backgroundColor: colors.switchTrack ?? colors.border,
          borderRadius: tokens.radius.radius9999,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[{
            width: `${busy ? segment * 100 : percentage}%`,
            height: "100%",
            borderRadius: tokens.radius.radius9999,
            backgroundColor: color,
          }, travel]}
        />
      </View>
      {mark != null && <ProgressMarker percent={mark} />}
      </View>
      {content(subLabel, { ...typeStyle("caption"), marginTop: tokens.dimension.value4, color: colors.textTertiary })}
    </View>
  );
}
