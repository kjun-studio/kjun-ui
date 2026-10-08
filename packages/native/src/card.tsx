import { tokens, type CardElevation, type CardPadding, type CardRadius, type CardSurface, type ColorRole } from "@kjun-ui/tokens";
import { useId, type ReactNode } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { typeStyle } from "./typography";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";
import { CardActionsContext } from "./card-actions-context";

export interface DsCardProps {
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  headerActions?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  bodyPadding?: CardPadding;
  radius?: CardRadius;
  surface?: CardSurface;
  elevation?: CardElevation;
  border?: boolean;
  dividers?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function DsCard({ title, subtitle, header, headerActions, media, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, children, style,
}: DsCardProps) {
  const { colors } = useKjunStyles();
  const id = useId().replace(/[^a-z0-9]/gi, "");
  const inset = tokens.card.padding[padding], bodyInset = tokens.card.padding[bodyPadding];
  const corner = tokens.card.radii[radius];
  const paint: { background: ColorRole; gradientEnd?: ColorRole; border: ColorRole; text: ColorRole; description: ColorRole } = tokens.cardSurfaces[surface];
  const foreground = colors[paint.text], borderColor = colors[paint.border];
  const hasHeading = present(header) || present(title) || present(subtitle);
  const hasHeader = hasHeading || present(headerActions);
  const hasBody = present(children), hasFooter = present(footer), hasMedia = present(media);
  return <View style={[
    {
      minWidth: 0,
      borderRadius: corner,
      backgroundColor: colors[paint.background],
      boxShadow: tokens.card.elevation[elevation].map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
    },
    Platform.OS === "web" && surface === "glass" ? { backdropFilter: `blur(${tokens.card.glassBlur}px)` } as ViewStyle : {},
    style,
  ]}>
    {paint.gradientEnd && <View pointerEvents="none" style={{ position: "absolute", inset: 0, borderRadius: corner, overflow: "hidden" }}>
      <Svg width="100%" height="100%">
        <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={colors[paint.background]} />
          <Stop offset="1" stopColor={colors[paint.gradientEnd]} />
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>}
    {hasMedia && <View style={{ overflow: "hidden", borderTopLeftRadius: corner, borderTopRightRadius: corner,
      ...(!hasHeader && !hasBody && !hasFooter ? { borderBottomLeftRadius: corner, borderBottomRightRadius: corner } : {}),
    }}>{content(media)}</View>}
    {hasHeader && <View style={{
      padding: inset, flexDirection: "row", flexWrap: "wrap", alignItems: !present(header) && present(subtitle) ? "flex-start" : "center", gap: tokens.card.titleGap,
      borderBottomWidth: dividers && hasBody ? tokens.border.defaultWidth : 0, borderBottomColor: borderColor,
    }}>
      {hasHeading && <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, maxWidth: "100%" }}>
        {present(header) ? content(header, { color: foreground }) : <>
          {title && <KText accessibilityRole="header" style={{ ...typeStyle("cardTitle"), color: foreground }}>{title}</KText>}
          {subtitle && <KText style={{ ...typeStyle("caption"), marginTop: tokens.card.subtitleGap, color: colors[paint.description] }}>{subtitle}</KText>}
        </>}
      </View>}
      {present(headerActions) && <CardActionsContext.Provider value={true}><View style={{ flexDirection: "row", flexWrap: "wrap", minWidth: 0, maxWidth: "100%", marginStart: "auto", alignItems: "center", justifyContent: "flex-end", gap: tokens.card.titleGap }}>{content(headerActions, { color: foreground })}</View></CardActionsContext.Provider>}
    </View>}
    {hasBody && <View style={{ minWidth: 0, padding: bodyInset, paddingTop: hasHeader && !dividers ? 0 : bodyInset }}>
      {content(children, { color: foreground })}
    </View>}
    {hasFooter && <View style={{
      padding: inset, paddingTop: !dividers && (hasBody ? bodyPadding !== "none" : hasHeader) ? 0 : inset,
      borderTopWidth: dividers && (hasMedia || hasHeader || hasBody) ? tokens.border.defaultWidth : 0, borderTopColor: borderColor,
    }}>{content(footer, { color: foreground })}</View>}
    {border && <View pointerEvents="none" aria-hidden={true} style={{
      position: "absolute", inset: 0, borderRadius: corner,
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: tokens.card.borderWidth, inset: true, color: borderColor }],
    }} />}
  </View>;
}
