import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { Children, createContext, useContext, type ReactNode } from "react";
import { View, Platform, type GestureResponderEvent, type TextStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText, content } from "./internal";
import { KjunIcon } from "./button";
import { useKjunStyles } from "./provider";
import { KjunSwitch } from "./choice-controls";
// A section tells its rows whether to draw a divider (never after the last, like Web's :last-child) and how dense they are.
const ListRowContext = createContext({ divider: true, compact: false });
const list = tokens.extensions.list;
// Like Web's ::after divider: it starts where the text does, past the leading column when there is one.
function Divider({ inset }: { inset: number }) {
  const { colors } = useKjunStyles();
  return <View pointerEvents="none" style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />;
}
export interface KjunListRowProps {
  title: string; description?: string;
  /** Icon name drawn in the leading column at the list icon size; `leading` replaces it when both are given. */
  icon?: string;
  leading?: ReactNode; trailing?: ReactNode; actions?: ReactNode; href?: string; disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  /** Marks the chosen row of a single-choice list with a check at the end (announced as selected). */
  selected?: boolean;
  /** Makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onPress?: (event: GestureResponderEvent) => void;
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel?: string;
  /** Display-only content under the description (a budget bar); no buttons or links inside a pressable row. */
  children?: ReactNode;
}
// Like Web's keep-all: Korean wraps between words (iOS through its Hangul word strategy, a Text prop).
const words = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as unknown as TextStyle;
const wordProps = { lineBreakStrategyIOS: "hangul-word" as const };
export function KjunListRow({ title, description, icon, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, selected = false, checked, onCheckedChange, onPress, ariaLabel, children }: KjunListRowProps) {
  const { colors } = useKjunStyles(), { divider, compact } = useContext(ListRowContext), toggle = checked !== undefined;
  const front = hasContent(leading) ? content(leading) : icon ? <KjunIcon name={icon} size={list.iconSize} color={destructive ? colors.danger : colors.textSecondary} /> : null;
  // Like Web: with a description the leading column covers the first two lines, so a long row keeps its icon beside the title.
  const leadingHeight = description ? typeStyle("control").lineHeight + list.descriptionGap + typeStyle("caption").lineHeight : undefined;
  const parts = <>
    {front && <View style={{ minWidth: list.leadingWidth, alignItems: "center", justifyContent: "center", ...(leadingHeight ? { alignSelf: "flex-start", height: leadingHeight } : {}) }}>{front}</View>}
    <View style={{ flex: 1, minWidth: 0 }}>
      <KText {...wordProps} style={{ ...typeStyle('control'), ...words, ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>
      {!!description && <KText {...wordProps} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'), ...words }}>{description}</KText>}
      {hasContent(children) && <View style={{ marginTop: list.descriptionGap }}>{content(children)}</View>}
    </View>
    {/* A value at the row's end reads one step below the title. */}
    {hasContent(trailing) && <View style={{ maxWidth: "35%" }}>{content(trailing, { ...typeStyle("body"), color: colors.textSecondary })}</View>}
    {selected && <KjunIcon name="check" size={tokens.iconSizes.default} color={colors.brand} />}
    {/* A switch row is one switch control: the drawn switch is decoration and the row carries role and state. */}
    {toggle && <View pointerEvents="none" accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      // The row is the touch target, so the drawn switch keeps only its own height, like Web.
      style={{ height: tokens.extensions.switch.heights.md, justifyContent: "center" }}><KjunSwitch value={!!checked} ariaLabel={title} /></View>}
    {chevron && <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden><KjunIcon name="chevron-right" size={tokens.iconSizes.default} color={colors.textTertiary} /></View>}
  </>;
  const style = { flex: 1, minWidth: 0, minHeight: compact ? list.compactMinimumHeight : list.minimumHeight, flexDirection: "row" as const, alignItems: "center" as const, gap: list.gap, padding: list.padding, ...(compact ? { paddingVertical: list.compactPaddingY } : {}) };
  const pressable = !!(onPress || href || toggle);
  return <View role="listitem" style={{ flexDirection: "row", alignItems: "center", gap: list.gap }}>
    {pressable ? <Pressable {...(Platform.OS === "web" && href && !disabled ? { href } : {})} accessibilityRole={toggle ? "switch" : href ? "link" : "button"}
      accessibilityLabel={ariaLabel ?? title + (description ? ", " + description : "")} disabled={disabled}
      accessibilityState={{ disabled, ...(toggle ? { checked: !!checked } : {}), ...(selected ? { selected } : {}) }}
      onPress={(event) => { if (toggle) onCheckedChange?.(!checked); onPress?.(event); }}
      style={({ pressed }) => ({ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1, backgroundColor: pressed ? colors.hover : "transparent" })}>{parts}</Pressable>
      // Like Web: a static row dims as a whole when disabled, so nothing in it reads as available.
      : <View accessibilityState={selected ? { selected } : undefined} style={{ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{parts}</View>}
    {/* A disabled row disables its actions too, so the row never reads as partly available. */}
    {hasContent(actions) && <View pointerEvents={disabled ? "none" : "auto"} {...(disabled && Platform.OS === "web" ? { inert: true } : {})} style={{ maxWidth: "45%", flexDirection: "row", flexWrap: "wrap", gap: list.actionsGap, paddingRight: list.actionsPadding, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{content(actions)}</View>}
    {divider && <Divider inset={list.padding + (front ? list.leadingWidth + list.gap : 0)} />}
  </View>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children?: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
  /** Rounds the section on the card radius steps and clips its rows to the corners (default "none", or the KjunListGroup's). */
  radius?: CardRadius;
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant?: "title" | "label";
  /** Shown in place of the rows when the section has none, such as a KjunEmpty. */
  empty?: ReactNode;
  /** Supporting text under the rows, such as what a setting applies to. */
  footer?: ReactNode;
}
const ListGroupContext = createContext<"inset" | "flush" | null>(null);
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default", radius, titleVariant, empty, footer }: KjunListSectionProps) {
  const { colors } = useKjunStyles(), group = useContext(ListGroupContext), corner = radius ?? (group === "inset" ? "lg" : "none");
  const bare = !!title && (titleVariant ? titleVariant === "label" : !description);
  // Like Web: a rounded section with a label title keeps the label and footer on the page, around its card.
  const outside = corner !== "none" && bare;
  const items = Children.toArray(children);
  const rows = items.length
    ? <View role="list" accessibilityLabel={ariaLabel || title}>{items.map((row, i) => <ListRowContext.Provider key={i} value={{ divider: divider && i < items.length - 1, compact: density === "compact" }}>{row}</ListRowContext.Provider>)}</View>
    : hasContent(empty) ? <View style={{ padding: list.padding }}>{content(empty)}</View> : null;
  const card = { backgroundColor: surface ? colors.surface : "transparent", ...(corner === "none" ? {} : { borderRadius: tokens.card.radii[corner], overflow: "hidden" as const }) };
  return <View style={{ minWidth: 0, ...(outside ? {} : card) }}>
    {!!(title || description || actions) && <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.gap, padding: list.padding,
      // A title without a description is a small group header that sits close to its rows; outside a card it starts at the top.
      ...(bare ? { paddingBottom: list.bareHeadingPaddingBottom } : {}), ...(outside ? { paddingTop: 0, paddingBottom: list.outsideLabelGap } : {}) }}>
      <View style={{ flex: 1 }}>{!!title && <KText accessibilityRole="header" style={bare ? { ...typeStyle('controlSmall'), color: colors.textSecondary } : typeStyle('cardTitle')}>{title}</KText>}{!!description && <KText style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption') }}>{description}</KText>}</View>
      {/* Like Web: heading actions sit on the title line. */}
      {hasContent(actions) && <View style={{ minHeight: typeStyle(bare ? "controlSmall" : "cardTitle").lineHeight, justifyContent: "center" }}>{content(actions)}</View>}
    </View>}
    {outside ? <View style={card}>{rows}</View> : rows}
    {hasContent(footer) && <View style={{ paddingTop: list.footerGap, paddingHorizontal: list.padding, paddingBottom: outside ? 0 : list.padding }}>{content(footer, { ...typeStyle("caption"), color: colors.textTertiary })}</View>}
  </View>;
}
export interface KjunListGroupProps {
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart. */
  variant?: "inset" | "flush";
  children: ReactNode;
}
/** Like Web: stacks KjunListSections with one spacing and corner rule. */
export function KjunListGroup({ variant = "inset", children }: KjunListGroupProps) {
  return <ListGroupContext.Provider value={variant}><View style={{ minWidth: 0, gap: variant === "flush" ? list.flushGroupGap : list.groupGap }}>{content(children)}</View></ListGroupContext.Provider>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  const { divider, compact } = useContext(ListRowContext);
  return <View role="listitem" style={{ padding: tokens.extensions.list.padding, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}),
    minWidth: 0 }}>{content(children)}{divider && <Divider inset={list.padding} />}</View>;
}
