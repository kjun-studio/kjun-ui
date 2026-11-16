import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isPlainNavigationClick, isSideParent, sideItemsHaveBadge, sideItemsHoldCurrent, sideNavigationGroupRail, sideNavigationInitial, sideNavigationOpensElsewhere,
  sideNavigationSections, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, type SideNavigationRail, type SideNavigationSection,
  sideParentHasBadge, sideParentHoldsCurrent, toggleSideParent, type SideNavigationDestination as WebDestination,
  type SideNavigationEntry as Entry, type SideNavigationGroup as Group, type SideNavigationItem as Item, type SideNavigationParent as Parent } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Platform, View, type ColorValue, type GestureResponderEvent } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { NavigationBadgeMark } from "./app-navigation";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { KText } from "./internal";
import { KjunTooltip } from "./popover";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

/** A destination: the bottom navigation's shape. `href` and `target` act on Native Web only; on a device navigate in onNavigate. */
export type SideNavigationDestination = Omit<WebDestination, "href"> & { href?: string };
/** A parent that opens one level of destinations under it. It is a toggle and does not navigate itself. */
export type SideNavigationParent = Parent<SideNavigationDestination>;
export type SideNavigationItem = Item<SideNavigationDestination>;
/** A titled run of items. */
export type SideNavigationGroup = Group<SideNavigationDestination>;
export type SideNavigationEntry = Entry<SideNavigationDestination>;

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
  /** A parent or group was pressed while collapsed: widen the column (collapsed=false) to show its children. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Group titles become toggles that show or hide their group. The group of the current destination starts open. */
  collapsibleGroups?: boolean;
  /** The open groups by key (a group's key, else its title). Without it the navigation keeps the list itself. */
  expandedGroups?: string[];
  /** Also called when moving to a page in a closed group opens it. */
  onExpandedGroupsChange?: (expandedGroups: string[]) => void;
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon), which
   * asks to widen with that group open. Loose items between groups keep their own row. */
  rail?: SideNavigationRail;
}
/**
 * A vertical menu for the side of a wide screen (a tablet, a landscape layout), like Web: the current destination
 * filled, titled groups and one level of children. On a phone use KjunBottomNavigation.
 */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange,
  collapsibleGroups = false, expandedGroups, onExpandedGroupsChange, rail = "items" }: KjunSideNavigationProps) {
  const m = useKjunMessages(), { colors } = useKjunStyles(), geometry = tokens.extensions.sideNavigation;
  const [own, setOwn] = useState(() => sideNavigationWithCurrentParents([], items, value) as string[]);
  const open = expanded ?? own;
  const update = (next: string[]) => { if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
  // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
  const [ownGroups, setOwnGroups] = useState(() => sideNavigationWithCurrentGroups([], items, value) as string[]);
  const openGroups = expandedGroups ?? ownGroups;
  const updateGroups = (next: string[]) => { if (expandedGroups === undefined) setOwnGroups(next); onExpandedGroupsChange?.(next); };
  // Groups do the same while they can be closed.
  const latest = useRef({ open, update, openGroups, updateGroups, collapsibleGroups }); latest.current = { open, update, openGroups, updateGroups, collapsibleGroups };
  const holders = JSON.stringify([sideNavigationWithCurrentParents([], items, value), sideNavigationWithCurrentGroups([], items, value)]), mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const next = sideNavigationWithCurrentParents(latest.current.open, items, value);
    if (next !== latest.current.open) latest.current.update([...next]);
    if (!latest.current.collapsibleGroups) return;
    const groups = sideNavigationWithCurrentGroups(latest.current.openGroups, items, value);
    if (groups !== latest.current.openGroups) latest.current.updateGroups([...groups]);
  }, [value, holders]);
  const toggle = (key: string) => update(toggleSideParent(open, key));
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { if (!open.includes(key)) toggle(key); onCollapsedChange?.(false); };
  const revealGroup = (key: string) => { if (collapsibleGroups && !openGroups.includes(key)) updateGroups([...openGroups, key]); onCollapsedChange?.(false); };
  // On a device every press is a touch, so rows take Web's touch heights (48, children and group titles 44). Native Web
  // keeps Web's pointer heights (40, children 36, group titles 32); there the touch target reaches 44 above and below.
  const touch = Platform.OS !== "web";
  const itemHeight = touch ? geometry.touchItemHeight : geometry.itemHeight, childHeight = touch ? geometry.touchChildHeight : geometry.childHeight;
  const groupHeight = touch ? geometry.touchChildHeight : geometry.groupHeight;
  const slop = (height: number) => { const reach = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2); return { top: reach, bottom: reach }; };
  const box = (height: number, child: boolean) => ({ height, ...(collapsed ? { width: geometry.paddingX * 2 + geometry.iconSize } : {}), flexDirection: "row" as const, alignItems: "center" as const, gap: geometry.gap, borderRadius: geometry.radius,
    paddingEnd: geometry.paddingX, paddingStart: geometry.paddingX + (child ? geometry.iconSize + geometry.gap : 0) });
  // Hover is half the app's hover fill and leaves the text as it is, so it never reads as a stronger mark than the current page.
  const hover = (typeof colors.hover === "string" && tintColor(colors.hover, tokens.states.opacity.hoverSoft)) || colors.hover;
  const fill = (selected: boolean, disabled: boolean | undefined, { pressed, hovered }: PressState) =>
    selected ? colors.selectedBg : disabled ? "transparent" : pressed ? colors.active : hovered ? hover : "transparent";
  const ink = (lit: boolean) => lit ? colors.text : colors.textSecondary;
  const label = (text: string, strong: boolean, lit: boolean) => !collapsed && <KText numberOfLines={1} ellipsizeMode="tail"
    style={{ ...typeStyle("control"), flex: 1, minWidth: 0, fontWeight: strong ? typeStyle("control").fontWeight : typeStyle("body").fontWeight, color: ink(lit) }}>{text}</KText>;
  // The icon box also holds the initial of a row without an icon, and the badge (on its corner) while only icons show.
  const glyph = (icon: string | undefined, text: string, filled: boolean, lit: boolean, mark?: ReactNode) => (icon || collapsed) &&
    <View style={{ width: geometry.iconSize, height: geometry.iconSize, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icon ? <KjunIcon name={icon} filled={filled} size={geometry.iconSize} color={ink(lit)} />
        : <KText style={{ ...typeStyle("control"), color: ink(lit) }}>{sideNavigationInitial(text)}</KText>}
      {collapsed && mark}
    </View>;
  // While collapsed the badge overlaps the icon, so its ring takes the row's fill (the surface under a clear row).
  const corner = (badge: SideNavigationDestination["badge"], under: ColorValue) =>
    <NavigationBadgeMark badge={badge} ring={under === "transparent" ? colors.surface : under} iconSize={geometry.iconSize} />;
  // While collapsed a row is the box around its icon (44 by 40), as on Web, so the fill wraps the icon.
  const named = (text: string, row: ReactElement) => collapsed ? <KjunTooltip key={row.key} content={text} placement="right">{row}</KjunTooltip> : row;
  const link = (item: SideNavigationDestination, child = false) => {
    const selected = item.key === value, height = child ? childHeight : itemHeight, elsewhere = sideNavigationOpensElsewhere(item);
    return named(item.label, <Pressable key={item.key} focusRingInset hitSlop={slop(height)} disabled={item.disabled} accessibilityRole="link"
      accessibilityLabel={navigationLabel(item.label, item.badge, m.newContent, m.newCount) + (elsewhere ? m.newWindow : "")} accessibilityState={{ disabled: !!item.disabled, selected }}
      {...(Platform.OS === "web" ? { "aria-current": selected ? "page" : undefined, ...(item.href && !item.disabled ? { href: item.href, hrefAttrs: { target: item.target, rel: elsewhere ? "noopener noreferrer" : undefined } } : {}) } : {})}
      onPress={(event: GestureResponderEvent) => {
        // On Native Web the browser handles a new-tab click and a target link; on a device the app opens every destination.
        if (Platform.OS === "web" && (elsewhere || !isPlainNavigationClick(event.nativeEvent as never))) return;
        onNavigate?.(item.key, event); if (selected) onReselect?.(item.key, event);
      }}
      style={(state: PressState) => ({ ...box(height, child), backgroundColor: fill(selected, item.disabled, state), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
      {(state: PressState) => { const lit = selected || (!item.disabled && state.pressed); return <>
        {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number. */}
        {!child && glyph(item.icon, item.label, selected, lit, corner(navigationBadge(item.badge) ? true : undefined, fill(selected, item.disabled, state)))}
        {label(item.label, selected, lit)}
        {!collapsed && <NavigationBadgeMark badge={item.badge} />}
        {!collapsed && elsewhere && <KjunIcon name="external-link" size={geometry.chevronSize} color={colors.textTertiary} />}
      </>; }}
    </Pressable>);
  };
  const row = (item: SideNavigationItem) => {
    if (!isSideParent(item)) return link(item);
    const shown = open.includes(item.key) && !collapsed, dot = !shown && sideParentHasBadge(item);
    // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
    const within = !shown && sideParentHoldsCurrent(item, value);
    // It takes the selection fill, open or collapsed, so the menu always shows where you are.
    const under = (state: PressState) => fill(within, item.disabled, state);
    return <View key={item.key} style={{ gap: geometry.itemGap }}>
      {named(item.label, <Pressable key={item.key} focusRingInset hitSlop={slop(itemHeight)} disabled={item.disabled} accessibilityRole="button"
        accessibilityLabel={dot ? navigationLabel(item.label, true, m.newContent) : item.label}
        accessibilityState={{ disabled: !!item.disabled, expanded: shown }} onPress={() => collapsed ? reveal(item.key) : toggle(item.key)}
        style={(state: PressState) => ({ ...box(itemHeight, false), backgroundColor: under(state), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
        {(state: PressState) => { const lit = within || (!item.disabled && state.pressed); return <>
          {glyph(item.icon, item.label, false, lit, dot && corner(true, under(state)))}
          {label(item.label, within, lit)}
          {!collapsed && dot && <NavigationBadgeMark badge={true} />}
          {!collapsed && <View style={shown ? { transform: [{ rotate: "180deg" }] } : undefined}><KjunIcon name="chevron-down" size={geometry.chevronSize} color={colors.textTertiary} /></View>}
        </>; }}
      </Pressable>)}
      <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{item.children.map(child => link(child, true))}</View></Collapse>
    </View>;
  };
  // A group in a rail of groups: its icon (or initial), the selection fill while it holds the current page, and a dot
  // when an item in it has a badge. Pressing it asks for the full width with the group open.
  const groupRow = (group: SideNavigationSection<SideNavigationDestination> & { key: string; title: string }) => {
    const within = sideItemsHoldCurrent(group.items, value), dot = sideItemsHaveBadge(group.items);
    return named(group.title, <Pressable key={"group:" + group.key} focusRingInset hitSlop={slop(itemHeight)} accessibilityRole="button"
      accessibilityLabel={dot ? navigationLabel(group.title, true, m.newContent) : group.title} accessibilityState={{ expanded: false }}
      onPress={() => revealGroup(group.key)} style={(state: PressState) => ({ ...box(itemHeight, false), backgroundColor: fill(within, false, state) })}>
      {(state: PressState) => glyph(group.icon, group.title, false, within || state.pressed, dot && corner(true, fill(within, false, state)))}
    </Pressable>);
  };
  // A group title that opens and closes its group; closed over the current page it takes the selection fill, like a parent.
  const groupToggle = (section: SideNavigationSection<SideNavigationDestination>) => {
    const key = section.key!, shown = openGroups.includes(key);
    const within = !shown && sideItemsHoldCurrent(section.items, value), dot = !shown && sideItemsHaveBadge(section.items);
    return <Pressable key="title" focusRingInset hitSlop={slop(groupHeight)} accessibilityRole="button" accessibilityState={{ expanded: shown }}
      accessibilityLabel={dot ? navigationLabel(section.title!, true, m.newContent) : section.title} onPress={() => updateGroups(toggleSideParent(openGroups, key))}
      style={(state: PressState) => ({ height: groupHeight, flexDirection: "row" as const, alignItems: "center" as const, gap: geometry.gap, borderRadius: geometry.radius,
        paddingHorizontal: geometry.paddingX, backgroundColor: fill(within, false, state) })}>
      <KText numberOfLines={1} style={{ ...typeStyle("caption"), flex: 1, minWidth: 0, fontWeight: typeStyle("control").fontWeight, color: within ? colors.text : colors.textTertiary }}>{section.title}</KText>
      {dot && <NavigationBadgeMark badge={true} />}
      <View style={shown ? { transform: [{ rotate: "180deg" }] } : undefined}><KjunIcon name="chevron-down" size={geometry.chevronSize} color={within ? colors.text : colors.textTertiary} /></View>
    </Pressable>;
  };
  const toggleable = collapsibleGroups && !collapsed;
  if (collapsed && rail === "groups") return <View role="navigation" accessibilityLabel={ariaLabel ?? m.mainNavigation} style={{ minWidth: 0, gap: geometry.itemGap }}>
    {sideNavigationGroupRail(items).map(entry => "group" in entry ? groupRow(entry.group) : row(entry.item))}
  </View>;
  return <View role="navigation" accessibilityLabel={ariaLabel ?? m.mainNavigation} style={{ minWidth: 0 }}>
    {sideNavigationSections(items).map((section, index) => <View key={index} role={section.title ? "group" : undefined} accessibilityLabel={section.title}
      // Loose items after a group, and (with titles hidden) every later group, keep a title's distance from what is above;
      // groups that open and close sit a short gap apart.
      style={{ gap: geometry.itemGap, marginTop: !index ? 0 : section.title && toggleable ? geometry.groupGap : !section.title || collapsed ? geometry.titlePaddingTop : 0 }}>
      {/* Icons only, the titles are hidden: a hairline the icon's width in the middle of the gap marks the boundary. */}
      {!!index && collapsed && <View pointerEvents="none" style={{ position: "absolute", top: -(geometry.titlePaddingTop + tokens.border.defaultWidth) / 2,
        start: geometry.paddingX, width: geometry.iconSize, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />}
      {!!section.title && toggleable && groupToggle(section)}
      {!!section.title && !collapsed && !toggleable && <KText accessibilityRole="header" style={{ ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, color: colors.textTertiary,
        paddingTop: index ? geometry.titlePaddingTop : 0, paddingBottom: geometry.titlePaddingBottom - geometry.itemGap, paddingHorizontal: geometry.paddingX }}>{section.title}</KText>}
      {!!section.title && toggleable
        ? <Collapse open={openGroups.includes(section.key!)}><View style={{ gap: geometry.itemGap }}>{section.items.map(row)}</View></Collapse>
        : section.items.map(row)}
    </View>)}
  </View>;
}
