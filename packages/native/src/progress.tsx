import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { progressCircle, progressState } from "../../../shared/package-runtime/progress-circle";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  label?: ReactNode;
  subLabel?: ReactNode;
  shape?: "bar" | "circle";
}
// Share of the bar the unknown-progress segment covers, like Web's 30% sweep.
const segment = 0.3;
// One 0→1 sweep per spin period while active; reduced motion holds it still.
function useSweep(active: boolean, reduced: boolean) {
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || reduced) { sweep.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: tokens.motion.spin, easing: Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
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
  label,
  subLabel,
  shape = "bar",
}: KjunProgressProps) {
  const m = useKjunMessages();
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const reduced = useReducedMotion();
  const state = progressState(value, max, indeterminate), busy = state === "indeterminate";
  const percentage = state === "determinate" ? Math.min(100, Math.max(0, Math.round((value! / max) * 100))) : 0;
  const text = busy ? m.loadingEllipsis : state === "missing" ? "—" : `${percentage}%`;
  const sweep = useSweep(busy, reduced);
  const [trackWidth, setTrackWidth] = useState(0);
  const name = typeof label === "string" ? label : m.progress, color = variant === "primary" ? colors.brand : colors[variant];
  // Missing data is an image named "no data", not a 0% bar. RN Web drops accessibilityValue, so values also go out as aria-*.
  const semantics = state === "missing"
    ? { accessibilityRole: "image" as const, accessibilityLabel: `${name}: ${m.noData}` }
    : { accessibilityRole: "progressbar" as const, accessibilityLabel: name, accessibilityState: { busy },
      accessibilityValue: busy ? { text: m.loadingEllipsis } : { min: 0, max: 100, now: percentage },
      "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": busy ? undefined : percentage,
      "aria-valuetext": busy ? m.loadingEllipsis : undefined, "aria-busy": busy || undefined };
  if (shape === "circle") {
    // Like Web: circle, then label and subLabel centred below it. Unknown progress spins a quarter arc.
    const c = progressCircle(size, busy ? 25 : percentage);
    const spin = { transform: [{ rotate: sweep.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] };
    return (
      <View style={{ alignSelf: "flex-start", alignItems: "center" }}>
        <View {...semantics} style={{ width: c.diameter, height: c.diameter, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={[StyleSheet.absoluteFill, busy ? spin : null]}>
            <Svg width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`}>
              <Circle cx={c.centre} cy={c.centre} r={c.radius} stroke={colors.secondary} strokeWidth={c.stroke} fill="none" />
              {(percentage > 0 || busy) && <Circle cx={c.centre} cy={c.centre} r={c.radius} stroke={color} strokeWidth={c.stroke} fill="none"
                strokeLinecap="round" strokeDasharray={c.circumference} strokeDashoffset={c.offset} rotation={-90} origin={`${c.centre}, ${c.centre}`} />}
            </Svg>
          </Animated.View>
          {showLabel && c.showsPercentage && !busy && <KText style={{ ...typeStyle(size === "lg" ? "numberMd" : "meta"), fontFamily: numericFontFamily || fontFamily,
            fontVariant: ["tabular-nums"], color: colors.text }}>{text}</KText>}
        </View>
        {content(label, { ...typeStyle("caption"), marginTop: tokens.dimension.value8, color: colors.textSecondary, textAlign: "center" })}
        {content(subLabel, { ...typeStyle("caption"), marginTop: tokens.dimension.value4, color: colors.textTertiary, textAlign: "center" })}
      </View>
    );
  }
  // Like Web's sweep from -100% to 334% of the segment; reduced motion parks it in the middle (116%).
  const travel = busy ? { transform: [{ translateX: reduced ? trackWidth * segment * 1.16
    : sweep.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth * segment, trackWidth * segment * 3.34] }) }] } : null;
  return (
    <View>
      {!!(label || showLabel) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: tokens.dimension.value8 }}>
          {content(label, { ...typeStyle("caption"), color: colors.textSecondary })}
          {showLabel && <KText style={{ ...typeStyle("caption"), color: colors.textSecondary }}>{text}</KText>}
        </View>
      )}
      <View
        {...semantics}
        onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
        style={{
          height: tokens.extensions.progress.heights[size],
          backgroundColor: colors.secondary,
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
      {content(subLabel, { ...typeStyle("caption"), marginTop: tokens.dimension.value4, color: colors.textTertiary })}
    </View>
  );
}
