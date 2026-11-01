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
    {toggle && <View pointerEvents="none" accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden><KjunSwitch value={!!checked} ariaLabel={title} /></View>}
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
  title?: string; description?: string; actions?: ReactNode; children: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
  /** Rounds the section on the card radius steps and clips its rows to the corners (default "none"). */
  radius?: CardRadius;
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant?: "title" | "label";
}
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default", radius = "none", titleVariant }: KjunListSectionProps) {
  const { colors } = useKjunStyles(), bare = !!title && (titleVariant ? titleVariant === "label" : !description);
  return <View style={{ minWidth: 0, backgroundColor: surface ? colors.surface : "transparent",
    ...(radius === "none" ? {} : { borderRadius: tokens.card.radii[radius], overflow: "hidden" as const }) }}>
    {!!(title || description || actions) && <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.list.gap, padding: tokens.extensions.list.padding,
      // A title without a description is a small group header that sits close to its rows.
      ...(bare ? { paddingBottom: list.bareHeadingPaddingBottom } : {}) }}><View style={{ flex: 1 }}>{!!title && <KText accessibilityRole="header" style={bare ? { ...typeStyle('controlSmall'), color: colors.textSecondary } : typeStyle('cardTitle')}>{title}</KText>}{!!description && <KText style={{ marginTop: tokens.extensions.list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'),  }}>{description}</KText>}</View>{content(actions)}</View>}
    <View role="list" accessibilityLabel={ariaLabel || title}>{Children.toArray(children).map((row, i, rows) => <ListRowContext.Provider key={i} value={{ divider: divider && i < rows.length - 1, compact: density === "compact" }}>{row}</ListRowContext.Provider>)}</View>
  </View>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  const { divider, compact } = useContext(ListRowContext);
  return <View role="listitem" style={{ padding: tokens.extensions.list.padding, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}),
    minWidth: 0 }}>{content(children)}{divider && <Divider inset={list.padding} />}</View>;
}
