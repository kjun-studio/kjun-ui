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
  domainColors?: KjunDomainColors<ColorValue>;
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
export interface KjunProviderProps extends Omit<KjunStyles, "colors"> {
  icons?: KjunIconRegistry;
  /** BCP 47 tag (e.g. "en-US") for KJUN copy and Intl formats; without it KJUN stays Korean. */
  locale?: string;
  /** Replaces part of KJUN's copy, e.g. with the app's own translations. */
  messages?: Partial<KjunMessages>;
  colors: KjunColors<ColorValue>;
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
  children,
  style,
}: KjunProviderProps) {
  const parent = useContext(StylesContext);
  const resolvedColors = resolveKjunColors(colors);
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
        fontFamily: fontFamily ?? parent?.fontFamily,
        numericFontFamily: numericFontFamily ?? parent?.numericFontFamily,
        domainColors: domainColors ?? parent?.domainColors,
      }}
    >
      <KjunMessagesProvider locale={locale} messages={messages}><IconProvider icons={icons}><LayerProvider escapeKeyUpFallback><View style={style}>{children}</View></LayerProvider></IconProvider></KjunMessagesProvider>
    </StylesContext.Provider>
  );
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
