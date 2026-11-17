import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { checkSideNavigation, isPlainNavigationClick, isSideParent, isTitledSection, sideGroupState, sideNavigationGroupRail, sideNavigationInitial, sideNavigationInitialGroups,
  sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, sideParentState, sideRailGroupState, sideSectionToggles,
  toggleSideParent, warnNoWiden, type SideNavigationAction, type SideNavigationCollapsedParent, type SideNavigationRail, type SideNavigationSection, type SideNavigationTitledSection,
  type SideNavigationDestination as WebDestination, type SideNavigationEntry as Entry, type SideNavigationGroup as Group, type SideNavigationItem as Item,
  type SideNavigationParent as Parent } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Animated, I18nManager, Platform, View, type ColorValue, type GestureResponderEvent, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { NavigationBadgeMark } from "./app-navigation";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { content, KText, useReducedMotion } from "./internal";
import { motionOut } from "./motion";
import { KjunPopover, KjunTooltip } from "./popover";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
export type { SideNavigationAction, SideNavigationCollapsedParent, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";

/** A destination: the bottom navigation's shape. `href` and `target` act on Native Web only; on a device navigate in onNavigate. */
export type SideNavigationDestination = Omit<WebDestination, "href"> & { href?: string };
/** A parent that opens one level of destinations under it. It is a toggle and does not navigate itself. */
export type SideNavigationParent = Parent<SideNavigationDestination>;
export type SideNavigationItem = Item<SideNavigationDestination>;
/** A titled run of items. */
export type SideNavigationGroup = Group<SideNavigationDestination>;
export type SideNavigationEntry = Entry<SideNavigationDestination>;
/** A header or footer: content, or a function of collapsed so it can swap to an icon-only form. */
export type SideNavigationSlot = ReactNode | ((collapsed: boolean) => ReactNode);
type Titled = SideNavigationTitledSection<SideNavigationDestination>;

type Navigate = (key: string, event: GestureResponderEvent) => void;
type PressState = { pressed: boolean; hovered?: boolean };
export interface KjunSideNavigationProps {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: SideNavigationEntry[];
  /** The current destination's key (a child's key when the page is under a parent). */
  value: string;
  ariaLabel?: string;
  /** A press on a destination. On Native Web, modified clicks (new tab) and target links are left to the browser. */
  onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** The open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open. */
  expanded?: string[];
  /** Also called when moving to a page under a closed parent opens it. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Icons only, for a narrowed column. Names show as tooltips (a long press on a device), and children stay hidden behind their parent. */
  collapsed?: boolean;
  /** A parent or group was pressed while collapsed (collapsedParent="widen"), or the collapse toggle was pressed. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Group titles become toggles that show or hide their group. A group's own collapsible overrides this. The group of
   * the current destination starts open, and so do groups marked defaultOpen. */
  collapsibleGroups?: boolean;
  /** The open groups by key (a group's key, else its title). Without it the navigation keeps the list itself. */
  expandedGroups?: string[];
  /** Also called when moving to a page in a closed group opens it. */
  onExpandedGroupsChange?: (expandedGroups: string[]) => void;
  /** A closed group's title ends with how many rows it holds (a dot instead while one of them has a badge). */
  groupCounts?: boolean;
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon).
   * Loose items between groups keep their own row. */
  rail?: SideNavigationRail;
  /** While collapsed: a short name under each icon, in a 72 wide column. The current page and a press fill a 56 by 32
   * indicator around the icon, a count stays a number, and no tooltip is needed. */
  railLabels?: boolean;
  /** While collapsed, pressing a parent or a rail group: "widen" asks for the full width with it open (onCollapsedChange);
   * "flyout" shows its rows in a panel beside the icon and keeps the column narrow. */
  collapsedParent?: SideNavigationCollapsedParent;
  /** "compact": 32 tall rows and 30 tall children on Native Web, and counts as quiet numbers, for long lists. A device keeps
   * the touch heights. */
  density?: "default" | "compact";
  /** Above the list, such as a logo, a workspace switcher or search. The navigation does not scroll itself: put it in the
   * app's ScrollView, or let the app scroll the list between a fixed header and footer. */
  header?: SideNavigationSlot;
  /** Below the list, such as the account. */
  footer?: SideNavigationSlot;
  /** A button at the end of the footer that asks to collapse or widen the column (onCollapsedChange). */
  collapseToggle?: boolean;
  /** An action button of a row (the row's key) or a group title (the group's key) was pressed. Actions always show, as on touch. */
  onAction?: (key: string, action: string, event: GestureResponderEvent) => void;
}
type Mode = { collapsed: boolean; labelled: boolean; flyout?: boolean; flat?: boolean };
// A flyout shows rows as a full menu does; a parent's flyout starts its children at the edge.
const FLYOUT: Mode = { collapsed: false, labelled: false, flyout: true }, FLAT: Mode = { ...FLYOUT, flat: true };
type Level = "page" | "within" | undefined;

