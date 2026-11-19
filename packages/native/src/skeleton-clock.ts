import { tokens } from "@kjun-ui/tokens";
import { useEffect } from "react";
import { Animated } from "react-native";

// One pulse for every Native skeleton: a single loop runs while any skeleton is animating, so dozens of
// skeletons cost one JS-driven animation and brighten and dim together, however late each one mounts.
const pulse = new Animated.Value(1);
let users = 0, loop: Animated.CompositeAnimation | undefined;

function start() {
  loop = Animated.loop(Animated.sequence([
    Animated.timing(pulse, { toValue: 0.6, duration: tokens.motion.shimmer / 2, useNativeDriver: false }),
    Animated.timing(pulse, { toValue: 1, duration: tokens.motion.shimmer / 2, useNativeDriver: false }),
  ]));
  loop.start();
}

/** The shared pulse (1 → 0.6 → 1) while `active`, or undefined so the skeleton rests on its base colour. */
export function useSkeletonPulse(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (users++ === 0) start();
    return () => {
      if (--users === 0) {
        loop?.stop();
        loop = undefined;
        pulse.setValue(1);
      }
    };
  }, [active]);
  return active ? pulse : undefined;
}

/** The pulsing fill between the base and shine colours, or the base colour while still (or when either is not a plain colour). */
export function skeletonFill(pulse: Animated.Value | undefined, colors: { skeleton: unknown; skeletonShine: unknown }) {
  return pulse && typeof colors.skeletonShine === "string" && typeof colors.skeleton === "string"
    ? pulse.interpolate({ inputRange: [0.6, 1], outputRange: [colors.skeletonShine, colors.skeleton] })
    : (colors.skeleton as string);
}

/** A skeleton is hidden from assistive technology unless it carries loading text, which it then announces politely. */
export const skeletonStatus = (loadingText?: string) => loadingText
  ? { role: "status" as const, accessible: true, accessibilityLabel: loadingText, accessibilityLiveRegion: "polite" as const }
  : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const };
