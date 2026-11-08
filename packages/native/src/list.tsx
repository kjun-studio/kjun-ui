import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { Children, Fragment, cloneElement, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useState, type ReactElement, type ReactNode } from "react";
import { listRowChoice, listRowKind, listSectionShape, warnListRowProps, type ListChoiceValue, type ListSelection, type ListSelectionMode } from "../../../shared/package-runtime/list-row";
import { View, Platform, type GestureResponderEvent, type TextStyle } from "react-native";
import { AccessiblePressable as Pressable, type FocusRingRadius } from "./a11y";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { KText, content } from "./internal";
import { KjunButton, KjunIcon } from "./button";
import { ListEmptyContext } from "./display-primitives";
import { useKjunStyles } from "./provider";

// A section tells its rows whether to draw a divider (never after the last, like Web's :last-child), how dense they are,
// the section's selection (a single-choice list is a radiogroup), and in a rounded card which of the card's corners the
// row's ring follows.
const ListRowContext = createContext<{ divider: boolean; compact: boolean; selection: ListSelection; ringRadius?: FocusRingRadius }>({ divider: true, compact: false, selection: { mode: "none" } });
export type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
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
  leading?: ReactNode; trailing?: ReactNode; actions?: ReactNode;
  /** Web link address (Native Web only); on a device pass onPress and navigate with the app's router. */
  href?: string;
  disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  /** One choice in a single-choice list: true draws a check at the end. A pressable row given it (true or false) reads as a radio. */
  selected?: boolean;
  /** Makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
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
export function KjunListRow({ title, description, icon, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, selected: ownSelected, checked, onCheckedChange, value, onPress: ownPress, ariaLabel, children, titleLines, descriptionLines }: KjunListRowProps) {
  const { colors } = useKjunStyles(), { divider, compact, selection, ringRadius } = useContext(ListRowContext);
  const choice = listRowChoice(selection, value, ownSelected), selected = choice.selected;
  const onPress = choice.press ? (event: GestureResponderEvent) => { choice.press(); ownPress?.(event); } : ownPress;
  const kind = listRowKind({ checked, selected, href, pressable: !!(onPress || href), mode: selection.mode }), toggle = kind === "switch";
  const deviceLink = Platform.OS !== "web" && !!href && !onPress;
  const looseChoice = (kind === "radio" || kind === "checkbox") && selection.mode === "none";
  useEffect(() => warnListRowProps({ checked, selected, href, chevron, deviceLink, looseChoice }), [checked !== undefined, selected !== undefined, !!href, chevron, deviceLink, looseChoice]);
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
  // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
  return <View role={selection.mode === "single" ? undefined : "listitem"} style={{ flexDirection: "row", alignItems: "center", gap: list.gap }}>
    {/* Rows run edge to edge, so like Web the keyboard ring draws inside them. */}
    {pressable ? <Pressable focusRingInset focusRingRadius={ringRadius} {...(Platform.OS === "web" && kind === "link" && !disabled ? { href } : {})}
      accessibilityRole={toggle ? "switch" : kind === "radio" || kind === "checkbox" || kind === "link" ? kind : "button"}
      accessibilityLabel={ariaLabel ?? spoken} disabled={disabled}
      accessibilityState={{ disabled, ...(toggle ? { checked: !!checked } : {}), ...(kind === "radio" || kind === "checkbox" ? { checked: !!selected } : {}) }}
      onPress={(event) => { if (toggle) onCheckedChange?.(!checked); onPress?.(event); }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1, backgroundColor: disabled ? "transparent" : pressed ? colors.active : hovered ? colors.hover : "transparent" })}>{parts}</Pressable>
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
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). */
  radius?: CardRadius;
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
const ListGroupContext = createContext<"inset" | "flush" | null>(null);
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default", radius, titleVariant, headingLevel = 3, empty, footer, loading, selectionMode = "none", value, onValueChange }: KjunListSectionProps) {
  const { colors } = useKjunStyles();
  // Like Web: a rounded section is a card of rows only; its title, actions and footer stay on the page around it.
  const { corner, bare, outside } = listSectionShape({ radius, group: useContext(ListGroupContext), title, description, titleVariant });
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
  // Each row keeps its own key, so reordering or filtering rows moves them instead of remounting them.
  // Loading content announces itself (a skeleton's loadingText is a status), so the wrapper only places it.
  const rows = hasContent(loading) ? <View>{content(loading)}</View>
    : items.length
    ? <View ref={setGroup} role={choice ? "radiogroup" : "list"} accessibilityLabel={ariaLabel || title}
        {...(Platform.OS === "web" && describedBy ? { "aria-describedby": describedBy } : {})}>
      {items.map((row, i) => {
        const first = i === 0, last = i === items.length - 1;
        const ringRadius = radiusValue === undefined ? undefined : first && last ? radiusValue : first ? { top: radiusValue } : last ? { bottom: radiusValue } : undefined;
        return <ListRowContext.Provider key={row.key ?? i} value={{ divider: divider && !last, compact, selection: { mode: selectionMode, value, onValueChange }, ringRadius }}>{row}</ListRowContext.Provider>;
      })}
    </View>
    : hasContent(empty) ? <View style={{ minHeight: compact ? list.compactMinimumHeight : list.minimumHeight, justifyContent: "center", paddingHorizontal: list.padding }}><ListEmptyContext.Provider value={density}>{content(empty)}</ListEmptyContext.Provider></View> : null;
  const card = { backgroundColor: surface ? colors.surface : "transparent", ...(radiusValue === undefined ? {} : { borderRadius: radiusValue, overflow: "hidden" as const }) };
  return <View style={{ minWidth: 0, ...(outside ? {} : card) }}>
    {!!(title || description || hasContent(actions)) && <View style={{ flexDirection: "row", alignItems: "flex-start", gap: list.gap, padding: list.padding,
      // A title without a description is a small group header that sits close to its rows; outside a card it starts at the top.
      ...(bare ? { paddingBottom: list.bareHeadingPaddingBottom } : {}), ...(outside ? { paddingTop: overflow, paddingBottom: list.outsideLabelGap } : {}) }}>
      <View style={{ flex: 1 }}>{!!title && <KText {...wordProps} accessibilityRole="header" {...(Platform.OS === "web" ? { "aria-level": headingLevel } : {})} style={{ ...(bare ? { ...typeStyle('controlSmall'), color: colors.textSecondary } : typeStyle('cardTitle')), ...words }}>{title}</KText>}{!!description && <KText {...wordProps} nativeID={id + "-description"} style={{ marginTop: list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'), ...words }}>{description}</KText>}</View>
      {hasContent(actions) && <View style={{ flexShrink: 0, height: titleLine, marginBottom: overflow, justifyContent: "center", marginEnd: ghostInset(actions) }}>
        <View onLayout={event => setActionHeight(event.nativeEvent.layout.height)} style={{ flexDirection: "row", alignItems: "center", gap: list.actionsGap }}>{content(actions)}</View>
      </View>}
    </View>}
    {outside ? <View style={card}>{rows}</View> : rows}
    {hasFooter && <View nativeID={id + "-footer"} style={{ paddingTop: list.footerGap, paddingHorizontal: list.padding, paddingBottom: outside ? 0 : list.padding }}>{typeof footer === "string" ? <KText {...wordProps} style={{ ...typeStyle("caption"), color: colors.textTertiary, ...words }}>{String(footer)}</KText> : content(footer, { ...typeStyle("caption"), color: colors.textTertiary })}</View>}
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
  const { divider, compact, selection } = useContext(ListRowContext);
  return <View role={selection.mode === "single" ? undefined : "listitem"} style={{ padding: tokens.extensions.list.padding, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}),
    minWidth: 0 }}>{content(children)}{divider && <Divider inset={list.padding} />}</View>;
}
