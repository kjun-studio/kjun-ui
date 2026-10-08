import { useRef, useState, type ReactNode } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { DsIcon } from "./button";
import { KText, content } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
export interface DsImageProps { src?: string; source?: ImageSourcePropType; alt: string; decorative?: boolean; aspectRatio?: number; fit?: "cover" | "contain"; fallback?: ReactNode; onLoad?: () => void; onError?: () => void }
export function DsImage({ src, source, alt, decorative = false, aspectRatio = 1, fit = "cover", fallback, onLoad, onError }: DsImageProps) {
  const { colors } = useKjunStyles();
  const request = JSON.stringify(source ?? src), current = useRef({ request, version: 0 });
  if (current.current.request !== request) current.current = { request, version: current.current.version + 1 };
  const version = current.current.version;
  const [failed, setFailed] = useState<number | null>(null);
  const missing = !source && !src;
  return <View accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? "no-hide-descendants" : "auto"} aria-hidden={decorative || undefined} style={{ width: "100%", aspectRatio: aspectRatio > 0 ? aspectRatio : 1, overflow: "hidden", backgroundColor: colors.secondary }}>
    {!missing && failed !== version ? <Image key={version} source={source ?? { uri: src }} accessible={!decorative} accessibilityLabel={decorative ? undefined : alt} resizeMode={fit} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} onLoad={() => { if (version === current.current.version) onLoad?.(); }} onError={() => { if (version === current.current.version) { setFailed(version); onError?.(); } }} /> : <View accessible={!decorative} accessibilityRole="image" accessibilityLabel={decorative ? undefined : alt} aria-hidden={decorative || undefined} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>{/* Like Web, text fallback uses the secondary text role at control weight. */}{content(fallback ?? <DsIcon name="image" size={tokens.extensions.image.fallbackIconSize} color={colors.textSecondary} />, { color: colors.textSecondary, fontWeight: typeStyle("control").fontWeight, textAlign: "center" })}</View>}
  </View>;
}
export interface DsAvatarProps { src?: string; source?: ImageSourcePropType; name?: string; alt?: string; decorative?: boolean; size?: "sm" | "md" | "lg"; shape?: "circle" | "square"; fallback?: ReactNode; onLoad?: () => void; onError?: () => void }
export function DsAvatar({ src, source, name = "", alt, decorative = false, size = "md", shape = "circle", fallback, onLoad, onError }: DsAvatarProps) {
  const { colors } = useKjunStyles(), initial = Array.from(name.trim())[0];
  return <View style={{ width: tokens.extensions.avatar[size], height: tokens.extensions.avatar[size], borderRadius: shape === "circle" ? tokens.radius.radius9999 : tokens.radius.radius8, overflow: "hidden", flexShrink: 0 }}><DsImage src={src} source={source} alt={alt || name || "사용자"} decorative={decorative} fallback={fallback ?? (initial
    // Like Web: initials scale with the avatar, use control weight and the secondary text role, and capitalize Latin letters.
    ? <KText style={{ ...typeStyle(size === "sm" ? "control" : size === "lg" ? "sectionTitle" : "input"), fontWeight: typeStyle("control").fontWeight, color: colors.textSecondary }}>{initial.toLocaleUpperCase()}</KText>
    : <DsIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[size]} />)} onLoad={onLoad} onError={onError} /></View>;
}
