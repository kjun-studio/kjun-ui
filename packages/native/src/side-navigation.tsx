import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isPlainNavigationClick, isSideParent, sideNavigationInitial, sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationWithCurrentParents,
  sideParentHasBadge, sideParentHoldsCurrent, toggleSideParent, type SideNavigationDestination as WebDestination,
  type SideNavigationEntry as Entry, type SideNavigationGroup as Group, type SideNavigationItem as Item, type SideNavigationParent as Parent } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { cloneElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
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
  /** A parent was pressed while collapsed: widen the column (collapsed=false) to show its children. */
  onCollapsedChange?: (collapsed: boolean) => void;
}
/**
 * A vertical menu for the side of a wide screen (a tablet, a landscape layout), like Web: the current destination
 * filled, titled groups and one level of children. On a phone use KjunBottomNavigation.
 */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange }: KjunSideNavigationProps) {
  const m = useKjunMessages(), { colors } = useKjunStyles(), geometry = tokens.extensions.sideNavigation;
  const [own, setOwn] = useState(() => sideNavigationWithCurrentParents([], items, value) as string[]);
  const open = expanded ?? own;
  const update = (next: string[]) => { if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
  // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
  const latest = useRef({ open, update }); latest.current = { open, update };
  const holders = JSON.stringify(sideNavigationWithCurrentParents([], items, value)), mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const next = sideNavigationWithCurrentParents(latest.current.open, items, value);
    if (next !== latest.current.open) latest.current.update([...next]);
  }, [value, holders]);
  const toggle = (key: string) => update(toggleSideParent(open, key));
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { if (!open.includes(key)) toggle(key); onCollapsedChange?.(false); };
  // Rows keep Web's visible heights (40, children 36); the touch target reaches the 44 minimum above and below.
  const slop = (height: number) => { const reach = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2); return { top: reach, bottom: reach }; };
  const box = (height: number, child: boolean) => ({ height, flexDirection: "row" as const, alignItems: "center" as const, gap: geometry.gap, borderRadius: geometry.radius,
    paddingEnd: geometry.paddingX, paddingStart: geometry.paddingX + (child ? geometry.iconSize + geometry.gap : 0) });
  const fill = (selected: boolean, disabled: boolean | undefined, { pressed, hovered }: PressState) =>
    selected ? colors.selectedBg : disabled ? "transparent" : pressed ? colors.active : hovered ? colors.hover : "transparent";
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
  // The tooltip's wrapper stretches only for a block trigger, so the row keeps the column's width as on Web.
  const named = (text: string, row: ReactElement) => collapsed ? <KjunTooltip key={row.key} content={text} placement="right">{cloneElement(row, { block: true } as object)}</KjunTooltip> : row;
  const link = (item: SideNavigationDestination, child = false) => {
    const selected = item.key === value, height = child ? geometry.childHeight : geometry.itemHeight, elsewhere = sideNavigationOpensElsewhere(item);
    return named(item.label, <Pressable key={item.key} focusRingInset hitSlop={slop(height)} disabled={item.disabled} accessibilityRole="link"
      accessibilityLabel={navigationLabel(item.label, item.badge, m.newContent, m.newCount) + (elsewhere ? m.newWindow : "")} accessibilityState={{ disabled: !!item.disabled, selected }}
      {...(Platform.OS === "web" ? { "aria-current": selected ? "page" : undefined, ...(item.href && !item.disabled ? { href: item.href, hrefAttrs: { target: item.target, rel: elsewhere ? "noopener noreferrer" : undefined } } : {}) } : {})}
      onPress={(event: GestureResponderEvent) => {
        // On Native Web the browser handles a new-tab click and a target link; on a device the app opens every destination.
        if (Platform.OS === "web" && (elsewhere || !isPlainNavigationClick(event.nativeEvent as never))) return;
        onNavigate?.(item.key, event); if (selected) onReselect?.(item.key, event);
      }}
      style={(state: PressState) => ({ ...box(height, child), backgroundColor: fill(selected, item.disabled, state), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
      {(state: PressState) => { const lit = selected || (!item.disabled && !!(state.pressed || state.hovered)); return <>
        {!child && glyph(item.icon, item.label, selected, lit, corner(item.badge, fill(selected, item.disabled, state)))}
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
    // While collapsed the parent is the only mark of the current page, so it takes the selection fill.
    const under = (state: PressState) => fill(within && collapsed, item.disabled, state);
    return <View key={item.key} style={{ gap: geometry.itemGap }}>
      {named(item.label, <Pressable key={item.key} focusRingInset hitSlop={slop(geometry.itemHeight)} disabled={item.disabled} accessibilityRole="button"
        accessibilityLabel={dot ? navigationLabel(item.label, true, m.newContent) : item.label}
        accessibilityState={{ disabled: !!item.disabled, expanded: shown }} onPress={() => collapsed ? reveal(item.key) : toggle(item.key)}
        style={(state: PressState) => ({ ...box(geometry.itemHeight, false), backgroundColor: under(state), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
        {(state: PressState) => { const lit = within || (!item.disabled && !!(state.pressed || state.hovered)); return <>
          {glyph(item.icon, item.label, false, lit, dot && corner(true, under(state)))}
          {label(item.label, within, lit)}
          {!collapsed && dot && <NavigationBadgeMark badge={true} />}
          {!collapsed && <View style={shown ? { transform: [{ rotate: "180deg" }] } : undefined}><KjunIcon name="chevron-down" size={geometry.chevronSize} color={colors.textTertiary} /></View>}
        </>; }}
      </Pressable>)}
      <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{item.children.map(child => link(child, true))}</View></Collapse>
    </View>;
  };
  return <View role="navigation" accessibilityLabel={ariaLabel ?? m.mainNavigation} style={{ minWidth: 0 }}>
    {sideNavigationSections(items).map((section, index) => <View key={index} role={section.title ? "group" : undefined} accessibilityLabel={section.title}
      // Loose items after a group, and (with titles hidden) every later group, keep a title's distance from what is above.
      style={{ gap: geometry.itemGap, marginTop: index && (!section.title || collapsed) ? geometry.titlePaddingTop : 0 }}>
      {!!section.title && !collapsed && <KText accessibilityRole="header" style={{ ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, color: colors.textTertiary,
        paddingTop: index ? geometry.titlePaddingTop : 0, paddingBottom: geometry.titlePaddingBottom - geometry.itemGap, paddingHorizontal: geometry.paddingX }}>{section.title}</KText>}
      {section.items.map(row)}
    </View>)}
  </View>;
}
