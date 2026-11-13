import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { Children, Fragment, cloneElement, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { listRowChoice, listRowEnd, listRowKind, listRowMetrics, listSectionShape, warnListRowProps, warnListSectionProps, warnListSelection, type ListChoiceValue, type ListGroupVariant, type ListSectionVariant, type ListSelection, type ListSelectionMode } from "../../../shared/package-runtime/list-row";
import { ListShapeContext } from "./list-context";
import { ReorderContext, ReorderControls, useReorder, type KjunListReorderMove } from "./reorder-controls";
import { reorderPlace } from "../../../shared/package-runtime/reorder";
import { SwitchSpinner } from "./choice-controls";
import { View, Platform, type ColorValue, type GestureResponderEvent, type TextStyle } from "react-native";
import { listLeadingGeometry, listRowBleed, listSharedColumn, type ListLeadingSize } from "../../../shared/package-runtime/list-leading";
import { AccessiblePressable as Pressable, type FocusRingRadius } from "./a11y";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { KText, content } from "./internal";
import { KjunButton, KjunIcon } from "./button";
import { ListEmptyContext } from "./display-primitives";
import { useKjunStyles } from "./provider";

// A section tells its rows whether to draw a divider (never after the last, like Web's :last-child), the section's
// selection (a single-choice list is a radiogroup) and in a rounded card which of the card's corners the row's ring
// follows. Whether it is open and compact comes from ListShapeContext.
// `column` is the leading column the section's rows share (see listSharedColumn).
const ListRowContext = createContext<{ divider: boolean; selection: ListSelection; ringRadius?: FocusRingRadius; column?: number }>({ divider: true, selection: { mode: "none" } });
export type { ListChoiceValue, ListGroupVariant, ListSectionVariant } from "../../../shared/package-runtime/list-row";
export type { ListLeadingSize } from "../../../shared/package-runtime/list-leading";
export type { KjunListReorderMove } from "./reorder-controls";
const list = tokens.extensions.list;
// Like Web's ::after divider: it starts where the text does, past the leading column when there is one.
function Divider({ inset }: { inset: number }) {
  const { colors } = useKjunStyles();
  return <View pointerEvents="none" style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />;
}
export interface KjunListRowProps {
  title: string; description?: string;
  /** Content after the title, centered on its first line, such as a KjunBadge ("New", a count); a string or number is heard with the title. */
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
  /** Web link address (Native Web only); on a device pass onPress and navigate with the app's router. */
  href?: string;
  disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
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
export function KjunListRow({ title, description, badge, icon, leadingSize, iconColor, iconBackground, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, selected: ownSelected, checked, onCheckedChange, busy = false, value, onPress: ownPress, ariaLabel, children, titleLines, descriptionLines }: KjunListRowProps) {
  const { colors } = useKjunStyles(), { divider, selection, ringRadius, column: sharedColumn = 0 } = useContext(ListRowContext), { open, compact } = useContext(ListShapeContext);
  const choice = listRowChoice(selection, value, ownSelected), selected = choice.selected;
  // In a reorderable section a row its order lists draws move buttons after its own actions.
  const reorder = useContext(ReorderContext), movable = !!reorder && !!reorderPlace(reorder.order, value);
  const onPress = choice.press ? (event: GestureResponderEvent) => { choice.press(); ownPress?.(event); } : ownPress;
  const kind = listRowKind({ checked, selected, href, pressable: !!(onPress || href), mode: selection.mode }), toggle = kind === "switch";
  const choiceRow = kind === "radio" || kind === "checkbox", endMark = listRowEnd({ kind, selected, mode: selection.mode, open, busy });
  const deviceLink = Platform.OS !== "web" && !!href && !onPress;
  const looseChoice = choiceRow && selection.mode === "none";
  useEffect(() => warnListRowProps({ checked, selected, href, chevron, deviceLink, looseChoice }), [checked !== undefined, selected !== undefined, !!href, chevron, deviceLink, looseChoice]);
  // Like Web's row variables: an open row has a larger title, body description, and its own padding and height.
  const m = listRowMetrics({ open, compact }), { paddingY, paddingX, gap } = m, minHeight = m.minimumHeight;
  const titleType = { ...typeStyle(m.title), fontWeight: typeStyle("label").fontWeight };
  const descriptionType = typeStyle(m.description), trailingType = typeStyle(m.trailing);
  const band = titleType.lineHeight + list.descriptionGap + descriptionType.lineHeight;
  // Like Web: without a description the leading content, switch and mark reach into the padding instead of growing the
  // row (one margin for every size); with one, the row's ends center on the band of the title and first description line.
  const bleed = { marginVertical: listRowBleed(paddingY) };
  const end = (height: number) => description ? { alignSelf: "flex-start" as const, marginTop: (band - height) / 2 } : bleed;
  const hasLeading = hasContent(leading), geometry = listLeadingGeometry({ size: leadingSize, custom: hasLeading, background: iconBackground != null, open }), leadingWidth = geometry.width, column = Math.max(geometry.column, sharedColumn);
  const glyph = icon ? <KjunIcon name={icon} size={geometry.iconSize} color={iconColor ?? (destructive ? colors.danger : open ? colors.text : colors.textSecondary)} /> : null;
  const tileColor = iconBackground ?? (open ? (destructive ? colors.dangerBg : colors.secondary) : undefined);
  const front = hasLeading ? content(leading) : glyph && geometry.tile ? <View accessible={false} style={{ width: leadingWidth, height: leadingWidth, borderRadius: open ? list.open.leadingRadius : list.iconBackgroundRadius, alignItems: "center", justifyContent: "center", backgroundColor: tileColor }}>{glyph}</View> : glyph;
  const leadingHeight = Math.max(geometry.size ? leadingWidth : 0, description ? band : 0);
  const switchHeight = tokens.extensions.switch.heights.md, endIcon = list.endIconSize;
  const parts = <>
    {front && <View style={{ minWidth: column, ...(geometry.size ? { width: column } : {}), flexShrink: 0, minHeight: leadingHeight, alignItems: "center", justifyContent: "center",
      ...(description ? { alignSelf: "flex-start" } : bleed) }}>{front}</View>}
    <View style={{ flex: 1, minWidth: 0 }}>
      {/* Like Web: a badge follows the title and centers on its first line; a long title wraps before it. */}
      {hasContent(badge) ? <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.badgeGap, minWidth: 0 }}>
        <KText {...wordProps} numberOfLines={titleLines} style={{ ...titleType, ...words, flexShrink: 1, ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>
        <View style={{ flexShrink: 0, minHeight: titleType.lineHeight, justifyContent: "center" }}>{content(badge)}</View>
      </View> : <KText {...wordProps} numberOfLines={titleLines} style={{ ...titleType, ...words, ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>}
      {!!description && <KText {...wordProps} numberOfLines={descriptionLines} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...descriptionType, ...words }}>{description}</KText>}
      {hasContent(children) && <View style={{ marginTop: list.descriptionGap }}>{content(children)}</View>}
    </View>
    {/* A value at the row's end reads one step below the title and keeps the row's end line when it wraps. */}
    {hasContent(trailing) && <View style={{ maxWidth: "35%", alignItems: "flex-end", justifyContent: "center", ...(description ? { alignSelf: "flex-start", minHeight: band } : {}) }}>{content(trailing, { ...trailingType, color: colors.textSecondary, textAlign: "right" })}</View>}
    {endMark === "spinner" ? <View style={end(endIcon)}><KjunIcon name="loader-2" spin size={endIcon} color={colors.textTertiary} /></View>
      : endMark === "mark" ? <View style={end(list.markSize)}><ChoiceMark checkbox={kind === "checkbox"} on={!!selected} /></View>
      : endMark === "check" && <View style={description ? end(endIcon) : undefined}><KjunIcon name="check" size={endIcon} color={colors.brand} /></View>}
    {/* A switch row is one switch control: the drawn switch is decoration and the row carries role and state. */}
    {toggle && <View pointerEvents="none" accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
      // The row is the touch target, so the drawn switch keeps only its own height, like Web.
      style={{ height: switchHeight, justifyContent: "center", ...end(switchHeight) }}><SwitchMark on={!!checked} busy={busy} /></View>}
    {chevron && endMark !== "spinner" && <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={description ? end(endIcon) : undefined}><KjunIcon name="chevron-right" size={endIcon} color={colors.textTertiary} /></View>}
  </>;
  const style = { flex: 1, minWidth: 0, minHeight, flexDirection: "row" as const, alignItems: "center" as const, gap, paddingVertical: paddingY, paddingHorizontal: paddingX };
  const pressable = kind !== "static";
  // Like Web, the whole row (its actions too) takes the hover and pressed fill, and an open section's chosen row its own.
  const [hovered, setHovered] = useState(false), [pressed, setPressed] = useState(false);
  // Like Web, the chosen row keeps its fill when disabled.
  const chosen = open && choiceRow && selected ? colors.selectedBg : undefined;
  // A busy row ignores presses, so like Web it takes no hover or pressed fill.
  const fill = disabled || busy || !pressable ? chosen : pressed ? colors.active : hovered ? colors.hover : chosen;
  // The default name reads the title, a text badge, the description and a text value at the row's end, like the web
  // row's name (title, badge and value) and description.
  const text = (node: ReactNode) => typeof node === "string" || typeof node === "number" ? String(node) : undefined;
  const spoken = [title, text(badge), description, text(trailing)].filter(Boolean).join(", ");
  // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
  return <View role={selection.mode === "single" ? undefined : "listitem"} style={{ flexDirection: "row", alignItems: "center", gap, backgroundColor: fill,
    ...(open ? { marginHorizontal: list.open.rowInset, borderRadius: list.open.rowRadius } : {}) }}>
    {/* Rows run edge to edge, so like Web the keyboard ring draws inside them. */}
    {pressable ? <Pressable focusRingInset focusRingRadius={open ? list.open.rowRadius : ringRadius} {...(Platform.OS === "web" && kind === "link" && !disabled && !busy ? { href } : {})}
      accessibilityRole={toggle ? "switch" : choiceRow || kind === "link" ? kind : "button"}
      accessibilityLabel={ariaLabel ?? spoken} disabled={disabled}
      accessibilityState={{ disabled, busy, ...(toggle ? { checked: !!checked } : {}), ...(choiceRow ? { checked: !!selected } : {}) }}
      onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
      // A busy row ignores presses but keeps its focus and role, so it stays reachable and reads as busy.
      onPress={(event) => { if (busy) return; if (toggle) onCheckedChange?.(!checked); onPress?.(event); }}
      style={{ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{parts}</Pressable>
      // Like Web: a static row dims as a whole when disabled, so nothing in it reads as available.
      : <View style={{ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{parts}</View>}
    {/* A disabled row disables its actions too, so the row never reads as partly available. */}
    {(hasContent(actions) || movable) && <View pointerEvents={disabled ? "none" : "auto"} {...(disabled && Platform.OS === "web" ? { inert: true } : {})} style={{ maxWidth: "45%", flexDirection: "row", flexWrap: "wrap", gap: list.actionsGap, paddingRight: m.actionsPadding,
      // Like Web: with a description, actions center on the title and first description line instead of a long row's middle.
      ...(description ? { alignSelf: "flex-start", alignItems: "center", alignContent: "center", minHeight: band, marginTop: paddingY } : {}), opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{content(actions)}{movable && <ReorderControls value={value!} name={title} />}</View>}
    {divider && <Divider inset={paddingX + (front ? column + gap : 0)} />}
  </View>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children?: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). An open section draws none; giving it true warns in development. */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). An open section has no card. */
  radius?: CardRadius;
  /** "open" puts the rows on the page with no card or dividers: larger titles, icons on rounded squares, and a filled mark for the chosen row (default "default", or "open" in an open KjunListGroup). */
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
  /** Why moving is off, shown under the rows. */
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
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider: dividerProp, density = "default", radius, titleVariant, headingLevel = 3, empty, footer, loading, selectionMode = "none", value, onValueChange, variant, reorderable = false, order, onOrderChange, onReorder, reorderDisabled = false, reorderDisabledText }: KjunListSectionProps) {
  const { colors } = useKjunStyles();
  const reorder = useReorder({ reorderable, order, disabled: reorderDisabled, onOrderChange, onReorder });
  // Like Web: a rounded section is a card of rows only; its title, actions and footer stay on the page around it.
  const { open, corner, bare, outside } = listSectionShape({ radius, group: useContext(ListGroupContext), variant, title, description, titleVariant });
  const divider = dividerProp ?? true;
  useEffect(() => warnListSectionProps({ open, divider: dividerProp }), [open, dividerProp]);
  useEffect(() => warnListSelection({ mode: selectionMode, value, handled: !!onValueChange }), [selectionMode, Array.isArray(value), value === undefined, !!onValueChange]);
  const radiusValue = corner === "none" ? undefined : tokens.card.radii[corner];
  const choice = selectionMode === "single", [group, setGroup] = useState<View | null>(null), id = "kjun-" + useId().replace(/[^\w-]/g, "");
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
  const compact = density === "compact";
  // Memoized, so a section drawing again for its own state (its measured heading actions or list) does not hand every
  // row a new context and redraw it.
  const shape = useMemo(() => ({ open, compact }), [open, compact]);
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
    return { divider: divider && !last && !open, selection, ringRadius, column: shared };
  }), [count, divider, open, selection, radiusValue, shared]);
  // Each row keeps its own key, so reordering or filtering rows moves them instead of remounting them.
  // Loading content announces itself (a skeleton's loadingText is a status), so the wrapper only places it.
  const rows = hasContent(loading) ? <View>{content(loading)}</View>
    : items.length
    ? <View ref={setGroup} role={choice ? "radiogroup" : "list"} accessibilityLabel={ariaLabel || title}
        {...(Platform.OS === "web" && describedBy ? { "aria-describedby": describedBy } : {})}>
      <ReorderContext.Provider value={reorder.context}>{items.map((row, i) => <ListRowContext.Provider key={row.key ?? i} value={contexts[i]}>{row}</ListRowContext.Provider>)}</ReorderContext.Provider>
    </View>
    : hasContent(empty) ? <View style={{ minHeight: compact ? list.compactMinimumHeight : list.minimumHeight, justifyContent: "center", paddingHorizontal: list.padding }}><ListEmptyContext.Provider value={density}>{content(empty)}</ListEmptyContext.Provider></View> : null;
  const card = { backgroundColor: surface ? colors.surface : "transparent", ...(radiusValue === undefined ? {} : { borderRadius: radiusValue, overflow: "hidden" as const }) };
  return <ListShapeContext.Provider value={shape}><View style={{ minWidth: 0, ...(outside ? {} : card) }}>
    {!!(title || description || hasContent(actions)) && <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.gap, padding: list.padding,
      // A title without a description is a small group header that sits close to its rows; outside a card it starts at the top.
      // Like Web: 8px under a heading (4px under a small group header), so it reads with its rows.
      paddingBottom: bare ? list.bareHeadingPaddingBottom : list.headingPaddingBottom, ...(outside ? { paddingTop: overflow, paddingBottom: list.outsideLabelGap } : {}) }}>
      <View style={{ flex: 1 }}>{!!title && <KText {...wordProps} accessibilityRole="header" {...(Platform.OS === "web" ? { "aria-level": headingLevel } : {})} style={{ ...(bare ? { ...typeStyle('controlSmall'), color: colors.textSecondary } : typeStyle('cardTitle')), ...words }}>{title}</KText>}{!!description && <KText {...wordProps} nativeID={id + "-description"} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'), ...words }}>{description}</KText>}</View>
      {hasContent(actions) && <View style={{ flexShrink: 0, height: titleLine, marginBottom: overflow, justifyContent: "center", marginEnd: ghostInset(actions) }}>
        <View onLayout={event => setActionHeight(event.nativeEvent.layout.height)} style={{ flexDirection: "row", alignItems: "center", gap: list.actionsGap }}>{content(actions)}</View>
      </View>}
    </View>}
    {outside ? <View style={card}>{rows}</View> : rows}
    {reorderable && reorderDisabled && !!reorderDisabledText && <View style={{ paddingTop: list.footerGap, paddingHorizontal: list.padding, paddingBottom: outside || hasFooter ? 0 : list.padding }}><KText {...wordProps} style={{ ...typeStyle("caption"), color: colors.textTertiary, ...words }}>{reorderDisabledText}</KText></View>}
    {reorder.status}
    {hasFooter && <View nativeID={id + "-footer"} style={{ paddingTop: list.footerGap, paddingHorizontal: list.padding, paddingBottom: outside ? 0 : list.padding }}>{typeof footer === "string" ? <KText {...wordProps} style={{ ...typeStyle("caption"), color: colors.textTertiary, ...words }}>{String(footer)}</KText> : content(footer, { ...typeStyle("caption"), color: colors.textTertiary })}</View>}
  </View></ListShapeContext.Provider>;
}
export interface KjunListGroupProps {
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart; "open" puts every section's rows on the page with no card or dividers, 20px apart. */
  variant?: ListGroupVariant;
  children: ReactNode;
}
/** Like Web: stacks KjunListSections with one spacing and corner rule. */
export function KjunListGroup({ variant = "inset", children }: KjunListGroupProps) {
  return <ListGroupContext.Provider value={variant}><View style={{ minWidth: 0, gap: variant === "flush" ? list.flushGroupGap : variant === "open" ? list.open.groupGap : list.groupGap }}>{content(children)}</View></ListGroupContext.Provider>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  const { divider, selection } = useContext(ListRowContext), { open, compact } = useContext(ListShapeContext);
  return <View role={selection.mode === "single" ? undefined : "listitem"} style={{ padding: tokens.extensions.list.padding, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}),
    ...(open ? { marginHorizontal: list.open.rowInset, paddingHorizontal: list.open.paddingX } : {}), minWidth: 0 }}>{content(children)}{divider && <Divider inset={list.padding} />}</View>;
}