/**
 * A vertical menu for the side of a wide screen (a tablet, a landscape layout), like Web: the current destination
 * filled, titled groups and one level of children. On a phone use KjunBottomNavigation. Web's linkAs and scrollToCurrent
 * have no Native form: navigate in onNavigate, and scroll the app's ScrollView.
 */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange,
  collapsibleGroups = false, expandedGroups, onExpandedGroupsChange, groupCounts = false, rail = "items", railLabels = false, collapsedParent = "widen",
  density = "default", header, footer, collapseToggle = false, onAction }: KjunSideNavigationProps) {
  const m = useKjunMessages(), { colors, fontFamily, numericFontFamily } = useKjunStyles(), geometry = tokens.extensions.sideNavigation;
  const sections = useMemo(() => sideNavigationSections(items), [items]);
  useEffect(() => checkSideNavigation(items), [items]);
  const [own, setOwn] = useState(() => [...sideNavigationWithCurrentParents([], items, value)]);
  const open = expanded ?? own;
  const update = (next: string[]) => { if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  const [ownGroups, setOwnGroups] = useState(() => sideNavigationInitialGroups(items, value));
  const openGroups = expandedGroups ?? ownGroups;
  const updateGroups = (next: string[]) => { if (expandedGroups === undefined) setOwnGroups(next); onExpandedGroupsChange?.(next); };
  const toggles = sections.some(section => sideSectionToggles(section, collapsibleGroups));
  // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
  // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
  // Groups do the same while any can be closed.
  const latest = useRef({ open, update, openGroups, updateGroups, toggles }); latest.current = { open, update, openGroups, updateGroups, toggles };
  const holders = useMemo(() => JSON.stringify([sideNavigationWithCurrentParents([], items, value), sideNavigationWithCurrentGroups([], items, value)]), [items, value]);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const next = sideNavigationWithCurrentParents(latest.current.open, items, value);
    if (next !== latest.current.open) latest.current.update([...next]);
    if (!latest.current.toggles) return;
    const groups = sideNavigationWithCurrentGroups(latest.current.openGroups, items, value);
    if (groups !== latest.current.openGroups) latest.current.updateGroups([...groups]);
  }, [value, holders]);
  // Widening: names, titles and trailing marks wait for the column and fade in; a flyout closes with the rail it belongs to.
  const reduced = useReducedMotion(), fadeIn = useRef(new Animated.Value(1)).current, wasCollapsed = useRef(collapsed);
  const [flyout, setFlyout] = useState<string | null>(null);
  useEffect(() => {
    const widened = wasCollapsed.current && !collapsed; wasCollapsed.current = collapsed;
    if (!collapsed) setFlyout(null);
    if (!widened || reduced) return;
    fadeIn.setValue(0);
    const fade = Animated.timing(fadeIn, { toValue: 1, delay: tokens.motion.control, duration: tokens.motion.control, easing: motionOut, useNativeDriver: Platform.OS !== "web" });
    fade.start();
    return () => { fade.stop(); fadeIn.setValue(1); };
  }, [collapsed]);
  const widen = () => { if (!onCollapsedChange) warnNoWiden(); onCollapsedChange?.(false); };
  const toggle = (key: string) => update(toggleSideParent(open, key));
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { if (!open.includes(key)) toggle(key); widen(); };
  const revealGroup = (key: string) => {
    if (!openGroups.includes(key) && sections.some(section => section.key === key && sideSectionToggles(section, collapsibleGroups))) updateGroups([...openGroups, key]);
    widen();
  };
  const flyoutMode = collapsed && collapsedParent === "flyout";
  // With names under the icons (railLabels) a collapsed row is 72 wide, an indicator around the icon over a one-line name;
  // the fill moves from the row to the indicator and no tooltip is needed.
  const labelled = collapsed && railLabels, base: Mode = { collapsed, labelled };
  const railWidth = labelled ? geometry.railItemWidth : geometry.paddingX * 2 + geometry.iconSize;

  // On a device every press is a touch, so rows take Web's touch heights (48, children and group titles 44). Native Web
  // keeps Web's pointer heights (40, children 36, group titles 32); there the touch target reaches 44 above and below.
  // density="compact" shortens rows under a pointer only, so a device keeps its touch heights.
  const touch = Platform.OS !== "web", compact = !touch && density === "compact";
  const itemHeight = touch ? geometry.touchItemHeight : compact ? geometry.compactItemHeight : geometry.itemHeight;
  const childHeight = touch ? geometry.touchChildHeight : compact ? geometry.compactChildHeight : geometry.childHeight;
  const groupHeight = touch ? geometry.touchChildHeight : geometry.groupHeight;
  const slop = (height: number) => { const reach = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2); return { top: reach, bottom: reach }; };
  const box = (mode: Mode, height: number, child: boolean, end = 0): ViewStyle => mode.labelled ? { width: geometry.railItemWidth, alignItems: "center", justifyContent: "center",
    gap: geometry.railLabelGap, paddingVertical: geometry.railPaddingY, paddingHorizontal: geometry.railPaddingX, borderRadius: geometry.radius } : { height, ...(mode.collapsed ? { width: railWidth } : {}),
    flexDirection: "row", alignItems: "center", gap: geometry.gap, borderRadius: geometry.radius,
    paddingEnd: geometry.paddingX + end, paddingStart: geometry.paddingX + (child && !mode.flat ? geometry.iconSize + geometry.gap : 0) };
  // Hover is half the app's hover fill and leaves the text as it is, so it never reads as a stronger mark than the current page.
  // Only the current page takes the selection fill. A closed parent or group over it takes none in a full menu (its name
  // turns full ink and weight instead) and half of it while only icons show, where there is no name to strengthen.
  const soft = (color: ColorValue, amount: number) => (typeof color === "string" && tintColor(color, amount)) || color;
  const hover = soft(colors.hover, tokens.states.opacity.hoverSoft), withinFill = soft(colors.selectedBg, tokens.states.opacity.selectedWithin);
  const fill = (mode: Mode, level: Level, disabled: boolean | undefined, { pressed, hovered }: PressState): ColorValue =>
    level === "page" ? colors.selectedBg : level === "within" && mode.collapsed ? withinFill : disabled ? "transparent" : pressed ? colors.active : hovered ? hover : "transparent";
  const ink = (lit: boolean) => lit ? colors.text : colors.textSecondary;
  const weight = (strong: boolean) => strong ? typeStyle("control").fontWeight : typeStyle("body").fontWeight;
  const label = (mode: Mode, text: string, strong: boolean, lit: boolean) => mode.labelled ? <KText numberOfLines={1} ellipsizeMode="tail"
    style={{ ...typeStyle("caption"), alignSelf: "stretch", textAlign: "center", fontWeight: weight(strong), color: ink(lit) }}>{text}</KText>
    : !mode.collapsed && <KText numberOfLines={1} ellipsizeMode="tail" style={{ ...typeStyle("control"), flex: 1, minWidth: 0, fontWeight: weight(strong), color: ink(lit) }}>{text}</KText>;
  // In a full row the name and the trailing marks fade in together after widening.
  const tail = (mode: Mode, node: ReactNode) => mode.collapsed ? node
    : <Animated.View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: geometry.gap, opacity: fadeIn }}>{node}</Animated.View>;
  // The icon box also holds the initial of a row without an icon, and the badge (on its corner) while only icons show.
  const glyph = (mode: Mode, icon: string | undefined, text: string, filled: boolean, lit: boolean, mark?: ReactNode, under?: ColorValue) => {
    if (!icon && !mode.collapsed) return false;
    const inner = <View style={{ width: geometry.iconSize, height: geometry.iconSize, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon ? <KjunIcon name={icon} filled={filled} size={geometry.iconSize} color={ink(lit)} />
        : <KText style={{ ...typeStyle("control"), color: ink(lit) }}>{sideNavigationInitial(text)}</KText>}
      {mode.collapsed && mark}
    </View>;
    return mode.labelled ? <View style={{ width: geometry.railIndicatorWidth, height: geometry.railIndicatorHeight, borderRadius: geometry.railIndicatorHeight / 2,
      alignItems: "center", justifyContent: "center", backgroundColor: under }}>{inner}</View> : inner;
  };
  // The row's fill, which a labelled rail paints on the indicator instead.
  const rowFill = (mode: Mode, under: ColorValue) => mode.labelled ? "transparent" : under;
  // At the end of a row the badge sits in the row's middle, as on Web. The shared mark lifts a dot to the top of a text
  // line (beside a bottom navigation label), so it is wrapped to centre the dot here.
  const endMark = (badge: SideNavigationDestination["badge"]) => navigationBadge(badge) && <View style={{ alignSelf: "center" }}><NavigationBadgeMark badge={badge} /></View>;
  // At the end of a compact row a count is a quiet number; dots and the default density keep the badge.
  const quiet = { ...typeStyle("caption"), fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums" as const], fontWeight: typeStyle("body").fontWeight, color: colors.textTertiary };
  const trailing = (badge: SideNavigationDestination["badge"]) => {
    const mark = navigationBadge(badge);
    return compact && mark && !mark.dot ? <KText aria-hidden={true} importantForAccessibility="no" style={quiet}>{mark.text}</KText> : endMark(badge);
  };
  // While collapsed the badge overlaps the icon, so its ring takes the row's fill (the surface under a clear row).
  const corner = (badge: SideNavigationDestination["badge"], under: ColorValue) =>
    <NavigationBadgeMark badge={badge} ring={under === "transparent" ? colors.surface : under} iconSize={geometry.iconSize} />;
  // While collapsed a row is the box around its icon (44 by 40), as on Web, so the fill wraps the icon.
  const named = (mode: Mode, text: string, row: ReactElement) => mode.collapsed && !mode.labelled ? <KjunTooltip content={text} placement="right">{row}</KjunTooltip> : row;
  // Actions: small buttons at the end of a row or a title, always shown (touch). They sit beside the row, not inside it.
  const actionsWidth = (count: number) => count * (geometry.actionSize + geometry.actionGap);
  const actionButtons = (key: string, actions: readonly SideNavigationAction[], place?: ViewStyle) => <View style={{ position: "absolute", top: 0, bottom: 0,
    end: geometry.paddingX - (geometry.actionSize - geometry.actionIconSize) / 2, flexDirection: "row", alignItems: "center", gap: geometry.actionGap, ...place }}>
    {actions.map(action => <KjunTooltip key={action.key} content={action.label}>
      <Pressable focusRingInset hitSlop={slop(geometry.actionSize)} accessibilityRole="button" accessibilityLabel={action.label} onPress={(event: GestureResponderEvent) => onAction?.(key, action.key, event)}
        style={(state: PressState) => ({ width: geometry.actionSize, height: geometry.actionSize, alignItems: "center", justifyContent: "center", borderRadius: geometry.actionRadius,
          backgroundColor: fill(base, undefined, false, state) })}>
        {(state: PressState) => <KjunIcon name={action.icon} size={geometry.actionIconSize} color={ink(state.pressed)} />}
      </Pressable>
    </KjunTooltip>)}
  </View>;
  // A panel beside a collapsed icon, holding what the icon stands for. It leaves the rest of the screen usable.
  const flyoutPanel = (key: string, title: string, trigger: ReactElement, body: ReactNode) => <KjunPopover open={flyout === key} onOpenChange={next => setFlyout(next ? key : null)}
    modal={false} placement="right" header={title} focusOnOpen trigger={trigger}><View style={{ gap: geometry.itemGap }}>{body}</View></KjunPopover>;

  const link = (mode: Mode, item: SideNavigationDestination, child: boolean, end: number) => {
    const selected = item.key === value, height = child ? childHeight : itemHeight, elsewhere = sideNavigationOpensElsewhere(item);
    // Disabled stays on the Pressable: React Native Web reads it for aria-disabled and the tab order.
    return <Pressable focusRingInset disabled={item.disabled} hitSlop={mode.labelled ? undefined : slop(height)} accessibilityRole="link"
      accessibilityLabel={navigationLabel(item.label, item.badge, m.newContent, m.newCount) + (elsewhere ? m.newWindow : "")} accessibilityState={{ disabled: !!item.disabled, selected }}
      {...(Platform.OS === "web" ? { "aria-current": selected ? "page" : undefined, ...(item.href && !item.disabled ? { href: item.href, hrefAttrs: { target: item.target, rel: elsewhere ? "noopener noreferrer" : undefined } } : {}) } : {})}
      onPress={(event: GestureResponderEvent) => {
        if (item.disabled) return;
        // On Native Web the browser handles a new-tab click and a target link; on a device the app opens every destination.
        if (Platform.OS === "web" && (elsewhere || !isPlainNavigationClick(event.nativeEvent as never))) return;
        onNavigate?.(item.key, event); if (selected) onReselect?.(item.key, event);
        if (mode.flyout) setFlyout(null);
      }}
      style={(state: PressState) => ({ ...box(mode, height, child, end), backgroundColor: rowFill(mode, fill(mode, selected ? "page" : undefined, item.disabled, state)), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
      {(state: PressState) => { const lit = selected || (!item.disabled && state.pressed), under = fill(mode, selected ? "page" : undefined, item.disabled, state); return <>
        {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
            Beside a labelled rail's wider indicator the number fits. */}
        {!child && glyph(mode, item.icon, item.label, selected, lit, corner(mode.labelled ? item.badge : navigationBadge(item.badge) ? true : undefined, under), under)}
        {tail(mode, <>
          {label(mode, item.label, selected, lit)}
          {!mode.collapsed && trailing(item.badge)}
          {!mode.collapsed && elsewhere && <KjunIcon name="external-link" size={geometry.chevronSize} color={colors.textTertiary} />}
        </>)}
      </>; }}
    </Pressable>;
  };
  // A destination's row: the link, and its actions overlaid at its end (a button cannot sit inside a link).
  const destination = (mode: Mode, item: SideNavigationDestination, child = false) => {
    const actions = !mode.collapsed && item.actions?.length ? item.actions : undefined;
    return <View key={item.key} style={{ minWidth: 0 }}>
      {named(mode, item.label, link(mode, item, child, actions ? actionsWidth(actions.length) : 0))}
      {actions ? actionButtons(item.key, actions) : null}
    </View>;
  };
  const parent = (mode: Mode, item: SideNavigationParent) => {
    const flies = mode.collapsed && flyoutMode && !item.disabled;
    const { shown, within, dot } = sideParentState(item, { open, collapsed: mode.collapsed, value });
    // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
    const under = (state: PressState) => fill(mode, within ? "within" : undefined, item.disabled, state);
    // Disabled stays on the Pressable (aria-disabled and the tab order on Native Web); a device shows no tooltip either way.
    const button = <Pressable focusRingInset disabled={item.disabled} hitSlop={mode.labelled ? undefined : slop(itemHeight)} accessibilityRole="button"
      accessibilityLabel={dot ? navigationLabel(item.label, true, m.newContent) : item.label}
      accessibilityState={{ disabled: !!item.disabled, ...(flies ? {} : { expanded: shown }) }}
      onPress={flies || item.disabled ? undefined : () => mode.collapsed ? reveal(item.key) : toggle(item.key)}
      style={(state: PressState) => ({ ...box(mode, itemHeight, false), backgroundColor: rowFill(mode, under(state)), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
      {(state: PressState) => { const lit = within || (!item.disabled && state.pressed); return <>
        {glyph(mode, item.icon, item.label, false, lit, dot && corner(true, under(state)), under(state))}
        {tail(mode, <>
          {label(mode, item.label, within, lit)}
          {!mode.collapsed && dot && endMark(true)}
          {!mode.collapsed && <View style={shown ? { transform: [{ rotate: "180deg" }] } : undefined}><KjunIcon name="chevron-down" size={geometry.chevronSize} color={colors.textTertiary} /></View>}
        </>)}
      </>; }}
    </Pressable>;
    return <View key={item.key} style={{ gap: geometry.itemGap }}>
      {flies ? flyoutPanel(item.key, item.label, named(mode, item.label, button), item.children.map(child => destination(FLAT, child, true))) : named(mode, item.label, button)}
      {!flies && <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{item.children.map(child => destination(mode, child, true))}</View></Collapse>}
    </View>;
  };
  const row = (mode: Mode, item: SideNavigationItem) => isSideParent(item) ? parent(mode, item) : destination(mode, item);

  // A group title that opens and closes its group. Its small chevron follows the name; the end holds a dot for a badge
  // inside, or the number of rows (groupCounts). Closed over the current page, the name takes full ink.
  const groupToggle = (section: Titled, rows: ReactNode) => {
    const { shown, within, dot, count } = sideGroupState(section, { openGroups, value }), action = section.action;
    return <>
      <Animated.View style={{ minWidth: 0, opacity: fadeIn }}>
        <Pressable focusRingInset hitSlop={slop(groupHeight)} accessibilityRole="button" accessibilityState={{ expanded: shown }}
          accessibilityLabel={dot ? navigationLabel(section.title, true, m.newContent) : section.title} onPress={() => updateGroups(toggleSideParent(openGroups, section.key))}
          style={(state: PressState) => ({ height: groupHeight, flexDirection: "row", alignItems: "center", gap: geometry.groupChevronGap, borderRadius: geometry.radius,
            paddingStart: geometry.paddingX, paddingEnd: geometry.paddingX + (action ? actionsWidth(1) : 0), backgroundColor: fill(base, undefined, false, state) })}>
          {(state: PressState) => { const tone = within || state.pressed ? colors.text : colors.textTertiary; return <>
            <KText numberOfLines={1} ellipsizeMode="tail" style={{ ...typeStyle("caption"), flexShrink: 1, minWidth: 0, fontWeight: typeStyle("control").fontWeight, color: tone }}>{section.title}</KText>
            <View style={{ transform: shown ? [{ rotate: "90deg" }] : I18nManager.isRTL ? [{ scaleX: -1 }] : [] }}>
              <KjunIcon name="chevron-right" size={geometry.groupChevronSize} color={tone} />
            </View>
            {dot ? <View style={{ marginStart: "auto" }}>{endMark(true)}</View>
              : !shown && groupCounts ? <KText aria-hidden={true} importantForAccessibility="no" style={{ ...quiet, marginStart: "auto" }}>{count}</KText> : null}
          </>; }}
        </Pressable>
        {action && actionButtons(section.key, [action])}
      </Animated.View>
      <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{rows}</View></Collapse>
    </>;
  };
  // A static title, with the group's action level with its text.
  const staticTitle = (section: Titled, index: number) => {
    const action = section.action, bottom = geometry.titlePaddingBottom - geometry.itemGap;
    return <Animated.View style={{ minWidth: 0, opacity: fadeIn }}>
      <KText accessibilityRole="header" style={{ ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, color: colors.textTertiary,
        paddingTop: index ? geometry.titlePaddingTop : 0, paddingBottom: bottom, paddingStart: geometry.paddingX, paddingEnd: geometry.paddingX + (action ? actionsWidth(1) : 0) }}>{section.title}</KText>
      {action && actionButtons(section.key, [action], { top: undefined, bottom: bottom - (geometry.actionSize - typeStyle("caption").lineHeight) / 2, height: geometry.actionSize })}
    </Animated.View>;
  };
  const section = (entry: SideNavigationSection<SideNavigationDestination>, index: number) => {
    const rows = entry.items.map(item => row(base, item));
    const titled = isTitledSection(entry) ? entry : undefined, toggled = !!titled && !collapsed && sideSectionToggles(titled, collapsibleGroups);
    // Loose items after a group, and (with titles hidden) every later group, keep a title's distance from what is above;
    // groups that open and close sit a short gap apart, and a static title brings its own padding.
    const marginTop = !index ? 0 : collapsed || !titled ? geometry.titlePaddingTop : toggled ? geometry.groupGap : 0;
    return <View key={titled ? "group:" + titled.key : "loose:" + (entry.items[0]?.key ?? index)} role={titled ? "group" : undefined} accessibilityLabel={entry.title}
      style={{ gap: geometry.itemGap, marginTop }}>
      {/* Icons only, the titles are hidden: a hairline the icon's width in the middle of the gap marks the boundary. */}
      {!!index && collapsed && <View pointerEvents="none" style={{ position: "absolute", top: -(geometry.titlePaddingTop + tokens.border.defaultWidth) / 2,
        start: labelled ? (geometry.railItemWidth - geometry.railIndicatorWidth) / 2 : geometry.paddingX,
        width: labelled ? geometry.railIndicatorWidth : geometry.iconSize, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />}
      {titled && toggled ? groupToggle(titled, rows) : <>
        {titled && !collapsed && staticTitle(titled, index)}
        {rows}
      </>}
    </View>;
  };
  // A group in a rail of groups: its icon (or initial), half the selection fill while it holds the current page, and a
  // dot when an item in it has a badge. Pressing it widens with the group open, or opens its rows beside it (flyout).
  const railGroup = (group: Titled) => {
    const { within, dot } = sideRailGroupState(group, value);
    const under = (state: PressState) => fill(base, within ? "within" : undefined, false, state);
    const button = <Pressable focusRingInset hitSlop={labelled ? undefined : slop(itemHeight)} accessibilityRole="button"
      accessibilityLabel={dot ? navigationLabel(group.title, true, m.newContent) : group.title} accessibilityState={flyoutMode ? undefined : { expanded: false }}
      onPress={flyoutMode ? undefined : () => revealGroup(group.key)} style={(state: PressState) => ({ ...box(base, itemHeight, false), backgroundColor: rowFill(base, under(state)) })}>
      {(state: PressState) => <>
        {glyph(base, group.icon, group.title, false, within || state.pressed, dot && corner(true, under(state)), under(state))}
        {label(base, group.title, within, within || state.pressed)}
      </>}
    </Pressable>;
    return <View key={"group:" + group.key}>
      {flyoutMode ? flyoutPanel("group:" + group.key, group.title, named(base, group.title, button), group.items.map(item => row(FLYOUT, item))) : named(base, group.title, button)}
    </View>;
  };

  const slot = (given: SideNavigationSlot) => typeof given === "function" ? given(collapsed) : given;
  const top = slot(header), bottom = slot(footer), hasTop = top != null && top !== false, hasBottom = bottom != null && bottom !== false;
  // Header and footer take a row's width while collapsed, so what they hold centres over the icons.
  const narrow: ViewStyle | undefined = collapsed ? { width: railWidth, alignItems: "center" } : undefined;
  const toggleLabel = collapsed ? m.expandNavigation : m.collapseNavigation;
  const toggleButton = collapseToggle && <KjunTooltip content={toggleLabel} placement="right">
    <Pressable focusRingInset hitSlop={slop(collapsed ? geometry.itemHeight : geometry.toggleSize)} accessibilityRole="button" accessibilityLabel={toggleLabel}
      accessibilityState={{ expanded: !collapsed }} onPress={() => onCollapsedChange?.(!collapsed)}
      // The toggle is a small button at the footer's end, and a row like the others above the footer's content while collapsed.
      style={(state: PressState) => ({ alignItems: "center", justifyContent: "center", backgroundColor: fill(base, undefined, false, state),
        ...(collapsed ? { width: railWidth, height: geometry.itemHeight, borderRadius: geometry.radius }
          : { width: geometry.toggleSize, height: geometry.toggleSize, borderRadius: geometry.toggleRadius, marginStart: "auto" }) })}>
      {(state: PressState) => <KjunIcon name={collapsed ? "layout-sidebar-left-expand" : "layout-sidebar-left-collapse"} size={geometry.iconSize} color={ink(state.pressed)} />}
    </Pressable>
  </KjunTooltip>;
  return <View role="navigation" accessibilityLabel={ariaLabel ?? m.mainNavigation} style={{ minWidth: 0, gap: geometry.chromeGap }}>
    {hasTop && <Animated.View style={{ minWidth: 0, opacity: fadeIn, ...narrow }}>{content(top)}</Animated.View>}
    <View style={{ minWidth: 0 }}>
      {collapsed && rail === "groups"
        ? <View style={{ gap: geometry.itemGap }}>{sideNavigationGroupRail(items).map(entry => "group" in entry ? railGroup(entry.group) : row(base, entry.item))}</View>
        : sections.map(section)}
    </View>
    {(hasBottom || toggleButton) && <View style={{ minWidth: 0, gap: geometry.gap, alignItems: "center", flexDirection: collapsed ? "column-reverse" : "row", ...narrow }}>
      {hasBottom && <Animated.View style={{ minWidth: 0, opacity: fadeIn, ...(collapsed ? {} : { flex: 1 }) }}>{content(bottom)}</Animated.View>}
      {toggleButton}
    </View>}
  </View>;
}
