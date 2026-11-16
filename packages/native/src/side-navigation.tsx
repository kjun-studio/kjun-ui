import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isSideParent, sideNavigationCurrentParents, sideNavigationSections, toggleSideParent,
  type SideNavigationDestination as WebDestination, type SideNavigationEntry as WebEntry, type SideNavigationItem as WebItem } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useState } from "react";
import { Platform, View, type GestureResponderEvent } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { NavigationBadgeMark } from "./app-navigation";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

/** A destination: the bottom navigation's shape. `href` navigates on Native Web only; on a device navigate in onNavigate. */
export type SideNavigationDestination = Omit<WebDestination, "href"> & { href?: string };
/** A parent that opens one level of destinations under it. It is a toggle and does not navigate itself. */
export interface SideNavigationParent { key: string; label: string; icon?: string; disabled?: boolean; children: SideNavigationDestination[] }
export type SideNavigationItem = SideNavigationDestination | SideNavigationParent;
/** A titled run of items. */
export interface SideNavigationGroup { title: string; items: SideNavigationItem[] }
export type SideNavigationEntry = SideNavigationItem | SideNavigationGroup;

type Navigate = (key: string, event: GestureResponderEvent) => void;
type PressState = { pressed: boolean; hovered?: boolean };
export interface KjunSideNavigationProps {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: SideNavigationEntry[];
  /** The current destination's key (a child's key when the page is under a parent). */
  value: string;
  ariaLabel?: string;
  onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** The open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open. */
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
}
/**
 * A vertical menu for the side of a wide screen (a tablet, a landscape layout), like Web: the current destination
 * filled, titled groups and one level of children. On a phone use KjunBottomNavigation.
 */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange }: KjunSideNavigationProps) {
  const m = useKjunMessages(), { colors } = useKjunStyles(), geometry = tokens.extensions.sideNavigation;
  const entries = items as unknown as WebEntry[];
  const [own, setOwn] = useState(() => sideNavigationCurrentParents(entries, value));
  // Moving to a page under a closed parent opens it; parents the person opened stay as they are.
  useEffect(() => { setOwn(open => [...new Set([...open, ...sideNavigationCurrentParents(entries, value)])]); }, [value]);
  const open = expanded ?? own;
  const toggle = (key: string) => { const next = toggleSideParent(open, key); if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  // Rows keep Web's visible heights (40, children 36); the touch target reaches the 44 minimum above and below.
  const slop = (height: number) => { const reach = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2); return { top: reach, bottom: reach }; };
  const box = (height: number, child: boolean) => ({ height, flexDirection: "row" as const, alignItems: "center" as const, gap: geometry.gap, borderRadius: geometry.radius,
    paddingRight: geometry.paddingX, paddingLeft: geometry.paddingX + (child ? geometry.iconSize + geometry.gap : 0) });
  const fill = (selected: boolean, disabled: boolean | undefined, { pressed, hovered }: PressState) =>
    selected ? colors.selectedBg : disabled ? "transparent" : pressed ? colors.active : hovered ? colors.hover : "transparent";
  const label = (text: string, strong: boolean, lit: boolean) => <KText numberOfLines={1} ellipsizeMode="tail"
    style={{ ...typeStyle("control"), flex: 1, minWidth: 0, fontWeight: strong ? typeStyle("control").fontWeight : typeStyle("body").fontWeight, color: lit ? colors.text : colors.textSecondary }}>{text}</KText>;
  const link = (item: SideNavigationDestination, child = false) => {
    const selected = item.key === value, height = child ? geometry.childHeight : geometry.itemHeight;
    return <Pressable key={item.key} focusRingInset hitSlop={slop(height)} disabled={item.disabled} accessibilityRole="link"
      accessibilityLabel={navigationLabel(item.label, item.badge, m.newContent, m.newCount)} accessibilityState={{ disabled: !!item.disabled, selected }}
      {...(Platform.OS === "web" ? { "aria-current": selected ? "page" : undefined, ...(item.href && !item.disabled ? { href: item.href } : {}) } : {})}
      onPress={(event: GestureResponderEvent) => { onNavigate?.(item.key, event); if (selected) onReselect?.(item.key, event); }}
      style={(state: PressState) => ({ ...box(height, child), backgroundColor: fill(selected, item.disabled, state), opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
      {(state: PressState) => <>
        {!!item.icon && <KjunIcon name={item.icon} filled={selected} size={geometry.iconSize} color={selected || state.pressed || state.hovered ? colors.text : colors.textSecondary} />}
        {label(item.label, selected, selected || (!item.disabled && !!(state.pressed || state.hovered)))}
        <NavigationBadgeMark badge={item.badge} />
      </>}
    </Pressable>;
  };
  const row = (item: SideNavigationItem) => {
    if (!isSideParent(item as WebItem)) return link(item as SideNavigationDestination);
    const parent = item as SideNavigationParent, shown = open.includes(parent.key);
    // A closed parent stands for the current page inside it, so the place in the menu is never lost.
    const within = !shown && parent.children.some(child => child.key === value);
    return <View key={parent.key} style={{ gap: geometry.itemGap }}>
      <Pressable focusRingInset hitSlop={slop(geometry.itemHeight)} disabled={parent.disabled} accessibilityRole="button" accessibilityLabel={parent.label}
        accessibilityState={{ disabled: !!parent.disabled, expanded: shown }} onPress={() => toggle(parent.key)}
        style={(state: PressState) => ({ ...box(geometry.itemHeight, false), backgroundColor: fill(false, parent.disabled, state), opacity: parent.disabled ? tokens.states.opacity.disabled : 1 })}>
        {(state: PressState) => <>
          {!!parent.icon && <KjunIcon name={parent.icon} size={geometry.iconSize} color={within || state.pressed || state.hovered ? colors.text : colors.textSecondary} />}
          {label(parent.label, within, within || (!parent.disabled && !!(state.pressed || state.hovered)))}
          <View style={shown ? { transform: [{ rotate: "180deg" }] } : undefined}><KjunIcon name="chevron-down" size={geometry.chevronSize} color={colors.textTertiary} /></View>
        </>}
      </Pressable>
      <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{parent.children.map(child => link(child, true))}</View></Collapse>
    </View>;
  };
  return <View role="navigation" accessibilityLabel={ariaLabel ?? m.mainNavigation} style={{ minWidth: 0 }}>
    {sideNavigationSections(entries).map((section, index) => <View key={index} role={section.title ? "group" : undefined} accessibilityLabel={section.title}
      style={{ gap: geometry.itemGap, marginTop: index && !section.title ? geometry.itemGap : 0 }}>
      {!!section.title && <KText accessibilityRole="header" style={{ ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, color: colors.textTertiary,
        paddingTop: geometry.titlePaddingTop, paddingBottom: geometry.titlePaddingBottom - geometry.itemGap, paddingHorizontal: geometry.paddingX }}>{section.title}</KText>}
      {(section.items as unknown as SideNavigationItem[]).map(row)}
    </View>)}
  </View>;
}
