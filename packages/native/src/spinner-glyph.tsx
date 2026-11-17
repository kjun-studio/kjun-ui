import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, type ColorValue } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { spinnerArc, spinnerCircle, spinnerStroke } from "../../../shared/package-runtime/spinner-geometry";
import { useReducedMotion } from "./internal";

/** Internal loading ring shared by Spinner, Button, Fab, List, Switch and Toast. Decorative: the owner announces the state. */
export function KjunSpinnerGlyph({ size, stroke, color }: { size: number; stroke?: number; color: ColorValue }) {
  const reduced = useReducedMotion(),
    progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Turning, or with reduced motion a breathing ring: a ring that stops reads as stuck.
    const loop = Animated.loop(Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? tokens.motion.shimmer : tokens.motion.spin,
      easing: reduced ? Easing.inOut(Easing.ease) : Easing.linear,
      useNativeDriver: Platform.OS !== "web",
    }));
    loop.start();
    return () => {
      loop.stop();
      progress.setValue(0);
    };
  }, [reduced, progress]);
  const width = spinnerStroke(size, stroke);
  const motion = reduced
    ? { opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, tokens.states.opacity.spinnerPulse, 1] }) }
    : { transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] };
  return (
    <Animated.View aria-hidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, ...motion }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle {...spinnerCircle} stroke={color} strokeWidth={width} opacity={tokens.states.opacity.spinnerTrack} />
        <Path d={spinnerArc} stroke={color} strokeWidth={width} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
