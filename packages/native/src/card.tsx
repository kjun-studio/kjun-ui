import { tokens, type CardElevation, type CardPadding, type CardRadius, type CardSurface, type ColorRole } from "@kjun-ui/tokens";
import { useContext, type ReactNode } from "react";
import { Platform, View, type GestureResponderEvent, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AccessiblePressable } from "./a11y";
import { typeStyle } from "./typography";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";
import { CardActionsContext } from "./card-actions-context";
import { CardTintContext } from "./card-surface-context";
import { TileCellContext } from "./tiles-context";
import { cardLayout, type CardHeadingLevel, type CardMediaAspect, type CardMediaPosition } from "../../../shared/package-runtime/card-layout";

// Like Web's keep-all: Korean wraps between words (iOS through its Hangul word strategy, a Text prop).
const words = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as unknown as TextStyle;
const wordProps = { lineBreakStrategyIOS: "hangul-word" as const };

export interface KjunCardProps {
  /** The card title; a node can carry an icon or an emphasised number. Give a pressable card with a node title an ariaLabel. */
  title?: ReactNode;
  subtitle?: string;
  header?: ReactNode;
  headerActions?: ReactNode;
  media?: ReactNode;
  /** top (default) puts the media above the header; start puts it in a fixed column beside the content, such as a thumbnail. Style the media child to fill its frame (flex 1 or 100%). */
  mediaPosition?: CardMediaPosition;
  /** Fixes the media frame's ratio (wide 16:9, standard 4:3, square 1:1). */
  mediaAspect?: CardMediaAspect;
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
  /** Makes the whole card one button (onPress). Do not put buttons or links inside a pressable card. */
  pressable?: boolean;
  /** Blocks a pressable card and dims it. */
  disabled?: boolean;
  /** Button name of a pressable card; defaults to the title. */
  ariaLabel?: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** Marks the title as a header (aria-level on the web; default 3); false keeps plain text. A pressable card's title is never a header. */
  headingLevel?: CardHeadingLevel;
  /** Where the footer places its content: start (default) or end, such as confirm and cancel actions. */
  footerAlign?: "start" | "end";
}
export function KjunCard({ title, subtitle, header, headerActions, media, mediaPosition = "top", mediaAspect, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, children, style,
  pressable = false, disabled = false, ariaLabel, onPress, headingLevel = 3, footerAlign = "start",
}: KjunCardProps) {
  const { colors } = useKjunStyles();
  // In a KjunTiles cell the card fills the cell, so cards in a row share the tallest height (Web: the cell grid).
  const inTile = useContext(TileCellContext);
  const inset = tokens.card.padding[padding], bodyInset = tokens.card.padding[bodyPadding];
  const corner = tokens.card.radii[radius];
  const paint: { background: ColorRole; border: ColorRole; text: ColorRole; description: ColorRole } = tokens.cardSurfaces[surface];
  const foreground = colors[paint.text], borderColor = colors[paint.border];
  const has = { header: present(header), title: present(title), subtitle: present(subtitle), actions: present(headerActions),
    body: present(children), footer: present(footer), media: present(media) };
  const layout = cardLayout(has, { pressable, headingLevel, surface, padding, mediaPosition });
  const heading = layout.titleLevel ? { accessibilityRole: "header" as const, ...(Platform.OS === "web" ? { "aria-level": layout.titleLevel } : {}) } : {};
  const base: StyleProp<ViewStyle> = [
    {
      minWidth: 0,
      borderRadius: corner,
      ...(layout.sideMedia ? { flexDirection: "row" as const } : {}),
      backgroundColor: colors[paint.background],
      boxShadow: tokens.card.elevation[elevation].map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
    },
    Platform.OS === "web" && surface === "glass" ? { backdropFilter: `blur(${tokens.card.glassBlur}px)` } as ViewStyle : {},
    inTile ? { flex: 1 } : null,
    style,
  ];
  const frame = mediaAspect ? { aspectRatio: tokens.card.mediaAspects[mediaAspect] } : {};
  const mediaFrame = has.media && (layout.sideMedia
    ? <View style={{ width: tokens.card.sideMediaWidth, alignSelf: mediaAspect ? "flex-start" : "stretch", overflow: "hidden",
        borderTopLeftRadius: corner, borderBottomLeftRadius: corner, ...frame }}>{content(media)}</View>
    : <View style={{ overflow: "hidden", borderTopLeftRadius: corner, borderTopRightRadius: corner,
        ...(!layout.header && !has.body && !has.footer ? { borderBottomLeftRadius: corner, borderBottomRightRadius: corner } : {}), ...frame,
      }}>{content(media)}</View>);
  const sections = <>
    {!!layout.header && <View style={{
      // Without a divider the header sits a step closer to the body than to the card edge.
      padding: inset, paddingBottom: !dividers && has.body ? layout.headerGap : inset, flexDirection: "row", flexWrap: "wrap", gap: tokens.card.titleGap,
      // Actions beside a title line up with its first line, also when the title wraps.
      alignItems: layout.titled ? "baseline" : has.subtitle ? "flex-start" : "center",
      borderBottomWidth: dividers && has.body ? tokens.border.defaultWidth : 0, borderBottomColor: borderColor,
    }}>
      {/* A title keeps a minimum width beside the actions: a badge stays on the title row, a wide action moves below at the start. A custom header keeps its own width. */}
      {layout.heading && <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: layout.titled ? tokens.card.titleMinWidth : "auto", minWidth: 0, maxWidth: "100%" }}>
        {has.header ? content(header, { color: foreground }) : <>
          {!!has.title && (typeof title === "string" || typeof title === "number"
            ? <KText {...wordProps} {...heading} style={{ ...typeStyle("cardTitle"), color: foreground, ...words }}>{title}</KText>
            : <View {...heading}>{title}</View>)}
          {!!has.subtitle && <KText {...wordProps} style={{ ...typeStyle("body"), marginTop: tokens.card.subtitleGap, color: colors[paint.description], ...words }}>{subtitle}</KText>}
        </>}
      </View>}
      {!!has.actions && <CardActionsContext.Provider value={true}><View style={{ flexDirection: "row", flexWrap: "wrap", minWidth: 0, maxWidth: "100%", marginStart: layout.heading ? 0 : "auto", alignItems: "center", justifyContent: "flex-end", gap: tokens.card.titleGap }}>{content(headerActions, { color: foreground })}</View></CardActionsContext.Provider>}
    </View>}
    {has.body && <View style={{ minWidth: 0, padding: bodyInset, paddingTop: layout.header && !dividers ? 0 : bodyInset }}>
      {content(children, { color: foreground })}
    </View>}
    {!!has.footer && <View style={{
      padding: inset, paddingTop: !dividers && (has.body ? bodyPadding !== "none" : layout.header) ? 0 : inset,
      borderTopWidth: dividers && ((has.media && !layout.sideMedia) || layout.header || has.body) ? tokens.border.defaultWidth : 0, borderTopColor: borderColor,
      ...(footerAlign === "end" ? { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: tokens.card.titleGap } : {}),
    }}>{content(footer, { color: foreground })}</View>}
  </>;
  const parts = <>
    {mediaFrame}
    {/* Media at the start: the header, body and footer stack in the column beside it. */}
    {layout.sideMedia ? <View style={{ flex: 1, minWidth: 0 }}>{sections}</View> : sections}
    {border && <View pointerEvents="none" aria-hidden={true} style={{
      position: "absolute", inset: 0, borderRadius: corner,
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: tokens.card.borderWidth, inset: true, color: borderColor }],
    }} />}
  </>;
  // Always provided, so a plain card nested in a tinted one drops the tint again.
  // A card inside this one is not in a tile cell, so it keeps its own size.
  const painted = <CardTintContext.Provider value={layout.tinted}><TileCellContext.Provider value={false}>{parts}</TileCellContext.Provider></CardTintContext.Provider>;
  // A pressable card presses in slightly, like a button, and dims when disabled.
  return pressable
    ? <AccessiblePressable accessibilityRole="button" accessibilityLabel={ariaLabel ?? (typeof title === "string" ? title : undefined)} accessibilityState={{ disabled }} disabled={disabled}
        onPress={onPress} style={({ pressed }: { pressed: boolean }) => [base, pressed ? { transform: [{ scale: 0.99 }] } : null, disabled ? { opacity: tokens.states.opacity.disabled } : null]}>{painted}</AccessiblePressable>
    : <View style={base}>{painted}</View>;
}
