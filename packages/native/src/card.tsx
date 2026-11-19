import { tokens, type CardElevation, type CardPadding, type CardRadius, type CardSurface, type ColorRole } from "@kjun-ui/tokens";
import { useContext, useEffect, type ReactNode } from "react";
import { Platform, View, type GestureResponderEvent, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AccessiblePressable } from "./a11y";
import { typeStyle } from "./typography";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";
import { CardActionsContext } from "./card-actions-context";
import { KjunIcon } from "./button";
import { CardBrandContext, CardTintContext } from "./card-surface-context";
import { TileCellContext } from "./tiles-context";
import { linkRel } from "../../../shared/package-runtime/list-row";
import { cardLayout, warnCardDeviceLink, type CardHeadingLevel, type CardMediaAspect, type CardMediaPosition } from "../../../shared/package-runtime/card-layout";

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
  /** Makes the whole card one link: on the web an a element. On a device href does not navigate; pass onPress and use the app's router. */
  href?: string;
  /** Where a link card opens on the web, e.g. "_blank"; a new tab gets rel="noopener noreferrer" unless rel is given. */
  target?: string;
  /** The link's rel on the web; by default "noopener noreferrer" for target="_blank". */
  rel?: string;
  /** Blocks a pressable or link card and dims it. */
  disabled?: boolean;
  /** Name of a pressable or link card; defaults to the title. */
  ariaLabel?: string;
  /** Test identifier on the card's root view. */
  testID?: string;
  /** Native id of the card's root view (an element id on the web), e.g. for aria-labelledby. */
  nativeID?: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** Marks the title as a header (aria-level on the web; default 3); false keeps plain text. A pressable card's title is never a header. */
  headingLevel?: CardHeadingLevel;
  /** Where the footer places its content: start (default) or end, such as confirm and cancel actions. */
  footerAlign?: "start" | "end";
}
export function KjunCard({ title, subtitle, header, headerActions, media, mediaPosition = "top", mediaAspect, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, children, style,
  pressable = false, href, target, rel, disabled = false, ariaLabel, onPress, headingLevel = 3, footerAlign = "start", testID, nativeID,
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
  const link = href !== undefined, interactive = pressable || link;
  const deviceLink = Platform.OS !== "web" && link && !onPress;
  useEffect(() => warnCardDeviceLink(deviceLink), [deviceLink]);
  const layout = cardLayout(has, { pressable: interactive, link, headingLevel, surface, padding, mediaPosition });
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
  const actionRow = <CardActionsContext.Provider value={true}><View style={{ flexDirection: "row", flexWrap: "wrap", minWidth: 0, maxWidth: "100%", marginStart: layout.heading ? 0 : "auto", alignItems: "center", justifyContent: "flex-end", gap: tokens.card.titleGap }}>{content(headerActions, { color: foreground })}</View></CardActionsContext.Provider>;
  // Header actions without a title sit at the end of the body's row; too narrow for the body's minimum width, they wrap above it.
  const beside = layout.actionsBeside && <View style={{ flexDirection: "row", flexWrap: "wrap-reverse", alignItems: "center" }}>
    <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: tokens.card.titleMinWidth, minWidth: 0, padding: bodyInset }}>{content(children, { color: foreground, ...words })}</View>
    <View style={{ flexShrink: 1, minWidth: 0, marginStart: "auto", padding: inset, paddingStart: 0 }}>{actionRow}</View>
  </View>;
  const sections = beside || <>
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
      {!!has.actions && actionRow}
      {/* A link card ends its header with a chevron, centred on the title block, so it reads as a link before it is pressed. */}
      {layout.linkMark && <View aria-hidden={true} style={{ alignSelf: "center", marginStart: "auto" }}>
        <KjunIcon name="chevron-right" size={tokens.iconSizes.large} color={colors.textTertiary} /></View>}
    </View>}
    {has.body && <View style={{ minWidth: 0, padding: bodyInset, paddingTop: layout.header && !dividers ? 0 : bodyInset }}>
      {content(children, { color: foreground, ...words })}
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
  const painted = <CardTintContext.Provider value={layout.tinted}><CardBrandContext.Provider value={surface === "brand"}><TileCellContext.Provider value={false}>{parts}</TileCellContext.Provider></CardBrandContext.Provider></CardTintContext.Provider>;
  const ids = { testID, nativeID };
  // A pressable or link card presses in slightly, like a button, lifts one step on hover (Web) and dims when disabled.
  const lift = (hovered?: boolean) => hovered && !disabled
    ? { boxShadow: tokens.elevation[elevation === "raised" ? "lifted" : "raised"].map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })) } : null;
  return interactive
    ? <AccessiblePressable {...ids} accessibilityRole={link ? "link" : "button"} accessibilityLabel={ariaLabel ?? (typeof title === "string" ? title : undefined)} accessibilityState={{ disabled }} disabled={disabled}
        {...(Platform.OS === "web" && link && !disabled ? { href, hrefAttrs: { target, rel: linkRel(target, rel) } } : {})}
        onPress={onPress} style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [base, lift(hovered), pressed && !disabled ? { transform: [{ scale: tokens.states.scale.surfacePressed }] } : null, disabled ? { opacity: tokens.states.opacity.disabled } : null]}>{painted}</AccessiblePressable>
    : <View {...ids} style={base}>{painted}</View>;
}
