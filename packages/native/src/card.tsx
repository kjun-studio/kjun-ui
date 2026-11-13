import { tokens, type CardElevation, type CardPadding, type CardRadius, type CardSurface, type ColorRole } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { Platform, View, type GestureResponderEvent, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AccessiblePressable } from "./a11y";
import { typeStyle } from "./typography";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";
import { CardActionsContext } from "./card-actions-context";
import { CardTintContext } from "./card-surface-context";

// Like Web's keep-all: Korean wraps between words (iOS through its Hangul word strategy, a Text prop).
const words = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as unknown as TextStyle;
const wordProps = { lineBreakStrategyIOS: "hangul-word" as const };

export interface KjunCardProps {
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
  /** Makes the whole card one button (onPress). Do not put buttons or links inside a pressable card. */
  pressable?: boolean;
  /** Blocks a pressable card and dims it. */
  disabled?: boolean;
  /** Button name of a pressable card; defaults to the title. */
  ariaLabel?: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** Marks the title as a header (aria-level on the web; default 3); false keeps plain text. A pressable card's title is never a header. */
  headingLevel?: false | 2 | 3 | 4 | 5 | 6;
  /** Where the footer places its content: start (default) or end, such as confirm and cancel actions. */
  footerAlign?: "start" | "end";
}
export function KjunCard({ title, subtitle, header, headerActions, media, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, children, style,
  pressable = false, disabled = false, ariaLabel, onPress, headingLevel = 3, footerAlign = "start",
}: KjunCardProps) {
  const { colors } = useKjunStyles();
  const inset = tokens.card.padding[padding], bodyInset = tokens.card.padding[bodyPadding];
  const corner = tokens.card.radii[radius];
  const paint: { background: ColorRole; border: ColorRole; text: ColorRole; description: ColorRole } = tokens.cardSurfaces[surface];
  const tinted = surface !== "default" && surface !== "glass";
  // A pressable card is one button, whose content is not a header.
  const heading = !pressable && headingLevel ? { accessibilityRole: "header" as const, ...(Platform.OS === "web" ? { "aria-level": headingLevel } : {}) } : {};
  const foreground = colors[paint.text], borderColor = colors[paint.border];
  const hasHeading = present(header) || present(title) || present(subtitle);
  const hasHeader = hasHeading || present(headerActions);
  const hasBody = present(children), hasFooter = present(footer), hasMedia = present(media);
  const base: StyleProp<ViewStyle> = [
    {
      minWidth: 0,
      borderRadius: corner,
      backgroundColor: colors[paint.background],
      boxShadow: tokens.card.elevation[elevation].map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
    },
    Platform.OS === "web" && surface === "glass" ? { backdropFilter: `blur(${tokens.card.glassBlur}px)` } as ViewStyle : {},
    style,
  ];
  const parts = <>
    {hasMedia && <View style={{ overflow: "hidden", borderTopLeftRadius: corner, borderTopRightRadius: corner,
      ...(!hasHeader && !hasBody && !hasFooter ? { borderBottomLeftRadius: corner, borderBottomRightRadius: corner } : {}),
    }}>{content(media)}</View>}
    {hasHeader && <View style={{
      // Without a divider the header sits a step closer to the body than to the card edge.
      padding: inset, paddingBottom: !dividers && hasBody ? tokens.card.headerGaps[padding] : inset, flexDirection: "row", flexWrap: "wrap", alignItems: !present(header) && present(subtitle) ? "flex-start" : "center", gap: tokens.card.titleGap,
      borderBottomWidth: dividers && hasBody ? tokens.border.defaultWidth : 0, borderBottomColor: borderColor,
    }}>
      {/* A title keeps a minimum width beside the actions: a badge stays on the title row, a wide action moves below at the start. A custom header keeps its own width. */}
      {hasHeading && <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: present(header) ? "auto" : tokens.card.titleMinWidth, minWidth: 0, maxWidth: "100%" }}>
        {present(header) ? content(header, { color: foreground }) : <>
          {!!title && <KText {...wordProps} {...heading} style={{ ...typeStyle("cardTitle"), color: foreground, ...words }}>{title}</KText>}
          {!!subtitle && <KText {...wordProps} style={{ ...typeStyle("body"), marginTop: tokens.card.subtitleGap, color: colors[paint.description], ...words }}>{subtitle}</KText>}
        </>}
      </View>}
      {present(headerActions) && <CardActionsContext.Provider value={true}><View style={{ flexDirection: "row", flexWrap: "wrap", minWidth: 0, maxWidth: "100%", marginStart: hasHeading ? 0 : "auto", alignItems: "center", justifyContent: "flex-end", gap: tokens.card.titleGap }}>{content(headerActions, { color: foreground })}</View></CardActionsContext.Provider>}
    </View>}
    {hasBody && <View style={{ minWidth: 0, padding: bodyInset, paddingTop: hasHeader && !dividers ? 0 : bodyInset }}>
      {content(children, { color: foreground })}
    </View>}
    {hasFooter && <View style={{
      padding: inset, paddingTop: !dividers && (hasBody ? bodyPadding !== "none" : hasHeader) ? 0 : inset,
      borderTopWidth: dividers && (hasMedia || hasHeader || hasBody) ? tokens.border.defaultWidth : 0, borderTopColor: borderColor,
      ...(footerAlign === "end" ? { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: tokens.card.titleGap } : {}),
    }}>{content(footer, { color: foreground })}</View>}
    {border && <View pointerEvents="none" aria-hidden={true} style={{
      position: "absolute", inset: 0, borderRadius: corner,
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: tokens.card.borderWidth, inset: true, color: borderColor }],
    }} />}
  </>;
  // Always provided, so a plain card nested in a tinted one drops the tint again.
  const painted = <CardTintContext.Provider value={tinted}>{parts}</CardTintContext.Provider>;
  // A pressable card presses in slightly, like a button, and dims when disabled.
  return pressable
    ? <AccessiblePressable accessibilityRole="button" accessibilityLabel={ariaLabel ?? title} accessibilityState={{ disabled }} disabled={disabled}
        onPress={onPress} style={({ pressed }: { pressed: boolean }) => [base, pressed ? { transform: [{ scale: 0.99 }] } : null, disabled ? { opacity: tokens.states.opacity.disabled } : null]}>{painted}</AccessiblePressable>
    : <View style={base}>{painted}</View>;
}
