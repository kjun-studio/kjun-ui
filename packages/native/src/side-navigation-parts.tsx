import type { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { navigationBadge, type NavigationBadge } from "../../../shared/package-runtime/navigation-badge";
import { isPlainNavigationClick, isSideParent, sideFlyoutKey, sideNavigationInitial, sideNavigationLinkName, sideNavigationOpensElsewhere, sideNavigationShownLabel,
  sideNavigationToggleName, sideParentState, sideSectionEmpty, sideSectionRows, toggleSideParent, type SideNavigationAction, type SideNavigationBadgeTone, type SideNavigationDestination as WebDestination,
  type SideNavigationItem as Item, type SideNavigationParent as Parent, type SideNavigationSection, type SideNavigationSubParent as SubParent } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import type { ReactElement, ReactNode } from "react";
import { Animated, I18nManager, Platform, View, type ColorValue, type GestureResponderEvent, type TextStyle, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { NavigationBadgeMark } from "./app-navigation";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { KText } from "./internal";
import { KjunPopover, KjunTooltip } from "./popover";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

/** A destination: the bottom navigation's shape. `href` and `target` act on Native Web only; on a device navigate in onNavigate. */
export type SideNavigationDestination = Omit<WebDestination, "href"> & { href?: string };
/** A parent under a parent: a child row that opens its destinations one step further in. */
export type SideNavigationSubParent = SubParent<SideNavigationDestination>;
/** A parent that opens up to two levels under it. It is a toggle and does not navigate itself. */
export type SideNavigationParent = Parent<SideNavigationDestination>;
export type SideNavigationItem = Item<SideNavigationDestination>;
export type Navigate = (key: string, event: GestureResponderEvent) => void;
export type PressState = { pressed: boolean; hovered?: boolean };
export type Mode = { collapsed: boolean; labelled: boolean; flyout?: boolean; flat?: boolean };
// A flyout shows rows as a full menu does; a parent's flyout starts its children at the edge.
export const FLYOUT: Mode = { collapsed: false, labelled: false, flyout: true }, FLAT: Mode = { ...FLYOUT, flat: true };
type Level = "page" | "within" | undefined;
type Depth = 0 | 1 | 2;
type Tone = SideNavigationBadgeTone | null | undefined;

/** A badge in its tone. Alert is the shared navigation mark; neutral is drawn here with the same geometry as a quiet grey
 * pill (or a grey dot), so a plain total never competes with what needs attention. */
export function SideBadge({ badge, tone, ring, iconSize }: { badge: NavigationBadge | undefined; tone?: Tone; ring?: ColorValue; iconSize?: number }) {
  const { colors } = useKjunStyles();
  if (tone !== "neutral") return <NavigationBadgeMark badge={badge} ring={ring} iconSize={iconSize} />;
  const geometry = tokens.extensions.navigationBadge, width = ring === undefined ? 0 : tokens.border.controlWidth, mark = navigationBadge(badge);
  if (!mark) return null;
  const size = mark.dot ? geometry.dotSize : geometry.minimumSize;
  return <View pointerEvents="none" aria-hidden={true} style={{
    ...(iconSize !== undefined ? { position: "absolute" as const, top: (mark.dot ? 0 : -geometry.offset) - width, start: iconSize - (mark.dot ? geometry.dotOverlap : geometry.overlap) - width }
      : { alignSelf: mark.dot ? "flex-start" as const : "center" as const }),
    minWidth: size + 2 * width, minHeight: size + 2 * width, paddingHorizontal: mark.dot ? 0 : geometry.paddingX, borderRadius: geometry.radius,
    borderWidth: width, borderColor: ring, backgroundColor: mark.dot ? colors.textTertiary : colors.tertiary, alignItems: "center", justifyContent: "center",
  }}>{!mark.dot && <KText style={{ ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, fontVariant: ["tabular-nums"], color: colors.textSecondary }}>{mark.text}</KText>}</View>;
}

/** Icons only: a parent or group that opens something carries a small chevron on its icon's lower end corner, so it never
 * looks like a link. The disc takes the fill under it, like a badge's ring; the chevron turns over right to left. */
export function OpensMarker({ ring }: { ring: ColorValue }) {
  const { colors } = useKjunStyles(), geometry = tokens.extensions.sideNavigation, size = geometry.opensMarkerSize;
  return <View pointerEvents="none" aria-hidden={true} importantForAccessibility="no-hide-descendants" style={{ position: "absolute", end: -(geometry.opensMarkerOffset + size / 2),
    bottom: -geometry.opensMarkerOffset, width: size, height: size, borderRadius: size / 2, backgroundColor: ring, alignItems: "center", justifyContent: "center" }}>
    <View style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}><KjunIcon name="chevron-right" size={size} color={colors.textTertiary} /></View>
  </View>;
}

export interface SideRowsContext {
  m: ReturnType<typeof useKjunMessages>; styles: ReturnType<typeof useKjunStyles>; value: string | null; collapsed: boolean; labelled: boolean; flyoutMode: boolean;
  density: "default" | "compact"; fadeIn: Animated.Value; open: readonly string[]; setParent: (key: string, next: boolean) => void; reveal: (key: string) => void;
  flyout: string | null; setFlyout: (key: string | null) => void; allShown: readonly string[]; updateShowAll: (next: string[]) => void;
  onNavigate?: Navigate; onReselect?: Navigate; onAction?: (key: string, action: string, event: GestureResponderEvent) => void;
}

/** The pieces of KjunSideNavigation's rows: geometry, fills and inks, and the builders of destinations, parents and a
 * group's rows. Rebuilt on each render from the navigation's state. */
export function sideNavigationRows(ctx: SideRowsContext) {
  const { m, styles: { colors, fontFamily, numericFontFamily }, value, open, collapsed, labelled, fadeIn } = ctx, geometry = tokens.extensions.sideNavigation;
  const base: Mode = { collapsed, labelled };
  const railWidth = labelled ? geometry.railItemWidth : geometry.paddingX * 2 + geometry.iconSize;
  // On a device every press is a touch, so rows take Web's touch heights (48, children, grandchildren and group titles 44).
  // Native Web keeps Web's pointer heights (40, children 36, grandchildren and group titles 32); there the touch target
  // reaches 44 above and below. density="compact" shortens rows under a pointer only, so a device keeps its touch heights.
  const touch = Platform.OS !== "web", compact = !touch && ctx.density === "compact";
  const itemHeight = touch ? geometry.touchItemHeight : compact ? geometry.compactItemHeight : geometry.itemHeight;
  const childHeight = touch ? geometry.touchChildHeight : compact ? geometry.compactChildHeight : geometry.childHeight;
  const grandchildHeight = touch ? geometry.touchChildHeight : compact ? geometry.compactChildHeight : geometry.grandchildHeight;
  const groupHeight = touch ? geometry.touchChildHeight : geometry.groupHeight;
  const heightOf = (depth: Depth) => depth === 2 ? grandchildHeight : depth ? childHeight : itemHeight;
  const slop = (height: number) => { const reach = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2); return { top: reach, bottom: reach }; };
  // A child starts where its parent's label starts and a grandchild one indent further in; in a parent's flyout they start
  // at the edge (and one indent in).
  const box = (mode: Mode, height: number, depth: Depth, end = 0): ViewStyle => mode.labelled ? { width: geometry.railItemWidth, alignItems: "center", justifyContent: "center",
    gap: geometry.railLabelGap, paddingVertical: geometry.railPaddingY, paddingHorizontal: geometry.railPaddingX, borderRadius: geometry.radius } : { height, ...(mode.collapsed ? { width: railWidth } : {}),
    flexDirection: "row", alignItems: "center", gap: geometry.gap, borderRadius: geometry.radius, paddingEnd: geometry.paddingX + end,
    paddingStart: geometry.paddingX + (depth && !mode.flat ? geometry.iconSize + geometry.gap : 0) + (depth === 2 ? geometry.grandchildIndent : 0) };
  // Hover is half the app's hover fill and leaves the text as it is, so it never reads as a stronger mark than the current page.
  // Only the current page takes the selection fill. A closed parent or group over it takes none in a full menu (its name
  // turns full weight instead) and half of it while only icons show, where there is no name to strengthen.
  const soft = (color: ColorValue, amount: number) => (typeof color === "string" && tintColor(color, amount)) || color;
  const hover = soft(colors.hover, tokens.states.opacity.hoverSoft), withinFill = soft(colors.selectedBg, tokens.states.opacity.selectedWithin);
  const fill = (mode: Mode, level: Level, disabled: boolean | undefined, { pressed, hovered }: PressState): ColorValue =>
    level === "page" ? colors.selectedBg : level === "within" && mode.collapsed ? withinFill : disabled ? "transparent" : pressed ? colors.active : hovered ? hover : "transparent";
  // Icons are a step lighter than names, and join them in full ink on the current page, a row over it and under a press.
  const ink = (lit: boolean) => lit ? colors.text : colors.textSecondary;
  // Names are in full ink; under a labelled rail's icons they stay a step lighter until lit.
  const nameInk = (mode: Mode, lit: boolean) => mode.labelled ? ink(lit) : colors.text;
  const strongWeight = String(geometry.selected.weight) as TextStyle["fontWeight"];
  const weight = (strong: boolean) => strong ? strongWeight : typeStyle("body").fontWeight;
  const label = (mode: Mode, text: string, strong: boolean, color: ColorValue) => mode.labelled ? <KText numberOfLines={1} ellipsizeMode="tail"
    style={{ ...typeStyle("caption"), alignSelf: "stretch", textAlign: "center", fontWeight: weight(strong), color }}>{text}</KText>
    : !mode.collapsed && <KText numberOfLines={1} ellipsizeMode="tail" style={{ ...typeStyle("control"), flex: 1, minWidth: 0, fontWeight: weight(strong), color }}>{text}</KText>;
  // In a full row the name and the trailing marks fade in together after widening.
  const tail = (mode: Mode, node: ReactNode) => mode.collapsed ? node
    : <Animated.View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: geometry.gap, opacity: fadeIn }}>{node}</Animated.View>;
  // The icon box also holds the initial of a row without an icon, and the badge and opens marks (on its corners) while only icons show.
  const glyph = (mode: Mode, icon: string | undefined, text: string, filled: boolean, color: ColorValue, mark?: ReactNode, under?: ColorValue) => {
    if (!icon && !mode.collapsed) return false;
    const inner = <View style={{ width: geometry.iconSize, height: geometry.iconSize, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon ? <KjunIcon name={icon} filled={filled} size={geometry.iconSize} color={color} />
        : <KText style={{ ...typeStyle("control"), color }}>{sideNavigationInitial(text)}</KText>}
      {mode.collapsed && mark}
    </View>;
    return mode.labelled ? <View style={{ width: geometry.railIndicatorWidth, height: geometry.railIndicatorHeight, borderRadius: geometry.railIndicatorHeight / 2,
      alignItems: "center", justifyContent: "center", backgroundColor: under }}>{inner}</View> : inner;
  };
  // The row's fill, which a labelled rail paints on the indicator instead.
  const rowFill = (mode: Mode, under: ColorValue) => mode.labelled ? "transparent" : under;
  // At the end of a row the badge sits in the row's middle, as on Web (the shared mark lifts a dot to the top of a text line).
  const endMark = (badge: NavigationBadge | undefined, tone: Tone) => navigationBadge(badge) && <View style={{ alignSelf: "center" }}><SideBadge badge={badge} tone={tone} /></View>;
  // At the end of a compact row a count is a quiet number; dots and the default density keep the badge.
  const quiet = { ...typeStyle("caption"), fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums" as const], fontWeight: typeStyle("body").fontWeight, color: colors.textTertiary };
  const trailing = (badge: NavigationBadge | undefined, tone: Tone) => {
    const mark = navigationBadge(badge);
    return compact && mark && !mark.dot ? <KText aria-hidden={true} importantForAccessibility="no" style={quiet}>{mark.text}</KText> : endMark(badge, tone);
  };
  // While collapsed the corner marks overlap the icon, so their ring takes the row's fill (the surface under a clear row).
  const ring = (under: ColorValue) => under === "transparent" ? colors.surface : under;
  const corner = (badge: NavigationBadge | undefined, tone: Tone, under: ColorValue) => <SideBadge badge={badge} tone={tone} ring={ring(under)} iconSize={geometry.iconSize} />;
  const opens = (under: ColorValue) => <OpensMarker ring={ring(under)} />;
  // While only icons show, the name is a tooltip; under a labelled rail's icons only a shortened name needs one.
  const named = (mode: Mode, full: string, shown: string, row: ReactElement) =>
    mode.collapsed && (!mode.labelled || shown !== full) ? <KjunTooltip content={full} placement="right">{row}</KjunTooltip> : row;
  const chevron = (shown: boolean, size: number, color: ColorValue) =>
    <View style={shown ? { transform: [{ rotate: "180deg" }] } : undefined}><KjunIcon name="chevron-down" size={size} color={color} /></View>;
  // Actions: small buttons at the end of a row or a title, always shown (touch). They sit beside the row, not inside it.
  const actionsWidth = (count: number) => count * (geometry.actionSize + geometry.actionGap);
  const actionButtons = (key: string, actions: readonly SideNavigationAction[], place?: ViewStyle) => <View style={{ position: "absolute", top: 0, bottom: 0,
    end: geometry.paddingX - (geometry.actionSize - geometry.actionIconSize) / 2, flexDirection: "row", alignItems: "center", gap: geometry.actionGap, ...place }}>
    {actions.map(action => <KjunTooltip key={action.key} content={action.label}>
      <Pressable focusRingInset hitSlop={slop(geometry.actionSize)} accessibilityRole="button" accessibilityLabel={action.label} onPress={(event: GestureResponderEvent) => ctx.onAction?.(key, action.key, event)}
        style={(state: PressState) => ({ width: geometry.actionSize, height: geometry.actionSize, alignItems: "center", justifyContent: "center", borderRadius: geometry.actionRadius,
          backgroundColor: fill(base, undefined, false, state) })}>
        {(state: PressState) => <KjunIcon name={action.icon} size={geometry.actionIconSize} color={ink(state.pressed)} />}
      </Pressable>
    </KjunTooltip>)}
  </View>;
  // A panel beside a collapsed icon, holding what the icon stands for. It leaves the rest of the screen usable.
  const flyoutPanel = (key: string, title: string, trigger: ReactElement, body: ReactNode) => <KjunPopover open={ctx.flyout === key} onOpenChange={next => ctx.setFlyout(next ? key : null)}
    modal={false} placement="right" header={title} focusOnOpen trigger={trigger}><View style={{ gap: geometry.itemGap }}>{body}</View></KjunPopover>;
  const disabledOpacity = (disabled?: boolean) => disabled ? tokens.states.opacity.disabled : 1;

  const link = (mode: Mode, item: SideNavigationDestination, depth: Depth, end: number) => {
    const selected = item.key === value, height = heightOf(depth), elsewhere = sideNavigationOpensElsewhere(item), shown = sideNavigationShownLabel(item, mode.labelled);
    const under = (state: PressState) => fill(mode, selected ? "page" : undefined, item.disabled, state);
    // Disabled stays on the Pressable: React Native Web reads it for aria-disabled and the tab order.
    return <Pressable focusRingInset disabled={item.disabled} hitSlop={mode.labelled ? undefined : slop(height)} accessibilityRole="link"
      accessibilityLabel={sideNavigationLinkName(item, m)} accessibilityState={{ disabled: !!item.disabled, selected }}
      {...(Platform.OS === "web" ? { "aria-current": selected ? "page" : undefined, ...(item.href && !item.disabled ? { href: item.href, hrefAttrs: { target: item.target, rel: elsewhere ? "noopener noreferrer" : undefined } } : {}) } : {})}
      onPress={(event: GestureResponderEvent) => {
        if (item.disabled) return;
        // On Native Web the browser handles a new-tab click and a target link; on a device the app opens every destination.
        if (Platform.OS === "web" && (elsewhere || !isPlainNavigationClick(event.nativeEvent as never))) return;
        ctx.onNavigate?.(item.key, event); if (selected) ctx.onReselect?.(item.key, event);
        if (mode.flyout) ctx.setFlyout(null);
      }}
      style={(state: PressState) => ({ ...box(mode, height, depth, end), backgroundColor: rowFill(mode, under(state)), opacity: disabledOpacity(item.disabled) })}>
      {(state: PressState) => { const lit = selected || (!item.disabled && state.pressed); return <>
        {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
            Beside a labelled rail's wider indicator the number fits. */}
        {!depth && glyph(mode, item.icon, item.label, selected, ink(lit), corner(mode.labelled ? item.badge : navigationBadge(item.badge) ? true : undefined, item.badgeTone, under(state)), under(state))}
        {tail(mode, <>
          {label(mode, shown, selected, nameInk(mode, lit))}
          {!mode.collapsed && trailing(item.badge, item.badgeTone)}
          {!mode.collapsed && elsewhere && <KjunIcon name="external-link" size={geometry.chevronSize} color={colors.textTertiary} />}
        </>)}
      </>; }}
    </Pressable>;
  };
  // A destination's row: the link, and its actions overlaid at its end (a button cannot sit inside a link).
  const destination = (mode: Mode, item: SideNavigationDestination, depth: Depth = 0) => {
    const actions = !mode.collapsed && item.actions?.length ? item.actions : undefined;
    return <View key={item.key} style={{ minWidth: 0 }}>
      {named(mode, item.label, sideNavigationShownLabel(item, mode.labelled), link(mode, item, depth, actions ? actionsWidth(actions.length) : 0))}
      {actions ? actionButtons(item.key, actions) : null}
    </View>;
  };
  // A parent inside a parent: a child row with a chevron that opens its destinations one step further in, in a full menu
  // and in a flyout alike.
  const subParent = (mode: Mode, item: SideNavigationSubParent) => {
    const { shown, within, dot, tone } = sideParentState(item, { open, collapsed: false, value });
    return <View key={item.key} style={{ gap: geometry.itemGap }}>
      <Pressable focusRingInset disabled={item.disabled} hitSlop={slop(childHeight)} accessibilityRole="button" accessibilityLabel={sideNavigationToggleName(item.label, dot, m)}
        accessibilityState={{ disabled: !!item.disabled, expanded: shown }} onPress={item.disabled ? undefined : () => ctx.setParent(item.key, !shown)}
        style={(state: PressState) => ({ ...box(mode, childHeight, 1), backgroundColor: fill(mode, undefined, item.disabled, state), opacity: disabledOpacity(item.disabled) })}>
        {tail(mode, <>
          {label(mode, item.label, within, colors.text)}
          {dot && endMark(true, tone)}
          {chevron(shown, geometry.chevronSize, colors.textTertiary)}
        </>)}
      </Pressable>
      <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{item.children.map(child => destination(mode, child, 2))}</View></Collapse>
    </View>;
  };
  const childRow = (mode: Mode, child: SideNavigationParent["children"][number]) => isSideParent(child) ? subParent(mode, child) : destination(mode, child, 1);
  const parent = (mode: Mode, item: SideNavigationParent) => {
    const flies = mode.collapsed && ctx.flyoutMode && !item.disabled, shown = sideNavigationShownLabel(item, mode.labelled);
    const state = sideParentState(item, { open, collapsed: mode.collapsed, value });
    // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
    const under = (press: PressState) => fill(mode, state.within ? "within" : undefined, item.disabled, press);
    // Disabled stays on the Pressable (aria-disabled and the tab order on Native Web); a device shows no tooltip either way.
    const button = <Pressable focusRingInset disabled={item.disabled} hitSlop={mode.labelled ? undefined : slop(itemHeight)} accessibilityRole="button"
      accessibilityLabel={sideNavigationToggleName(item.label, state.dot, m)} accessibilityState={{ disabled: !!item.disabled, ...(flies ? {} : { expanded: state.shown }) }}
      onPress={flies || item.disabled ? undefined : () => mode.collapsed ? ctx.reveal(item.key) : ctx.setParent(item.key, !state.shown)}
      style={(press: PressState) => ({ ...box(mode, itemHeight, 0), backgroundColor: rowFill(mode, under(press)), opacity: disabledOpacity(item.disabled) })}>
      {(press: PressState) => { const lit = state.within || (!item.disabled && press.pressed); return <>
        {glyph(mode, item.icon, item.label, false, ink(lit), <>{state.dot && corner(true, state.tone, under(press))}{!item.disabled && opens(under(press))}</>, under(press))}
        {tail(mode, <>
          {label(mode, shown, state.within, nameInk(mode, lit))}
          {!mode.collapsed && state.dot && endMark(true, state.tone)}
          {!mode.collapsed && chevron(state.shown, geometry.chevronSize, colors.textTertiary)}
        </>)}
      </>; }}
    </Pressable>;
    return <View key={item.key} style={{ gap: geometry.itemGap }}>
      {flies ? flyoutPanel(sideFlyoutKey("parent", item.key), item.label, named(mode, item.label, shown, button), item.children.map(child => childRow(FLAT, child)))
        : named(mode, item.label, shown, button)}
      {!flies && <Collapse open={state.shown}><View style={{ gap: geometry.itemGap }}>{item.children.map(child => childRow(mode, child))}</View></Collapse>}
    </View>;
  };
  const row = (mode: Mode, item: SideNavigationItem) => isSideParent(item) ? parent(mode, item) : destination(mode, item);
  // A group's rows under its limit, and the row that shows the rest or folds them again. Icons only, every row shows.
  // An empty group's line in place of its rows: quiet caption text where a child row's name starts (at the edge in a
  // flyout), a child row tall, never a link. Long text wraps.
  const emptyRow = (text: string, edge = false) => <View key=":empty" style={{ minHeight: childHeight, justifyContent: "center", paddingEnd: geometry.paddingX,
    paddingStart: geometry.paddingX + (edge ? 0 : geometry.iconSize + geometry.gap) }}>
    <Animated.View style={{ opacity: fadeIn }}><KText style={{ ...typeStyle("caption"), color: colors.textTertiary }}>{text}</KText></Animated.View>
  </View>;
  const groupRows = (mode: Mode, section: SideNavigationSection<SideNavigationDestination>) => {
    if (mode.collapsed) return section.items.map(item => row(mode, item));
    const none = sideSectionEmpty(section);
    if (none) return [emptyRow(none)];
    const { items: visible, hidden, expandable, expanded: all } = sideSectionRows(section, { value, showAll: ctx.allShown });
    const rows = visible.map(item => row(mode, item));
    if (!expandable) return rows;
    const key = section.key!, iconic = section.items.some(item => item.icon), text = all ? m.showFewerItems : m.showMoreItems(hidden);
    return [...rows, <Pressable key=":more" focusRingInset hitSlop={slop(itemHeight)} accessibilityRole="button" accessibilityLabel={text} accessibilityState={{ expanded: all }}
      onPress={() => ctx.updateShowAll(toggleSideParent(ctx.allShown, key))} style={(state: PressState) => ({ ...box(mode, itemHeight, 0), backgroundColor: fill(mode, undefined, false, state) })}>
      {/* In tertiary ink, so it never reads as a page. */}
      {(state: PressState) => { const color = state.pressed ? colors.text : colors.textTertiary; return <>
        {iconic && glyph(mode, all ? "chevron-up" : "dots", "", false, color)}
        {tail(mode, label(mode, text, false, color))}
      </>; }}
    </Pressable>];
  };
  return { base, railWidth, itemHeight, groupHeight, slop, box, fill, ink, nameInk, weight, label, glyph, rowFill, endMark, quiet, corner, opens, named, chevron,
    actionsWidth, actionButtons, flyoutPanel, row, groupRows, emptyRow };
}
