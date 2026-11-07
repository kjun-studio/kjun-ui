import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { Children, Fragment, createContext, isValidElement, useContext, useEffect, type ReactElement, type ReactNode } from "react";
import { listRowKind, warnListRowProps } from "../../../shared/package-runtime/list-row";
import { View, Platform, type GestureResponderEvent, type TextStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText, content } from "./internal";
import { KjunIcon } from "./button";
import { ListEmptyContext } from "./display-primitives";
import { useKjunStyles } from "./provider";

// A section tells its rows whether to draw a divider (never after the last, like Web's :last-child) and how dense they are.
// In a rounded card the card clips the row, so its focus ring moves inside and the first and last rows follow the corners.
const ListRowContext = createContext<{ divider: boolean; compact: boolean; insetRing?: boolean; ringRadius?: number }>({ divider: true, compact: false });
const list = tokens.extensions.list;
// Like Web's ::after divider: it starts where the text does, past the leading column when there is one.
function Divider({ inset }: { inset: number }) {
  const { colors } = useKjunStyles();
  return <View pointerEvents="none" style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />;
}
export interface KjunListRowProps {
  title: string; description?: string;
  /** Icon name drawn in a 24px column; custom `leading` content uses a minimum 40px column and takes priority. */
  icon?: string;
  leading?: ReactNode; trailing?: ReactNode; actions?: ReactNode; href?: string; disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  /** One choice in a single-choice list: true draws a check at the end. A pressable row given it (true or false) reads as a radio. */
  selected?: boolean;
  /** Makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onPress?: (event: GestureResponderEvent) => void;
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel?: string;
  /** Display-only content under the description (a budget bar); no buttons or links inside a pressable row. */
  children?: ReactNode;
  /** Clamps the title (and the description) to this many lines, ending in an ellipsis. */
  titleLines?: number;
  descriptionLines?: number;
}
// The switch a switch row draws: track and thumb only, so it never becomes a second focus stop or control.
function SwitchMark({ on }: { on: boolean }) {
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.switch, width = geometry.widths.md, height = geometry.heights.md, thumb = height - 2 * geometry.padding;
  return <View style={{ width, height, padding: geometry.padding, borderRadius: geometry.radius, backgroundColor: on ? colors.brand : colors.switchTrack ?? colors.border }}>
    <View style={{ width: thumb, height: thumb, borderRadius: thumb / 2, backgroundColor: on ? colors.switchThumbOn : colors.switchThumb, transform: [{ translateX: on ? width - height : 0 }] }} />
  </View>;
}
// Like Web's keep-all: Korean wraps between words (iOS through its Hangul word strategy, a Text prop).
const words = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as unknown as TextStyle;
const wordProps = { lineBreakStrategyIOS: "hangul-word" as const };
export function KjunListRow({ title, description, icon, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, selected, checked, onCheckedChange, onPress, ariaLabel, children, titleLines, descriptionLines }: KjunListRowProps) {
  const { colors } = useKjunStyles(), { divider, compact, insetRing, ringRadius } = useContext(ListRowContext);
  const kind = listRowKind({ checked, selected, href, pressable: !!(onPress || href) }), toggle = kind === "switch";
  useEffect(() => warnListRowProps({ checked, selected, href, chevron }), [checked !== undefined, selected !== undefined, !!href, chevron]);
  const hasLeading = hasContent(leading), leadingWidth = hasLeading ? list.leadingWidth : tokens.dimension.value24;
  const front = hasLeading ? content(leading) : icon ? <KjunIcon name={icon} size={list.iconSize} color={destructive ? colors.danger : colors.textSecondary} /> : null;
  // Like Web: with a description the leading column covers the first two lines, so a long row keeps its icon beside the title.
  const leadingHeight = description ? typeStyle("control").lineHeight + list.descriptionGap + typeStyle("caption").lineHeight : undefined;
  const parts = <>
    {front && <View style={{ minWidth: leadingWidth, alignItems: "center", justifyContent: "center", ...(leadingHeight ? { alignSelf: "flex-start", height: leadingHeight } : {}) }}>{front}</View>}
    <View style={{ flex: 1, minWidth: 0 }}>
      <KText {...wordProps} numberOfLines={titleLines} style={{ ...typeStyle('control'), ...words, ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>
      {!!description && <KText {...wordProps} numberOfLines={descriptionLines} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'), ...words }}>{description}</KText>}
      {hasContent(children) && <View style={{ marginTop: list.descriptionGap }}>{content(children)}</View>}
    </View>
    {/* A value at the row's end reads one step below the title. */}
    {hasContent(trailing) && <View style={{ maxWidth: "35%" }}>{content(trailing, { ...typeStyle("body"), color: colors.textSecondary })}</View>}
    {selected && <KjunIcon name="check" size={tokens.iconSizes.default} color={colors.brand} />}
    {/* A switch row is one switch control: the drawn switch is decoration and the row carries role and state. */}
    {toggle && <View pointerEvents="none" accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      // The row is the touch target, so the drawn switch keeps only its own height, like Web.
      style={{ height: tokens.extensions.switch.heights.md, justifyContent: "center" }}><SwitchMark on={!!checked} /></View>}
    {chevron && <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden><KjunIcon name="chevron-right" size={tokens.iconSizes.default} color={colors.textTertiary} /></View>}
  </>;
  const style = { flex: 1, minWidth: 0, minHeight: compact ? list.compactMinimumHeight : list.minimumHeight, flexDirection: "row" as const, alignItems: "center" as const, gap: list.gap, padding: list.padding, ...(compact ? { paddingVertical: list.compactPaddingY } : {}) };
  const pressable = kind !== "static";
  // The default name reads the title, description and a text value at the row's end, as the web row's content does.
  const spoken = [title, description, typeof trailing === "string" || typeof trailing === "number" ? String(trailing) : undefined].filter(Boolean).join(", ");
  return <View role="listitem" style={{ flexDirection: "row", alignItems: "center", gap: list.gap }}>
    {pressable ? <Pressable focusRingInset={insetRing} focusRingRadius={ringRadius} {...(Platform.OS === "web" && kind === "link" && !disabled ? { href } : {})}
      accessibilityRole={toggle ? "switch" : kind === "radio" ? "radio" : kind === "link" ? "link" : "button"}
      accessibilityLabel={ariaLabel ?? spoken} disabled={disabled}
      accessibilityState={{ disabled, ...(toggle ? { checked: !!checked } : {}), ...(kind === "radio" ? { checked: !!selected } : {}) }}
      onPress={(event) => { if (toggle) onCheckedChange?.(!checked); onPress?.(event); }}
      style={({ pressed }) => ({ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1, backgroundColor: pressed ? colors.hover : "transparent" })}>{parts}</Pressable>
      // Like Web: a static row dims as a whole when disabled, so nothing in it reads as available.
      : <View style={{ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{parts}</View>}
    {/* A disabled row disables its actions too, so the row never reads as partly available. */}
    {hasContent(actions) && <View pointerEvents={disabled ? "none" : "auto"} {...(disabled && Platform.OS === "web" ? { inert: true } : {})} style={{ maxWidth: "45%", flexDirection: "row", flexWrap: "wrap", gap: list.actionsGap, paddingRight: list.actionsPadding, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{content(actions)}</View>}
    {divider && <Divider inset={list.padding + (front ? leadingWidth + list.gap : 0)} />}
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
  /** Heading level of the title on Native Web (default 3); devices have a heading role without levels. */
  headingLevel?: 2 | 3 | 4;
  /** Shown in place of the rows when the section has none, such as a KjunEmpty. */
  empty?: ReactNode;
  /** Supporting text under the rows, such as what a setting applies to. */
  footer?: ReactNode;
}
/** The rows of a section, with fragments opened up so each row (not each fragment) decides its divider. */
// Native has no selector for this: a heading action that is a ghost KjunButton pulls its label out to the rows' end line.
function ghostInset(actions: ReactNode) {
  if (!isValidElement(actions)) return 0;
  const { variant, size = "md" } = actions.props as { variant?: string; size?: keyof typeof tokens.button.paddingX };
  return variant === "ghost" ? -tokens.button.paddingX[size] : 0;
}
function sectionRows(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
    ? sectionRows(child.props.children) : isValidElement(child) ? [child] : []);
}
const ListGroupContext = createContext<"inset" | "flush" | null>(null);
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default", radius, titleVariant, headingLevel = 3, empty, footer }: KjunListSectionProps) {
  const { colors } = useKjunStyles(), group = useContext(ListGroupContext), corner = radius ?? (group === "inset" ? "lg" : "none");
  const bare = !!title && (titleVariant ? titleVariant === "label" : !description);
  // Like Web: a rounded section is a card of rows only; its title, actions and footer stay on the page around it.
  const outside = corner !== "none";
  const radiusValue = corner === "none" ? undefined : tokens.card.radii[corner];
  const items = sectionRows(children);
  // Each row keeps its own key, so reordering or filtering rows moves them instead of remounting them.
  const rows = items.length
    ? <View role="list" accessibilityLabel={ariaLabel || title}>{items.map((row, i) => <ListRowContext.Provider key={row.key ?? i} value={{ divider: divider && i < items.length - 1, compact: density === "compact", insetRing: outside, ringRadius: i === 0 || i === items.length - 1 ? radiusValue : undefined }}>{row}</ListRowContext.Provider>)}</View>
    : hasContent(empty) ? <View style={{ minHeight: list.minimumHeight, justifyContent: "center", paddingHorizontal: list.padding }}><ListEmptyContext.Provider value>{content(empty)}</ListEmptyContext.Provider></View> : null;
  const card = { backgroundColor: surface ? colors.surface : "transparent", ...(corner === "none" ? {} : { borderRadius: tokens.card.radii[corner], overflow: "hidden" as const }) };
  return <View style={{ minWidth: 0, ...(outside ? {} : card) }}>
    {!!(title || description || actions) && <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.gap, padding: list.padding,
      // A title without a description is a small group header that sits close to its rows; outside a card it starts at the top.
      ...(bare ? { paddingBottom: list.bareHeadingPaddingBottom } : {}), ...(outside ? { paddingTop: 0, paddingBottom: list.outsideLabelGap } : {}) }}>
      <View style={{ flex: 1 }}>{!!title && <KText {...wordProps} accessibilityRole="header" {...(Platform.OS === "web" ? { "aria-level": headingLevel } : {})} style={{ ...(bare ? { ...typeStyle('controlSmall'), color: colors.textSecondary } : typeStyle('cardTitle')), ...words }}>{title}</KText>}{!!description && <KText {...wordProps} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'), ...words }}>{description}</KText>}</View>
      {/* Like Web: actions center on the title's first line and overflow it, so a button never makes the heading taller; a ghost button's label ends on the rows' end line. */}
      {hasContent(actions) && <View style={{ flexShrink: 0, height: typeStyle(bare ? "controlSmall" : "cardTitle").lineHeight, justifyContent: "center", marginEnd: ghostInset(actions) }}>{content(actions)}</View>}
    </View>}
    {outside ? <View style={card}>{rows}</View> : rows}
    {hasContent(footer) && <View style={{ paddingTop: list.footerGap, paddingHorizontal: list.padding, paddingBottom: outside ? 0 : list.padding }}>{typeof footer === "string" ? <KText {...wordProps} style={{ ...typeStyle("caption"), color: colors.textTertiary, ...words }}>{String(footer)}</KText> : content(footer, { ...typeStyle("caption"), color: colors.textTertiary })}</View>}
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
