import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Image, View, type ColorValue, type ImageSourcePropType } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KText, content } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
import { avatarType } from "../../../shared/package-runtime/avatar-type";
export interface KjunImageProps {
  src?: string; source?: ImageSourcePropType; alt: string; decorative?: boolean;
  /** Width ÷ height; "auto" lets the loaded image set the height (a missing or failed image stays square). */
  aspectRatio?: number | "auto";
  fit?: "cover" | "contain";
  /** square (default), rounded corners, or a circle. */
  shape?: "square" | "rounded" | "circle";
  fallback?: ReactNode;
  /** Accepted for parity with the web packages; React Native loads images when they are drawn. */
  lazy?: boolean;
  onLoad?: () => void; onError?: () => void;
}
/** Internal: KjunAvatar paints its app color behind the image and fallback. */
const ImageBackgroundContext = createContext<ColorValue | undefined>(undefined);
export function KjunImage({ src, source, alt, decorative = false, aspectRatio = 1, fit = "cover", shape = "square", fallback, onLoad, onError }: KjunImageProps) {
  const { colors } = useKjunStyles(), background = useContext(ImageBackgroundContext);
  const request = JSON.stringify(source ?? src), current = useRef({ request, version: 0 });
  if (current.current.request !== request) current.current = { request, version: current.current.version + 1 };
  const version = current.current.version;
  const [failed, setFailed] = useState<number | null>(null);
  // aspectRatio="auto": the loaded image's own ratio, kept per request; until it loads the box has no height, like the web.
  const [natural, setNatural] = useState<{ version: number; ratio: number } | null>(null);
  const missing = !source && !src, showing = !missing && failed !== version, auto = aspectRatio === "auto";
  const ratio = auto ? (!showing ? 1 : natural?.version === version ? natural.ratio : undefined) : aspectRatio > 0 ? aspectRatio : 1;
  // A text fallback is drawn as a caption under the photo icon, and only the icon below the breakpoint width, like the web.
  const textual = typeof fallback === "string" || typeof fallback === "number";
  const [boxWidth, setBoxWidth] = useState(0);
  const caption = textual && boxWidth >= tokens.responsive.imageFallbackText;
  const icon = <KjunIcon name="photo" size={tokens.extensions.image.fallbackIconSize} color={colors.textSecondary} />;
  const radius = shape === "rounded" ? tokens.extensions.image.roundedRadius : shape === "circle" ? tokens.radius.radius9999 : undefined;
  // Devices report the decoded size as nativeEvent.source; React Native Web passes the DOM load event, whose target is the
  // decoded <img>. Native Web reloads the image whenever its handlers change, so they change only with the request.
  const latest = useRef({ auto, onLoad, onError });
  latest.current = { auto, onLoad, onError };
  const loaded = useCallback((event: { nativeEvent: unknown }) => {
    if (version !== current.current.version) return;
    const native = event.nativeEvent as { source?: { width?: number; height?: number }; target?: { naturalWidth?: number; naturalHeight?: number } };
    const width = native.source?.width ?? native.target?.naturalWidth, height = native.source?.height ?? native.target?.naturalHeight;
    if (latest.current.auto && width && height) setNatural(old => old?.version === version && old.ratio === width / height ? old : { version, ratio: width / height });
    latest.current.onLoad?.();
  }, [version]);
  const errored = useCallback(() => { if (version === current.current.version) { setFailed(version); latest.current.onError?.(); } }, [version]);
  return <View accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? "no-hide-descendants" : "auto"} aria-hidden={decorative || undefined} style={{ width: "100%", aspectRatio: ratio, height: ratio === undefined ? 0 : undefined, borderRadius: radius, overflow: "hidden", backgroundColor: background ?? colors.secondary }}>
    {showing ? <Image key={version} source={source ?? { uri: src }} accessible={!decorative} accessibilityLabel={decorative ? undefined : alt} resizeMode={fit} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      onLoad={loaded} onError={errored} /> : <View accessible={!decorative} accessibilityRole="image" accessibilityLabel={decorative ? undefined : alt} aria-hidden={decorative || undefined}
      onLayout={textual ? event => setBoxWidth(event.nativeEvent.layout.width) : undefined}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: tokens.space.inline.xs, paddingHorizontal: textual ? tokens.space.inline.md : 0 }}>
      {textual ? <>{icon}{caption ? <KText style={{ ...typeStyle("caption"), color: colors.textSecondary, textAlign: "center" }}>{fallback}</KText> : null}</>
        /* Like Web, other fallbacks use the secondary text role at control weight. */
        : content(fallback ?? icon, { color: colors.textSecondary, fontWeight: typeStyle("control").fontWeight, textAlign: "center" })}
    </View>}
  </View>;
}
export interface KjunAvatarProps { src?: string; source?: ImageSourcePropType; name?: string; alt?: string; decorative?: boolean; size?: "xs" | "sm" | "md" | "lg" | "xl"; shape?: "circle" | "square"; color?: ColorValue; textColor?: ColorValue; fallback?: ReactNode; onLoad?: () => void; onError?: () => void }
export function KjunAvatar({ src, source, name = "", alt, decorative = false, size = "md", shape = "circle", color, textColor, fallback, onLoad, onError }: KjunAvatarProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(), initial = Array.from(name.trim())[0];
  return <View style={{ width: tokens.extensions.avatar[size], height: tokens.extensions.avatar[size], borderRadius: shape === "circle" ? tokens.radius.radius9999 : tokens.radius.radius8, overflow: "hidden", flexShrink: 0 }}><ImageBackgroundContext.Provider value={color}><KjunImage src={src} source={source} alt={alt || name || m.user} decorative={decorative} fallback={typeof fallback === "string" || typeof fallback === "number"
    // A string fallback stays an initial, not the image's text caption.
    ? <KText style={{ ...typeStyle(avatarType[size]), fontWeight: typeStyle("control").fontWeight, color: textColor ?? colors.textSecondary }}>{fallback}</KText>
    : fallback ?? (initial
    // Like Web: initials scale with the avatar, use control weight and the secondary text role, and capitalize Latin letters.
    ? <KText style={{ ...typeStyle(avatarType[size]), fontWeight: typeStyle("control").fontWeight, color: textColor ?? colors.textSecondary }}>{initial.toLocaleUpperCase()}</KText>
    : <KjunIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[size]} color={textColor ?? colors.textSecondary} />)} onLoad={onLoad} onError={onError} /></ImageBackgroundContext.Provider></View>;
}
