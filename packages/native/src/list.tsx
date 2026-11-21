import { hasContent } from "../../../shared/package-runtime/content-presence";
import { nodeText } from "../../../shared/package-runtime/node-text";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { CardBodyInsetContext, CardBrandContext, CardTintContext } from "./card-surface-context";
import { typeStyle } from "./typography";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { Children, Fragment, cloneElement, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { linkRel, listRowChoice, listRowCurrent, listRowEnd, listRowExpandable, listRowKind, listRowMetrics, listSectionInset, listSectionShape, listSectionSurface, warnListRowProps, warnListSectionProps, warnListSelection, type ListChoiceValue, type ListGroupVariant, type ListSectionSurface, type ListSectionVariant, type ListSelection, type ListSelectionMode } from "../../../shared/package-runtime/list-row";
import { ListShapeContext } from "./list-context";
import { ReorderContext, ReorderControls, useReorder, type KjunListReorderMove } from "./reorder-controls";
import { reorderPlace } from "../../../shared/package-runtime/reorder";
import { SwitchSpinner } from "./choice-controls";
import { View, Platform, type ColorValue, type GestureResponderEvent, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { listLeadingGeometry, listRowBleed, listSharedColumn, type ListLeadingSize } from "../../../shared/package-runtime/list-leading";
import { AccessiblePressable as Pressable, type FocusRingRadius } from "./a11y";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { KText, content } from "./internal";
import { KjunButton, KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { ListEmptyContext } from "./display-primitives";
import { useKjunStyles } from "./provider";

// A section tells its rows whether to draw a divider (never after the last, like Web's :last-child), the section's
// selection (a single-choice list is a radiogroup) and in a rounded card which of the card's corners the row's ring
// follows. Whether it is open and compact comes from ListShapeContext.
// `column` is the leading column the section's rows share (see listSharedColumn); `closes` marks the last of several
// rows, which a details section sets apart a little more when it is emphasized (Web's :last-child:not(:first-child)).
const ListRowContext = createContext<{ divider: boolean; selection: ListSelection; ringRadius?: FocusRingRadius; column?: number; closes?: boolean }>({ divider: true, selection: { mode: "none" } });
export type { ListChoiceValue, ListGroupVariant, ListSectionSurface, ListSectionVariant, ListTrailingPosition } from "../../../shared/package-runtime/list-row";
export type { ListLeadingSize } from "../../../shared/package-runtime/list-leading";
export type { KjunListReorderMove } from "./reorder-controls";
const list = tokens.extensions.list;
// Like Web's ::after divider: it starts where the text does, past the leading column when there is one.
function Divider({ inset }: { inset: number }) {
  const { colors } = useKjunStyles(), { muted } = useContext(ListShapeContext);
  // On the muted fill the divider role (close to it in most palettes) would vanish, so it takes the border role, like Web.
  return <View pointerEvents="none" style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: muted ? colors.border : colors.divider }} />;
}
export interface KjunListRowProps {
  title: string; description?: string;
  /** Content after the title, centered on its first line, such as a KjunBadge ("New", a count); its text (or a badge's label or count) is heard with the title. */
  badge?: ReactNode;
  /** Icon name drawn in a 24px column (on a 40px rounded square in an open section); custom `leading` content uses a minimum 40px column and takes priority. */
  icon?: string;
  /** Leading square/icon sizes: xs 24/16, sm 32/20, md 40/24, lg 56/28. Custom content keeps its own size. */
  leadingSize?: ListLeadingSize;
  /** App-owned color for the built-in icon; overrides its default/destructive color. */
  iconColor?: ColorValue;
  /** App-owned circular background color for the built-in icon; defaults leadingSize to sm. */
  iconBackground?: ColorValue;
  leading?: ReactNode; trailing?: ReactNode; actions?: ReactNode;
  /** Where the trailing value sits: "side" (default) is a column beside the whole text; "title" puts it on the title line, so the
   * description and children keep the full text width whatever the value's length (rows with a budget bar line up);
   * "below" gives it its own line under the title across the text width, for long values such as an address. */
  trailingPosition?: "side" | "title" | "below";
  /** Web link address (Native Web only); on a device pass onPress and navigate with the app's router. */
  href?: string;
  /** Where a Native Web link row opens, e.g. "_blank" for a new tab; a new tab gets rel="noopener noreferrer" unless rel is given. */
  target?: string;
  /** The Native Web link's rel; by default "noopener noreferrer" for target="_blank". */
  rel?: string;
  disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** The row the list leads to, such as a total or a balance: the title one weight up and the value in the large number
   * type, size and weight only. One or two per section; a details section keeps a little more room above it when it is last. */
  emphasized?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  /** The item open now, such as the message shown beside its list or the settings page in view: the row takes the
   * selected fill and reads as selected (aria-current on Native Web, "page" on a link). Not for switch or choice rows. */
  current?: boolean;
  /** One choice in a single-choice list: true draws a check at the end (in an open section or a multiple-choice list, a filled mark; unchosen rows an empty one). A pressable row given it (true or false) reads as a radio. */
  selected?: boolean;
  /** Makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** The row's last press is still being handled (such as a switch saving): presses (and a Native Web link's navigation) are ignored, the row reads as busy and draws a spinner, in a switch row's thumb or in place of its mark, check or chevron. */
  busy?: boolean;
  /** This row's value in a section that owns its selection (`value` on the section): it is selected when the section's value holds it. */
  value?: ListChoiceValue;
  onPress?: (event: GestureResponderEvent) => void;
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel?: string;
  /** Display-only content under the description (a budget bar); no buttons or links inside a pressable row. */
  children?: ReactNode;
  /** Makes the row open its own content: the row is a button that reports the next state, and ends with a chevron that turns over when open.
   * Not with href, checked, selected or chevron. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Shown under the row while expanded, from the line the title starts on. It is outside the button, so it may hold buttons. */
  expandedContent?: ReactNode;
  /** Clamps the title (and the description) to this many lines, ending in an ellipsis. */
  titleLines?: number;
  descriptionLines?: number;
}
// The switch a switch row draws: track and thumb only, so it never becomes a second focus stop or control.
function SwitchMark({ on, busy }: { on: boolean; busy: boolean }) {
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.switch, width = geometry.widths.md, height = geometry.heights.md, thumb = height - 2 * geometry.padding;
  return <View style={{ width, height, padding: geometry.padding, borderRadius: geometry.radius, backgroundColor: on ? colors.brand : colors.switchTrack ?? colors.border }}>
    <View style={{ width: thumb, height: thumb, borderRadius: thumb / 2, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.switchThumbOn : colors.switchThumb, transform: [{ translateX: on ? width - height : 0 }] }}>{busy && <SwitchSpinner />}</View>
  </View>;
}
// Like Web's keep-all: Korean wraps between words (iOS through its Hangul word strategy, a Text prop).
const words = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as unknown as TextStyle;
const wordProps = { lineBreakStrategyIOS: "hangul-word" as const };
// A choice's mark in an open section: an empty ring (a rounded square in a multiple-choice list), filled with a check
// when chosen, like Web's .kjun-list-mark.
function ChoiceMark({ checkbox, on }: { checkbox: boolean; on: boolean }) {
  const { colors } = useKjunStyles(), size = list.markSize;
  return <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ width: size, height: size, borderRadius: checkbox ? list.checkboxRadius : size / 2, alignItems: "center", justifyContent: "center",
    ...(on ? { backgroundColor: colors.brand } : { borderWidth: tokens.border.controlWidth, borderColor: colors.borderStrong }) }}>
    {on && <KjunIcon name="check" size={list.markIconSize} color={colors.onBrand} />}
  </View>;
}
export function KjunListRow({ title, description, badge, icon, leadingSize, iconColor, iconBackground, leading, trailing, trailingPosition = "side", actions, href, target, rel, disabled = false, destructive = false, emphasized = false, chevron = false, current = false, selected: ownSelected, checked, onCheckedChange, busy = false, value, onPress: ownPress, ariaLabel, children, titleLines, descriptionLines, expanded, onExpandedChange, expandedContent }: KjunListRowProps) {
  const { colors } = useKjunStyles(), { divider, selection, ringRadius, column: sharedColumn = 0, closes = false } = useContext(ListRowContext), { open, details = false, compact, muted = false, inset: sectionInset } = useContext(ListShapeContext);
  const choice = listRowChoice(selection, value, ownSelected), selected = choice.selected;
  const id = "kjun-" + useId().replace(/[^\w-]/g, "");
  // In a reorderable section a row its order lists draws move buttons after its own actions.
  const reorder = useContext(ReorderContext), movable = !!reorder && !!reorderPlace(reorder.order, value);
  // Like Web: a row with `expanded` and no other role opens its own content.
  const expandable = listRowExpandable({ expanded, checked, selected, href });
  const onPress = choice.press ? (event: GestureResponderEvent) => { choice.press(); ownPress?.(event); }
    : expandable ? (event: GestureResponderEvent) => { onExpandedChange?.(!expanded); ownPress?.(event); } : ownPress;
  const kind = listRowKind({ checked, selected, href, pressable: !!(onPress || href), mode: selection.mode }), toggle = kind === "switch";
  const choiceRow = kind === "radio" || kind === "checkbox", endMark = listRowEnd({ kind, selected, mode: selection.mode, open, busy });
  const deviceLink = Platform.OS !== "web" && !!href && !onPress;
  const looseChoice = choiceRow && selection.mode === "none";
  const pressableDetails = details && kind !== "static";
  useEffect(() => warnListRowProps({ checked, selected, href, chevron, deviceLink, looseChoice, expanded, pressableDetails, current }), [checked !== undefined, selected !== undefined, !!href, chevron, deviceLink, looseChoice, expanded !== undefined, pressableDetails, current]);
  const now = listRowCurrent(kind, current);
  // Like Web's row variables: an open row has a larger title, body description, and its own padding and height.
  // A details row reads its label in the secondary body type and its value in the text color; an emphasized row (any
  // section) takes the title one weight up and the value in the large number type.
  const m = listRowMetrics({ open, compact, details }), { paddingY, gap } = m, minHeight = m.minimumHeight;
  // A bleeding section hands its rows the card body's inset, so their text stays on the card's content line.
  const paddingX = sectionInset ?? m.paddingX, actionsPadding = sectionInset ?? m.actionsPadding;
  const titleType = { ...typeStyle(m.title), fontWeight: typeStyle(emphasized ? "labelStrong" : details ? "body" : "label").fontWeight, ...(details && !emphasized ? { color: colors.textSecondary } : {}) };
  const descriptionType = typeStyle(m.description), trailingType = typeStyle(emphasized ? "numberLg" : m.trailing), valueColor = details || emphasized ? colors.text : colors.textSecondary;
  const band = titleType.lineHeight + list.descriptionGap + descriptionType.lineHeight;
  // Like Web: without a description the leading content, switch and mark reach into the padding instead of growing the
  // row (one margin for every size); with one, the row's ends center on the band of the title and first description line.
  const bleed = { marginVertical: listRowBleed(paddingY) };
  // Like Web's --_kjun-list-lift: a leading square taller than that band (lg) moves the band, and the ends with it, down
  // so the band, the square and the ends center on one line.
  const end = (height: number) => description ? { alignSelf: "flex-start" as const, marginTop: lift + (band - height) / 2 } : bleed;
  const hasLeading = hasContent(leading), geometry = listLeadingGeometry({ size: leadingSize, custom: hasLeading, background: iconBackground != null, open }), leadingWidth = geometry.width, column = Math.max(geometry.column, sharedColumn);
  const glyph = icon ? <KjunIcon name={icon} size={geometry.iconSize} color={iconColor ?? (destructive ? colors.danger : open ? colors.text : colors.textSecondary)} /> : null;
  // On the muted fill an open row's square takes the surface, so it does not dissolve into the section's own fill.
  const tileColor = iconBackground ?? (open ? (destructive ? colors.dangerBg : muted ? colors.surface : colors.secondary) : undefined);
  const front = hasLeading ? content(leading) : glyph && geometry.tile ? <View accessible={false} style={{ width: leadingWidth, height: leadingWidth, borderRadius: open ? list.open.leadingRadius : list.iconBackgroundRadius, alignItems: "center", justifyContent: "center", backgroundColor: tileColor }}>{glyph}</View> : glyph;
  const leadingHeight = Math.max(geometry.size ? leadingWidth : 0, description ? band : 0);
  const lift = description && geometry.size ? Math.max(0, (leadingWidth - band) / 2) : 0;
  const switchHeight = tokens.extensions.switch.heights.md, endIcon = list.endIconSize;
  const titleBlock = hasContent(badge) ? <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.badgeGap, minWidth: 0 }}>
        <KText {...wordProps} numberOfLines={titleLines} style={{ ...titleType, ...words, flexShrink: 1, ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>
        <View style={{ flexShrink: 0, minHeight: titleType.lineHeight, justifyContent: "center" }}>{content(badge)}</View>
      </View> : <KText {...wordProps} numberOfLines={titleLines} style={{ ...titleType, ...words, ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>;
  // A value at the row's end reads one step below the title and keeps the row's end line when it wraps.
  // trailingPosition="title" puts it on the title line, so the description and children keep the full text column.
  // trailingPosition="below" gives it its own line under the title. In a details row the value takes the room the
  // label leaves: a short one keeps the end line, and one that wraps reads from its start while its box keeps that line.
  const onTitle = hasContent(trailing) && trailingPosition === "title", below = hasContent(trailing) && trailingPosition === "below", side = details && !below;
  const endValue = hasContent(trailing) && (below
    ? <View style={{ marginTop: list.descriptionGap, alignItems: "flex-start" }}>{content(trailing, { ...trailingType, color: valueColor, textAlign: "left" })}</View>
    : side ? <View style={{ flexShrink: 1, minWidth: 0, marginLeft: "auto", alignItems: "flex-start" }}>{content(trailing, { ...trailingType, color: valueColor, textAlign: "left" })}</View>
    : <View style={{ maxWidth: `${list.trailingMaxPercent}%`, alignItems: "flex-end", justifyContent: "center", ...(onTitle ? { flexShrink: 0, minHeight: titleType.lineHeight } : description ? { alignSelf: "flex-start", minHeight: band, marginTop: lift } : {}) }}>{content(trailing, { ...trailingType, color: valueColor, textAlign: "right" })}</View>);
  const parts = <>
    {front && <View style={{ minWidth: column, ...(geometry.size ? { width: column } : {}), flexShrink: 0, minHeight: leadingHeight, alignItems: "center", justifyContent: "center",
      ...(description ? { alignSelf: "flex-start" } : bleed) }}>{front}</View>}
    <View style={side ? { flexGrow: 0, flexShrink: 0, maxWidth: `${list.details.titleMaxPercent}%` } : { flex: 1, minWidth: 0, ...(lift ? { alignSelf: "flex-start", marginTop: lift } : {}) }}>
      {/* Like Web: a badge follows the title and centers on its first line; a long title wraps before it. */}
      {onTitle ? <View style={{ flexDirection: "row", alignItems: "flex-start", gap, minWidth: 0 }}><View style={{ flex: 1, minWidth: 0 }}>{titleBlock}</View>{endValue}</View> : titleBlock}
      {below && endValue}
      {!!description && <KText {...wordProps} numberOfLines={descriptionLines} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...descriptionType, ...words }}>{description}</KText>}
      {hasContent(children) && <View style={{ marginTop: list.descriptionGap }}>{content(children)}</View>}
    </View>
    {!onTitle && !below && endValue}
    {endMark === "spinner" ? <View style={end(endIcon)}><KjunSpinnerGlyph size={endIcon} color={colors.textTertiary} /></View>
      : endMark === "mark" ? <View style={end(list.markSize)}><ChoiceMark checkbox={kind === "checkbox"} on={!!selected} /></View>
      : endMark === "check" && <View style={description ? end(endIcon) : undefined}><KjunIcon name="check" size={endIcon} color={colors.brand} /></View>}
    {/* A switch row is one switch control: the drawn switch is decoration and the row carries role and state. */}
    {toggle && <View pointerEvents="none" accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      // The row is the touch target, so the drawn switch keeps only its own height, like Web.
      style={{ height: switchHeight, justifyContent: "center", ...end(switchHeight) }}><SwitchMark on={!!checked} busy={busy} /></View>}
    {/* Like Web: an expandable row ends with a chevron that points down and turns over when open. */}
    {expandable && endMark !== "spinner" && <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[description ? end(endIcon) : undefined, expanded ? { transform: [{ rotate: "180deg" }] } : null]}><KjunIcon name="chevron-down" size={endIcon} color={colors.textTertiary} /></View>}
    {chevron && !expandable && endMark !== "spinner" && <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={description ? end(endIcon) : undefined}><KjunIcon name="chevron-right" size={endIcon} color={colors.textTertiary} /></View>}
  </>;
  // Like Web: a details row lines its label and value up on their first line, and a closing emphasized row (a total) keeps
  // a little more room above it.
  const style = { flex: 1, minWidth: 0, minHeight, flexDirection: "row" as const, alignItems: details ? "baseline" as const : "center" as const, gap, paddingVertical: paddingY, paddingHorizontal: paddingX,
    ...(details && emphasized && closes ? { paddingTop: paddingY + list.details.emphasizedGap } : {}) };
  const pressable = kind !== "static";
  // Like Web, the whole row (its actions too) takes the hover and pressed fill, and an open section's chosen row its own.
  const [hovered, setHovered] = useState(false), [pressed, setPressed] = useState(false);
  // Like Web, the chosen row keeps its fill when disabled.
  // The item open now (current) takes the same fill.
  const chosen = (open && choiceRow && selected) || now ? colors.selectedBg : undefined;
  // A busy row ignores presses, so like Web it takes no hover or pressed fill.
  const fill = disabled || busy || !pressable ? chosen : pressed ? colors.active : hovered ? colors.hover : chosen;
  // The default name reads the title, a text badge, the description and a text value at the row's end, like the web
  // row's name (title, badge and value) and description.
  // An element (a KjunBadge, a KjunText value) reads its text too, since the label replaces what its children would say.
  const spoken = [title, nodeText(badge), description, nodeText(trailing)].filter(Boolean).join(", ");
  // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
  const role = selection.mode === "single" ? undefined : "listitem" as const, inset = paddingX + (front ? column + gap : 0);
  const shape = open ? { marginHorizontal: list.open.rowInset, borderRadius: list.open.rowRadius } : {};
  const head = { flexDirection: "row" as const, alignItems: "center" as const, gap, backgroundColor: fill };
  const row = <>
    {/* Rows run edge to edge, so like Web the keyboard ring draws inside them. */}
    {pressable ? <Pressable focusRingInset focusRingRadius={open ? list.open.rowRadius : ringRadius} {...(Platform.OS === "web" && kind === "link" && !disabled && !busy ? { href, hrefAttrs: { target, rel: linkRel(target, rel) } } : {})}
      // Like Web: an expandable row names the content it opens (Native Web; devices have no such relation).
      {...(Platform.OS === "web" && expandable ? { "aria-controls": id + "-expanded" } : {})}
      accessibilityRole={toggle ? "switch" : choiceRow || kind === "link" ? kind : "button"}
      accessibilityLabel={ariaLabel ?? spoken} disabled={disabled}
      accessibilityState={{ disabled, busy, ...(toggle ? { checked: !!checked } : {}), ...(choiceRow ? { checked: !!selected } : {}), ...(expandable ? { expanded: !!expanded } : {}), ...(now && Platform.OS !== "web" ? { selected: true } : {}) }}
      // The item open now: aria-current on Native Web (aria-selected is not for buttons or links), selected on a device.
      {...(Platform.OS === "web" && now ? { "aria-current": now } : {})}
      onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
      // A busy row ignores presses but keeps its focus and role, so it stays reachable and reads as busy.
      onPress={(event) => { if (busy) return; if (toggle) onCheckedChange?.(!checked); onPress?.(event); }}
      style={{ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{parts}</Pressable>
      // Like Web: a static row dims as a whole when disabled, so nothing in it reads as available.
      : <View {...(Platform.OS === "web" && now ? { "aria-current": now } : {})} style={{ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{parts}</View>}
    {/* A disabled row disables its actions too, so the row never reads as partly available. */}
    {(hasContent(actions) || movable) && <View pointerEvents={disabled ? "none" : "auto"} {...(disabled && Platform.OS === "web" ? { inert: true } : {})} style={{ maxWidth: `${list.actionsMaxPercent}%`, flexDirection: "row", flexWrap: "wrap", gap: list.actionsGap, paddingRight: actionsPadding,
      // Like Web: with a description, actions center on the title and first description line instead of a long row's middle.
      ...(description ? { alignSelf: "flex-start", alignItems: "center", alignContent: "center", minHeight: band, marginTop: paddingY + lift } : {}), opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{content(actions)}{movable && <ReorderControls value={value!} name={title || ariaLabel || ""} />}</View>}
  </>;
  const rule = divider && <Divider inset={inset} />;
  if (!expandable) return <View role={role} style={{ ...head, ...shape }}>{row}{rule}</View>;
  // Like Web: the content opens under the head inside the same row, from the line the title starts on; the hover and
  // pressed fill stays on the head, and the content is outside the button, so it may hold buttons and links.
  return <View role={role} style={shape}>
    <View style={{ ...head, ...(open ? { borderRadius: list.open.rowRadius } : {}) }}>{row}</View>
    <Collapse open={!!expanded}><View nativeID={id + "-expanded"} style={{ paddingLeft: inset, paddingRight: paddingX, paddingBottom: paddingY }}>{content(expandedContent)}</View></Collapse>
    {rule}
  </View>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children?: ReactNode; ariaLabel?: string;
  /** Like Web: a short mark after the title, such as a KjunBadge with the row count; centered on the title's first line and read with the title as the list's name. */
  badge?: ReactNode;
  /** Style of the root View (outer spacing, width); testID finds it in tests. */
  style?: StyleProp<ViewStyle>; testID?: string;
  /** Paints the surface background (default true); false lets the page background show through; "muted" paints the muted fill, which sets rows apart inside a white card or modal. */
  surface?: ListSectionSurface;
  /** Runs the section past its container's content edge to the container's edge: inside a KjunCard body by the card's
   * padding, elsewhere by the rows' 16. Rows, heading and footer take that inset, so their text stays on the content line
   * around the section while row fills and dividers reach the edge. The section is flat (radius does not apply); an open
   * section keeps its own inset. A parent that clips its overflow cuts the overhang off. */
  bleed?: boolean;
  /** Draws dividers between rows (default true; false in a details section). An open section draws none; giving it true warns in development. */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. A details section keeps its own 32px rows. */
  density?: "default" | "compact";
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). An open section has no card. */
  radius?: CardRadius;
  /** "open" puts the rows on the page with no card or dividers: larger titles, icons on rounded squares, and a filled mark for the chosen row (default "default", or "open" in an open KjunListGroup).
   * "details" is for rows that are read, not pressed ("Payment method / Visa"): 32 tall, no dividers, the label secondary and the value in the text color with the room the label leaves. */
  variant?: ListSectionVariant;
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant?: "title" | "label";
  /** Heading level of the title on Native Web (default 3); devices have a heading role without levels. */
  headingLevel?: 2 | 3 | 4;
  /** Shown in place of the rows when the section has none, such as a KjunEmpty. */
  empty?: ReactNode;
  /** Supporting text under the rows, such as what a setting applies to. */
  footer?: ReactNode;
  /** Shown in place of the rows (and the empty content) while they load, such as a KjunListSkeleton with variant "row". */
  loading?: ReactNode;
  /** "single": the rows are one choice and the list a radio group (with arrow keys on Native Web); "multiple": each row is a checkbox. Rows are choices when given `selected`, or a `value` with the section's `value`. */
  selectionMode?: ListSelectionMode;
  /** The chosen rows' values, owned by the app: one value (null for none) with "single", a list with "multiple". */
  value?: ListChoiceValue | null | ListChoiceValue[];
  /** Called with the next value (a list with "multiple") when a row with a `value` is pressed. */
  onValueChange?: (value: ListChoiceValue | ListChoiceValue[]) => void;
  /** Rows listed in `order` get up and down buttons. The app keeps the order, renders its rows in it and saves it. */
  reorderable?: boolean;
  /** The row values in the order shown; a row whose value is not listed cannot move. */
  order?: readonly ListChoiceValue[];
  /** Called with the next order when a row moves; the app applies it. */
  onOrderChange?: (order: ListChoiceValue[]) => void;
  /** The same move in detail: the row's value, where it was and where it went. */
  onReorder?: (move: KjunListReorderMove) => void;
  /** Web draws a drag handle for "handle" and "both"; Native always draws the up and down buttons. */
  reorderControls?: "buttons" | "handle" | "both";
  /** Turns the move buttons off, such as while the list is sorted by a rule. */
  reorderDisabled?: boolean;
  /** Why moving is off, shown under the rows and read with the move buttons. */
  reorderDisabledText?: string;
}
/** Elements inside fragments, opened up, with keys made unique by their fragment's key. */
function elements(children: ReactNode, prefix = ""): ReactElement[] {
  return Children.toArray(children).flatMap(child => !isValidElement<{ children?: ReactNode }>(child) ? []
    : child.type === Fragment ? elements(child.props.children, prefix + child.key + "/")
    : [prefix ? cloneElement(child, { key: prefix + child.key }) : child]);
}
// Native has no selector for these: the last heading action, when it is a ghost KjunButton, pulls its label (or an
// icon-only button its glyph) out to the rows' end line, like Web.
function ghostInset(actions: ReactNode) {
  const last = elements(actions).pop();
  if (!last) return 0;
  const { variant, size = "md", children, prefixIcon, suffixIcon } = last.props as { variant?: string; size?: keyof typeof tokens.button.paddingX; children?: ReactNode; prefixIcon?: string; suffixIcon?: string };
  if (variant !== "ghost" || !(size in tokens.button.paddingX)) return 0;
  return !hasContent(children) && (prefixIcon || suffixIcon) ? (tokens.button.iconSizes[size] - tokens.button.heights[size]) / 2 : -tokens.button.paddingX[size];
}
// The tallest heading action known before layout (KjunButtons by their size), so the first frame already keeps a tall
// button clear of the rows; layout then measures any other control.
function actionsHeight(actions: ReactNode, line: number) {
  return elements(actions).reduce((tallest, action) => {
    const size = (action.props as { size?: keyof typeof tokens.button.heights }).size ?? "md";
    return action.type === KjunButton && size in tokens.button.heights ? Math.max(tallest, tokens.button.heights[size]) : tallest;
  }, line);
}
const ListGroupContext = createContext<ListGroupVariant | null>(null);
export function KjunListSection({ title, description, badge, style, testID, actions, children, ariaLabel, surface = true, bleed: bleedProp = false, divider: dividerProp, density = "default", radius, titleVariant, headingLevel = 3, empty, footer, loading, selectionMode = "none", value, onValueChange, variant, reorderable = false, order, onOrderChange, onReorder, reorderDisabled = false, reorderDisabledText }: KjunListSectionProps) {
  const { colors } = useKjunStyles();
  const id = "kjun-" + useId().replace(/[^\w-]/g, ""), noteText = reorderable && reorderDisabled && reorderDisabledText ? reorderDisabledText : undefined;
  // Like Web: the badge sits beside the heading text, outside it, and its text joins the list's name.
  const hasBadge = !!title && hasContent(badge), badgeText = hasBadge ? nodeText(badge) : undefined;
  const reorder = useReorder({ reorderable, order, disabled: reorderDisabled, note: noteText ? { id: id + "-reorder", text: noteText } : undefined, onOrderChange, onReorder });
  // Like Web: a rounded section is a card of rows only; its title, actions and footer stay on the page around it.
  const { open, details, corner, bare, outside, bleed } = listSectionShape({ radius, group: useContext(ListGroupContext), variant, title, description, titleVariant, bleed: bleedProp });
  // Like Web: a bleeding section reaches past the card body's padding (or the rows' 16 elsewhere) and its rows take it.
  const { inset, margin } = listSectionInset(bleed, useContext(CardBodyInsetContext), list.padding);
  const divider = dividerProp ?? !details;
  useEffect(() => warnListSectionProps({ open, divider: dividerProp, details, compact: density === "compact" }), [open, dividerProp, details, density]);
  useEffect(() => warnListSelection({ mode: selectionMode, value, handled: !!onValueChange }), [selectionMode, Array.isArray(value), value === undefined, !!onValueChange]);
  const radiusValue = corner === "none" ? undefined : tokens.card.radii[corner];
  const choice = selectionMode === "single", [group, setGroup] = useState<View | null>(null);
  const hasFooter = hasContent(footer), describedBy = [description && id + "-description", hasFooter && id + "-footer"].filter(Boolean).join(" ") || undefined;
  // Like Web: heading actions center on the title's first line; a taller button grows the heading only by what it
  // reaches past that line, so it never covers the rows (or, outside a card, the space above the title).
  const titleLine = typeStyle(bare ? "controlSmall" : "cardTitle").lineHeight;
  const [measured, setActionHeight] = useState<number>(), actionHeight = measured ?? actionsHeight(actions, titleLine);
  const overflow = Math.max(0, (actionHeight - titleLine) / 2);
  const items = elements(children);
  // Native Web: like RadioGroup, a single-choice list has one Tab stop and arrow keys; devices move by their own gestures.
  // The list is tracked by a callback ref, so a list drawn again (after loading or an empty state) is bound again.
  useLayoutEffect(() => Platform.OS === "web" && choice && group ? bindRadioKeyboard(group as unknown as HTMLElement) : undefined, [choice, group]);
  const compact = density === "compact" && !details;
  // Memoized, so a section drawing again for its own state (its measured heading actions or list) does not hand every
  // row a new context and redraw it.
  const fill = listSectionSurface(surface), muted = fill.muted;
  const shape = useMemo(() => ({ open, details, compact, muted, ...(bleed ? { inset } : {}) }), [open, details, compact, muted, bleed, inset]);
  const selection = useMemo(() => ({ mode: selectionMode, value, onValueChange }), [selectionMode, value, onValueChange]);
  const count = items.length;
  // Like Web, rows that lead with something share the list's widest leading column, so titles start on one line.
  const shared = listSharedColumn(items.map(row => {
    const props = (row.props ?? {}) as { icon?: string; leading?: ReactNode; leadingSize?: ListLeadingSize; iconBackground?: unknown };
    return { leading: !!props.icon || hasContent(props.leading), custom: hasContent(props.leading), size: props.leadingSize, background: props.iconBackground != null };
  }), open);
  const contexts = useMemo(() => Array.from({ length: count }, (_, i) => {
    const first = i === 0, last = i === count - 1;
    const ringRadius = radiusValue === undefined ? undefined : first && last ? radiusValue : first ? { top: radiusValue } : last ? { bottom: radiusValue } : undefined;
    return { divider: divider && !last && !open, selection, ringRadius, column: shared, closes: last && !first };
  }), [count, divider, open, selection, radiusValue, shared]);
  // Each row keeps its own key, so reordering or filtering rows moves them instead of remounting them.
  // Loading content announces itself (a skeleton's loadingText is a status), so the wrapper only places it.
  const rows = hasContent(loading) ? <View>{content(loading)}</View>
    : items.length
    ? <View ref={setGroup} role={choice ? "radiogroup" : "list"} accessibilityLabel={ariaLabel || [title, badgeText].filter(Boolean).join(", ") || undefined} style={details ? { paddingVertical: list.details.listPaddingY } : undefined}
        {...(Platform.OS === "web" && describedBy ? { "aria-describedby": describedBy } : {})}>
      <ReorderContext.Provider value={reorder.context}>{items.map((row, i) => <ListRowContext.Provider key={row.key ?? i} value={contexts[i]}>{row}</ListRowContext.Provider>)}</ReorderContext.Provider>
    </View>
    : hasContent(empty) ? <View style={{ minHeight: compact ? list.compactMinimumHeight : list.minimumHeight, justifyContent: "center", paddingHorizontal: inset }}><ListEmptyContext.Provider value={density}>{content(empty)}</ListEmptyContext.Provider></View> : null;
  const heading = <KText {...wordProps} accessibilityRole="header" {...(Platform.OS === "web" ? { "aria-level": headingLevel } : {})} style={{ flexShrink: 1, ...(bare ? { ...typeStyle('controlSmall'), color: colors.textSecondary } : typeStyle('cardTitle')), ...words }}>{title}</KText>;
  const tint = useContext(CardTintContext), brand = useContext(CardBrandContext);
  const card = { backgroundColor: muted ? colors.secondary : fill.painted ? colors.surface : "transparent", ...(radiusValue === undefined ? {} : { borderRadius: radiusValue, overflow: "hidden" as const }) };
  // A section on the plain surface drops a tinted card's badge fill, so its badges keep their own tone; on the muted fill
  // badges take the plain surface, as inside a tinted card (only the rows' card when the heading sits outside it).
  return <CardTintContext.Provider value={muted && !outside || (fill.painted ? false : tint)}><CardBrandContext.Provider value={fill.painted ? false : brand}><ListShapeContext.Provider value={shape}><View testID={testID} style={[{ minWidth: 0, ...(outside ? {} : card), ...(bleed ? { marginHorizontal: margin } : {}) }, style]}>
    {!!(title || description || hasContent(actions)) && <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.gap, padding: list.padding, paddingHorizontal: inset,
      // A title without a description is a small group header that sits close to its rows; outside a card it starts at the top.
      // Like Web: 8px under a heading (4px under a small group header), so it reads with its rows.
      paddingBottom: bare ? list.bareHeadingPaddingBottom : list.headingPaddingBottom, ...(outside ? { paddingTop: overflow, paddingBottom: list.outsideLabelGap } : {}) }}>
      <View style={{ flex: 1 }}>{!!title && (hasBadge
        ? <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.badgeGap, minWidth: 0 }}>{heading}<View style={{ flexShrink: 0, height: titleLine, flexDirection: "row", alignItems: "center" }}>{content(badge)}</View></View>
        : heading)}{!!description && <KText {...wordProps} nativeID={id + "-description"} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'), ...words }}>{description}</KText>}</View>
      {hasContent(actions) && <View style={{ flexShrink: 0, height: titleLine, marginBottom: overflow, justifyContent: "center", marginEnd: ghostInset(actions) }}>
        <View onLayout={event => setActionHeight(event.nativeEvent.layout.height)} style={{ flexDirection: "row", alignItems: "center", gap: list.actionsGap }}>{content(actions)}</View>
      </View>}
    </View>}
    {outside ? <View style={card}>{muted ? <CardTintContext.Provider value>{rows}</CardTintContext.Provider> : rows}</View> : rows}
    {!!noteText && <View nativeID={id + "-reorder"} style={{ paddingTop: list.footerGap, paddingHorizontal: inset, paddingBottom: outside || hasFooter ? 0 : list.padding }}><KText {...wordProps} style={{ ...typeStyle("caption"), color: colors.textTertiary, ...words }}>{noteText}</KText></View>}
    {reorder.status}
    {hasFooter && <View nativeID={id + "-footer"} style={{ paddingTop: list.footerGap, paddingHorizontal: inset, paddingBottom: outside ? 0 : list.padding }}>{typeof footer === "string" ? <KText {...wordProps} style={{ ...typeStyle("caption"), color: colors.textTertiary, ...words }}>{String(footer)}</KText> : content(footer, { ...typeStyle("caption"), color: colors.textTertiary })}</View>}
  </View></ListShapeContext.Provider></CardBrandContext.Provider></CardTintContext.Provider>;
}
export interface KjunListGroupProps {
  /** Style of the root View (outer spacing, width); testID finds it in tests. */
  style?: StyleProp<ViewStyle>; testID?: string;
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart; "open" puts every section's rows on the page with no card or dividers, 20px apart. */
  variant?: ListGroupVariant;
  children: ReactNode;
}
/** Like Web: stacks KjunListSections with one spacing and corner rule. */
export function KjunListGroup({ variant = "inset", children, style, testID }: KjunListGroupProps) {
  return <ListGroupContext.Provider value={variant}><View testID={testID} style={[{ minWidth: 0, gap: variant === "flush" ? list.flushGroupGap : variant === "open" ? list.open.groupGap : list.groupGap }, style]}>{content(children)}</View></ListGroupContext.Provider>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  const { divider, selection } = useContext(ListRowContext), { open, compact, inset: sectionInset } = useContext(ListShapeContext), itemInset = sectionInset ?? tokens.extensions.list.padding;
  return <View role={selection.mode === "single" ? undefined : "listitem"} style={{ padding: tokens.extensions.list.padding, paddingHorizontal: itemInset, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}),
    ...(open ? { marginHorizontal: list.open.rowInset, paddingHorizontal: list.open.paddingX } : {}), minWidth: 0 }}>{content(children)}{divider && <Divider inset={itemInset} />}</View>;
}
