import { resolveFontStyle } from "./fonts";
import { typeStyle } from "./typography";
import { useCallback, useEffect,useState,type ReactNode } from "react";
import {
AccessibilityInfo,
Platform,
Text,
type ColorValue,
type TextProps,
} from "react-native";
import { useKjunStyles } from "./provider";
/** Resolves a text style's family to the face for its weight when the Provider has weight maps. */
export function useResolveFont() {
  const { fontFamily, fontFaces } = useKjunStyles();
  return useCallback(<S extends TextProps["style"]>(style: S) => resolveFontStyle(style, fontFaces || {}, fontFamily), [fontFaces, fontFamily]);
}
export function KText({ style, ...props }: TextProps) {
  const { colors, fontFamily } = useKjunStyles();
  const resolve = useResolveFont();
  return (
    <Text
      {...props}
      style={resolve([
        { fontFamily, color: colors.text, ...typeStyle('body'),  },
        style,
      ])}
    />
  );
}
/** A Text without KJUN's default type, for spans that inherit their parent's; it still resolves weight faces. */
export function FontText({ style, ...props }: TextProps) {
  const resolve = useResolveFont();
  return <Text {...props} style={resolve(style)} />;
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
