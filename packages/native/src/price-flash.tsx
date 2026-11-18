import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform } from "react-native";
import { useReducedMotion } from "./internal";
import { priceFlashDirection, priceFlashKind, type PriceFlash } from "../../../shared/package-runtime/data-cells";

const curve = tokens.motion.easeOut.match(/-?\d*\.?\d+/g)!.map(Number) as [number, number, number, number];
const easing = Easing.bezier(...curve);

/**
 * Native form of the web price flash (price-motion.css): an overlay in the move's colour fades out. The text flash
 * holds its colour for the first fifth of motion.priceFlash like the keyframes; the background flash fades over
 * motion.priceBackground. Off under reduced motion, as on the web.
 */
export function usePriceFlash(value: number | null | undefined, flash: PriceFlash | undefined) {
  const kind = priceFlashKind(flash), reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current, previous = useRef(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    const moved = kind && !reduced ? priceFlashDirection(previous.current, value) : null;
    previous.current = value;
    if (!kind || !moved) return;
    setDirection(moved);
    opacity.stopAnimation();
    opacity.setValue(1);
    const text = kind === "text", useNativeDriver = Platform.OS !== "web";
    const run = Animated.sequence([
      Animated.delay(text ? tokens.motion.priceFlash * 0.2 : 0),
      Animated.timing(opacity, { toValue: 0, duration: text ? tokens.motion.priceFlash * 0.8 : tokens.motion.priceBackground, easing, useNativeDriver }),
    ]);
    run.start();
    return () => run.stop();
  }, [value, kind, reduced, opacity]);
  return { kind, direction, opacity };
}
