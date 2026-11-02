import { resolveSafeArea, type KjunSafeArea, type ResolvedSafeArea } from "../../../shared/package-runtime/safe-area";
import { baseFontFamily, fontFacesOf, type KjunFontFaces, type KjunFontFamily } from "./fonts";
import { KjunMessagesProvider } from "../../../shared/package-runtime/messages-context";
import type { KjunMessages } from "../../../shared/package-runtime/messages";
import { IconProvider } from "../../../shared/package-runtime/icon-context";
import type { KjunIconRegistry } from "@kjun-ui/icons";
import { LayerProvider } from "../../../shared/package-runtime/use-layer";
import {
resolveKjunColors,
domainColorRoles,
type KjunColors,
type ResolvedKjunColors,
type KjunDomainColors,
} from "@kjun-ui/tokens";
import { createContext,useContext,type ReactNode } from "react";
import {
View,
type ColorValue,
type StyleProp,
type ViewStyle,
} from "react-native";

interface KjunStyles {
  colors: ResolvedKjunColors<ColorValue>;
  fontFamily?: string;
  numericFontFamily?: string;
  /** Weight maps by face name, from fontFamily / numericFontFamily maps. */
  fontFaces?: KjunFontFaces;
  domainColors?: KjunDomainColors<ColorValue>;
  safeArea?: ResolvedSafeArea;
}
const StylesContext = createContext<KjunStyles | null>(null);
export function useKjunStyles(): KjunStyles {
  const value = useContext(StylesContext);
  if (!value)
    throw new Error(
      "KJUN Native requires KjunProvider with project-owned colors."
    );
  return value;
}
export interface KjunProviderProps extends Omit<KjunStyles, "colors" | "fontFamily" | "numericFontFamily" | "fontFaces" | "safeArea"> {
  /** A family name, or names by weight ({ 400: "Pretendard-Regular", 700: "Pretendard-Bold" }) for Android and Expo. */
  fontFamily?: KjunFontFamily;
  /** Same as fontFamily, for numbers. */
  numericFontFamily?: KjunFontFamily;
  icons?: KjunIconRegistry;
  /** BCP 47 tag (e.g. "en-US") for KJUN copy and Intl formats; without it KJUN stays Korean. */
  locale?: string;
  /** Replaces part of KJUN's copy, e.g. with the app's own translations. */
  messages?: Partial<KjunMessages>;
  /** Project colors; a nested provider may leave them out to inherit its parent's (e.g. to change only safeArea). */
  colors?: KjunColors<ColorValue>;
  /** Screen insets in px (e.g. from react-native-safe-area-context) for toasts, modals, menus and edge components. */
  safeArea?: KjunSafeArea;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function KjunProvider({
  icons,
  locale,
  messages,
  colors,
  fontFamily,
  numericFontFamily,
  domainColors,
  safeArea,
  children,
  style,
}: KjunProviderProps) {
  const parent = useContext(StylesContext);
  if (!colors && !parent) throw new Error("KJUN Native requires KjunProvider with project-owned colors.");
  const resolvedColors = colors ? resolveKjunColors(colors) : parent!.colors;
  const domainMissing =
    domainColors &&
    domainColorRoles.filter(
      (role) => domainColors[role] == null || domainColors[role] === ""
    );
  if (domainMissing?.length)
    throw Error("Missing KJUN domain colors: " + domainMissing.join(", "));
  return (
    <StylesContext.Provider
      value={{
        colors: resolvedColors,
        fontFamily: baseFontFamily(fontFamily) ?? parent?.fontFamily,
        numericFontFamily: baseFontFamily(numericFontFamily) ?? parent?.numericFontFamily,
        fontFaces: { ...parent?.fontFaces, ...fontFacesOf(fontFamily), ...fontFacesOf(numericFontFamily) },
        domainColors: domainColors ?? parent?.domainColors,
        safeArea: resolveSafeArea(safeArea, parent?.safeArea),
      }}
    >
      <KjunMessagesProvider locale={locale} messages={messages}><IconProvider icons={icons}><LayerProvider escapeKeyUpFallback><View style={style}>{children}</View></LayerProvider></IconProvider></KjunMessagesProvider>
    </StylesContext.Provider>
  );
}

/** The app's screen insets from KjunProvider (0 when none were given). */
export function useKjunSafeArea(): ResolvedSafeArea {
  return useContext(StylesContext)?.safeArea ?? { top: 0, bottom: 0 };
}

export function useKjunDomainColors() {
  const { domainColors } = useKjunStyles();
  const missing = domainColorRoles.filter(
    (role) => domainColors?.[role] == null || domainColors[role] === ""
  );
  if (missing.length)
    throw Error("Missing KJUN domain colors: " + missing.join(", "));
  return domainColors!;
}
