import { IconProvider } from "../../../shared/package-runtime/icon-context";
import type { KjunIconRegistry } from "@kjun/icons";
import { LayerProvider } from "../../../shared/package-runtime/use-layer";
import {
resolveKjunColors,
domainColorRoles,
type KjunColors,
type ResolvedKjunColors,
type KjunDomainColors,
} from "@kjun/tokens";
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
  colors: KjunColors<ColorValue>;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function KjunProvider({
  icons,
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
      <IconProvider icons={icons}><LayerProvider escapeKeyUpFallback><View style={style}>{children}</View></LayerProvider></IconProvider>
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
