import { typeStyle } from "./typography";
import { useEffect,useState,type ReactNode } from "react";
import {
AccessibilityInfo,
Platform,
Text,
type ColorValue,
type TextProps,
} from "react-native";
import { useKjunStyles } from "./provider";
export function KText({ style, ...props }: TextProps) {
  const { colors, fontFamily } = useKjunStyles();
  return (
    <Text
      {...props}
      style={[
        { fontFamily, color: colors.text, ...typeStyle('body'),  },
        style,
      ]}
    />
  );
}
export function content(value: ReactNode, style?: TextProps["style"]) {
  return typeof value === "string" || typeof value === "number" ? (
    <KText style={style}>{value}</KText>
  ) : (
    value
  );
}
// Like Web's sizing rules: on Native Web with a mouse-like pointer, controls keep their visible size;
// touch layouts (devices, coarse pointers) add room for the 44px touch target.
export const finePointer = () =>
  Platform.OS === "web" && typeof matchMedia === "function" && !matchMedia("(pointer: coarse)").matches;
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => Platform.OS === "web" && typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
export function domainColor(
  domain: Record<string, ColorValue> | undefined,
  key: string
): ColorValue {
  if (domain?.[key] == null) throw Error("Missing KJUN domain color: " + key);
  return domain[key];
}
