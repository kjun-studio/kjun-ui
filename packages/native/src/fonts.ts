import { Platform, StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";

export type KjunFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
/** Font names by weight, for platforms (Android, Expo) that load every weight as its own family. */
export type KjunFontWeights = Partial<Record<KjunFontWeight, string>>;
export type KjunFontFamily = string | KjunFontWeights;
/** Every face name of a weight map points back to its map, so a style naming any face can be re-resolved. */
export type KjunFontFaces = Record<string, KjunFontWeights>;

const weights: KjunFontWeight[] = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/** The face closest to `weight`; a tie takes the heavier face. */
export function nearestFace(faces: KjunFontWeights, weight: number): string | undefined {
  let best: string | undefined, bestDistance = Infinity;
  for (const candidate of weights) {
    const name = faces[candidate];
    if (!name) continue;
    const distance = Math.abs(candidate - weight);
    if (distance <= bestDistance) { best = name; bestDistance = distance; }
  }
  return best;
}
/** The family name components use as their base: the string itself, or the face closest to 400. */
export const baseFontFamily = (family?: KjunFontFamily) => typeof family === "string" ? family : family && nearestFace(family, 400);
export function fontFacesOf(family?: KjunFontFamily): KjunFontFaces {
  if (!family || typeof family === "string") return {};
  return Object.fromEntries(Object.values(family).filter(Boolean).map(name => [name as string, family]));
}

const numericWeight = (weight: TextStyle["fontWeight"]) =>
  weight == null || weight === "normal" ? 400 : weight === "bold" ? 700 : Number(weight) || 400;

/** Swaps the family for the face matching the final fontWeight. Native then draws that face at its own weight. */
export function resolveFontStyle<S extends StyleProp<TextStyle>>(style: S, faces: KjunFontFaces, base?: string): S | StyleProp<TextStyle> {
  if (!Object.keys(faces).length) return style;
  const flat = StyleSheet.flatten(style) || {};
  // A nested span that only sets a weight still needs its own face rather than the parent's.
  const family = flat.fontFamily ?? (flat.fontWeight != null ? base : undefined);
  const set = family ? faces[family] : undefined;
  if (!set) return style;
  const face = nearestFace(set, numericWeight(flat.fontWeight));
  // The face already carries the weight; the regular (body) weight keeps Native from synthesising bold on top.
  return [style, { fontFamily: face, ...(Platform.OS !== "web" ? { fontWeight: String(tokens.typography.body.fontWeight) as TextStyle["fontWeight"] } : {}) }];
}
