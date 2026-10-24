import { resolveFontStyle } from "./fonts";
import { typeStyle } from "./typography";
import { createContext, useCallback, useContext, useEffect,useState,type ReactNode } from "react";
import {
AccessibilityInfo,
Platform,
StyleSheet,
Text,
type ColorValue,
type TextProps,
} from "react-native";
import { useKjunStyles } from "./provider";
// The family a KJUN text resolved from, so a nested span that only sets a weight stays in that family
// (a prefix inside numeric text keeps the numeric faces).
const InheritedFontFamily = createContext<string | undefined>(undefined);
/** Resolves a text style's family to the face for its weight when the Provider has weight maps. */
export function useResolveFont() {
  const { fontFamily, fontFaces } = useKjunStyles();
  const inherited = useContext(InheritedFontFamily);
  return useCallback(<S extends TextProps["style"]>(style: S) => resolveFontStyle(style, fontFaces || {}, inherited ?? fontFamily), [fontFaces, fontFamily, inherited]);
}
function ResolvedText({ style, children, ...props }: TextProps) {
  const { fontFaces } = useKjunStyles();
  const inherited = useContext(InheritedFontFamily);
  const resolve = useResolveFont();
  if (!fontFaces || !Object.keys(fontFaces).length) return <Text {...props} style={style}>{children}</Text>;
  const family = StyleSheet.flatten(style)?.fontFamily ?? inherited;
  return <Text {...props} style={resolve(style)}><InheritedFontFamily.Provider value={family}>{children}</InheritedFontFamily.Provider></Text>;
}
export function KText({ style, ...props }: TextProps) {
  const { colors, fontFamily } = useKjunStyles();
  return <ResolvedText {...props} style={[{ fontFamily, color: colors.text, ...typeStyle('body') }, style]} />;
}
/** A Text without KJUN's default type, for spans that inherit their parent's; it still resolves weight faces. */
export function FontText(props: TextProps) {
  return <ResolvedText {...props} />;
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
