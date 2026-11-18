import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { checkSideNavigation, isTitledSection, sideFlyoutKey, sideGroupState, sideNavigationGroupRail, sideNavigationShownTitle,
  sideNavigationToggleName, sideRailGroupState, sideSectionEmpty, sideSectionToggles, toggleSideParent, warnNoWiden,
  type SideNavigationCollapsedParent, type SideNavigationHeadingLevel, type SideNavigationRail, type SideNavigationSection, type SideNavigationTitledSection,
  type SideNavigationEntry as Entry, type SideNavigationGroup as Group } from "../../../shared/package-runtime/side-navigation";
import { useSideNavigationState } from "../../../shared/package-runtime/use-side-navigation-state";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Platform, View, type GestureResponderEvent, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { content, KText, useReducedMotion } from "./internal";
import { motionOut } from "./motion";
import { KjunTooltip } from "./popover";
import { useKjunStyles } from "./provider";
import { FLYOUT, sideNavigationRows, type Navigate, type PressState, type SideNavigationDestination } from "./side-navigation-parts";
import { typeStyle } from "./typography";
export type { SideNavigationAction, SideNavigationBadgeTone, SideNavigationCollapsedParent, SideNavigationHeadingLevel, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";
export type { SideNavigationDestination, SideNavigationItem, SideNavigationParent, SideNavigationSubParent } from "./side-navigation-parts";

/** A titled run of items. */
export type SideNavigationGroup = Group<SideNavigationDestination>;
export type SideNavigationEntry = Entry<SideNavigationDestination>;
/** A header or footer: content, or a function of collapsed so it can swap to an icon-only form. */
export type SideNavigationSlot = ReactNode | ((collapsed: boolean) => ReactNode);
type Titled = SideNavigationTitledSection<SideNavigationDestination>;

export interface KjunSideNavigationProps {
  /** Destinations, parents with up to two levels under them, and titled groups of either. A destination has the bottom
   * navigation's shape. */
  items: SideNavigationEntry[];
  /** The current destination's key (a child's key when the page is under a parent); null for a page outside the menu. */
  value: string | null;
  ariaLabel?: string;
  /** A press on a destination. On Native Web, modified clicks (new tab) and target links are left to the browser. */
  onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** The open parents, at both levels. Without it the navigation keeps the list itself, starting with the parents of the
   * current destination open. */
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
  /** A group title that opens and closes ends with how many rows its group holds (a dot instead while a closed group has
   * a badge inside). */
  groupCounts?: boolean;
  /** The groups (by key) showing every row past their limit. Without it the navigation keeps the list itself. */
  showAll?: string[];
  onShowAllChange?: (showAll: string[]) => void;
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon).
   * Loose items between groups keep their own row. */
  rail?: SideNavigationRail;
  /** While collapsed: a short name (shortLabel, else the label) under each icon, in a 72 wide column. The current page and a
   * press fill a 56 by 32 indicator around the icon, a count stays a number, and a tooltip shows only a name that was shortened. */
  railLabels?: boolean;
  /** While collapsed, pressing a parent or a rail group: "widen" asks for the full width with it open (onCollapsedChange);
   * "flyout" shows its rows in a panel beside the icon and keeps the column narrow. */
  collapsedParent?: SideNavigationCollapsedParent;
  /** "compact": 32 tall rows and 30 tall children on Native Web, and counts as quiet numbers, for long lists. A device keeps
   * the touch heights. */
  density?: "default" | "compact";
  /** The level of the group titles' headings (default 2; aria-level on Native Web), to fit the page's outline. */
  headingLevel?: SideNavigationHeadingLevel;
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

/**
 * A vertical menu for the side of a wide screen (a tablet, a landscape layout), like Web: the current destination
 * filled, titled groups and up to two levels of children. On a phone use KjunBottomNavigation. Web's linkAs and
 * scrollToCurrent have no Native form: navigate in onNavigate, and scroll the app's ScrollView. Web's arrow-key movement
 * between rows is a keyboard pattern of the browser's DOM and is not drawn here; Tab still reaches every row on Native Web.
 */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange,
  collapsibleGroups = false, expandedGroups, onExpandedGroupsChange, groupCounts = false, showAll, onShowAllChange, rail = "items", railLabels = false,
  collapsedParent = "widen", density = "default", headingLevel = 2, header, footer, collapseToggle = false, onAction }: KjunSideNavigationProps) {
  const m = useKjunMessages(), styles = useKjunStyles(), { colors } = styles, geometry = tokens.extensions.sideNavigation;
  useEffect(() => checkSideNavigation(items), [items]);
  const { sections, open, update, openGroups, updateGroups, allShown, updateShowAll } = useSideNavigationState(items, value,
    { expanded, onExpandedChange, expandedGroups, onExpandedGroupsChange, showAll, onShowAllChange, collapsibleGroups });
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
  const setParent = (key: string, next: boolean) => { if (open.includes(key) !== next) update(toggleSideParent(open, key)); };
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { setParent(key, true); widen(); };
  const revealGroup = (key: string) => {
    if (!openGroups.includes(key) && sections.some(section => section.key === key && sideSectionToggles(section, collapsibleGroups))) updateGroups([...openGroups, key]);
    widen();
  };
  const flyoutMode = collapsed && collapsedParent === "flyout";
  // With names under the icons (railLabels) a collapsed row is 72 wide, an indicator around the icon over a one-line name;
  // the fill moves from the row to the indicator.
  const labelled = collapsed && railLabels;
  const r = sideNavigationRows({ m, styles, value, collapsed, labelled, flyoutMode, density, fadeIn, open, setParent, reveal, flyout, setFlyout, allShown, updateShowAll,
    onNavigate, onReselect, onAction });
  const { base, railWidth } = r;
  // A group title is a heading for assistive technology; Native Web also reads its level.
  const heading = { accessibilityRole: "header" as const, ...(Platform.OS === "web" ? { "aria-level": headingLevel } : {}) };

  // A group title that opens and closes its group. Its end holds what a parent row's end holds: a dot for a badge inside a
  // closed group, or the number of rows (groupCounts), then a small chevron that turns over when open. Closed over the
  // current page, the name takes full ink.
  const groupToggle = (section: Titled, rows: ReactNode) => {
    const { shown, within, dot, tone, count } = sideGroupState(section, { openGroups, value }), action = section.action;
    // On a device a header around a button would hide the button from the screen reader, so only Native Web wraps it in one.
    return <>
      <Animated.View {...(Platform.OS === "web" ? heading : {})} style={{ minWidth: 0, opacity: fadeIn }}>
        <Pressable focusRingInset hitSlop={r.slop(r.groupHeight)} accessibilityRole="button" accessibilityState={{ expanded: shown }}
          accessibilityLabel={sideNavigationToggleName(section.title, dot, m)} onPress={() => updateGroups(toggleSideParent(openGroups, section.key))}
          style={(state: PressState) => ({ height: r.groupHeight, flexDirection: "row", alignItems: "center", gap: geometry.groupChevronGap, borderRadius: geometry.radius,
            paddingStart: geometry.paddingX, paddingEnd: geometry.paddingX + (action ? r.actionsWidth(1) : 0), backgroundColor: r.fill(base, undefined, false, state) })}>
          {(state: PressState) => { const color = within || state.pressed ? colors.text : colors.textTertiary; return <>
            <KText numberOfLines={1} ellipsizeMode="tail" style={{ ...typeStyle("caption"), flex: 1, minWidth: 0, fontWeight: typeStyle("control").fontWeight, color }}>{section.title}</KText>
            {dot ? r.endMark(true, tone) : groupCounts ? <KText aria-hidden={true} importantForAccessibility="no" style={r.quiet}>{count}</KText> : null}
            {r.chevron(shown, geometry.groupChevronSize, color)}
          </>; }}
        </Pressable>
        {action && r.actionButtons(section.key, [action])}
      </Animated.View>
      <Collapse open={shown}><View style={{ gap: geometry.itemGap }}>{rows}</View></Collapse>
    </>;
  };
  // A static title, with the group's action level with its text.
  const staticTitle = (section: Titled, index: number) => {
    const action = section.action, bottom = geometry.titlePaddingBottom - geometry.itemGap;
    return <Animated.View style={{ minWidth: 0, opacity: fadeIn }}>
      <KText {...heading} style={{ ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, color: colors.textTertiary,
        paddingTop: index ? geometry.titlePaddingTop : 0, paddingBottom: bottom, paddingStart: geometry.paddingX, paddingEnd: geometry.paddingX + (action ? r.actionsWidth(1) : 0) }}>{section.title}</KText>
      {action && r.actionButtons(section.key, [action], { top: undefined, bottom: bottom - (geometry.actionSize - typeStyle("caption").lineHeight) / 2, height: geometry.actionSize })}
    </Animated.View>;
  };
  // Icons only, a group's title stays a heading for assistive technology (Web's kjun-sr-only) but takes no room.
  const hiddenTitle = (section: Titled) => <View style={{ position: "absolute", top: 0, start: 0, end: 0, opacity: 0 }} pointerEvents="none">
    <KText {...heading} numberOfLines={1}>{section.title}</KText>
  </View>;
  const section = (entry: SideNavigationSection<SideNavigationDestination>, index: number) => {
    const rows = r.groupRows(base, entry);
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
        {titled && (collapsed ? hiddenTitle(titled) : staticTitle(titled, index))}
        {rows}
      </>}
    </View>;
  };
  // A group in a rail of groups: its icon (or initial) with the opens mark, half the selection fill while it holds the
  // current page, and a dot when an item in it has a badge. Pressing it widens with the group open, or opens its rows
  // beside it (flyout).
  const railGroup = (group: Titled) => {
    const { within, dot, tone } = sideRailGroupState(group, value), shown = sideNavigationShownTitle(group, labelled), key = sideFlyoutKey("group", group.key);
    const under = (state: PressState) => r.fill(base, within ? "within" : undefined, false, state);
    const button = <Pressable focusRingInset hitSlop={labelled ? undefined : r.slop(r.itemHeight)} accessibilityRole="button" accessibilityLabel={sideNavigationToggleName(group.title, dot, m)}
      onPress={flyoutMode ? undefined : () => revealGroup(group.key)} style={(state: PressState) => ({ ...r.box(base, r.itemHeight, 0), backgroundColor: r.rowFill(base, under(state)) })}>
      {(state: PressState) => { const lit = within || state.pressed; return <>
        {r.glyph(base, group.icon, group.title, false, r.ink(lit), <>{dot && r.corner(true, tone, under(state))}{r.opens(under(state))}</>, under(state))}
        {r.label(base, shown, within, r.nameInk(base, lit))}
      </>; }}
    </Pressable>;
    return <View key={key}>
      {flyoutMode ? r.flyoutPanel(key, group.title, r.named(base, group.title, shown, button), sideSectionEmpty(group) ? r.emptyRow(group.empty!, true) : group.items.map(item => r.row(FLYOUT, item)))
        : r.named(base, group.title, shown, button)}
    </View>;
  };

  const slot = (given: SideNavigationSlot) => typeof given === "function" ? given(collapsed) : given;
  const top = slot(header), bottom = slot(footer), hasTop = top != null && top !== false, hasBottom = bottom != null && bottom !== false;
  // Header and footer take a row's width while collapsed, so what they hold centres over the icons.
  const narrow: ViewStyle | undefined = collapsed ? { width: railWidth, alignItems: "center" } : undefined;
  const toggleLabel = collapsed ? m.expandNavigation : m.collapseNavigation;
  const toggleButton = collapseToggle && <KjunTooltip content={toggleLabel} placement="right">
    <Pressable focusRingInset hitSlop={r.slop(collapsed ? geometry.itemHeight : geometry.toggleSize)} accessibilityRole="button" accessibilityLabel={toggleLabel}
      accessibilityState={{ expanded: !collapsed }} onPress={() => onCollapsedChange?.(!collapsed)}
      // The toggle is a small button at the footer's end, and a row like the others above the footer's content while collapsed.
      style={(state: PressState) => ({ alignItems: "center", justifyContent: "center", backgroundColor: r.fill(base, undefined, false, state),
        ...(collapsed ? { width: railWidth, height: geometry.itemHeight, borderRadius: geometry.radius }
          : { width: geometry.toggleSize, height: geometry.toggleSize, borderRadius: geometry.toggleRadius, marginStart: "auto" }) })}>
      {/* The sidebar icons are outside the default icon set, so the toggle carries them itself. */}
      {(state: PressState) => <IconFallbacks icons={componentIcons}>
        <KjunIcon name={collapsed ? "layout-sidebar-left-expand" : "layout-sidebar-left-collapse"} size={geometry.iconSize} color={r.ink(state.pressed)} />
      </IconFallbacks>}
    </Pressable>
  </KjunTooltip>;
  return <View role="navigation" accessibilityLabel={ariaLabel ?? m.mainNavigation} style={{ minWidth: 0, gap: geometry.chromeGap }}>
    {hasTop && <Animated.View style={{ minWidth: 0, opacity: fadeIn, ...narrow }}>{content(top)}</Animated.View>}
    <View style={{ minWidth: 0 }}>
      {collapsed && rail === "groups"
        ? <View style={{ gap: geometry.itemGap }}>{sideNavigationGroupRail(items).map(entry => "group" in entry ? railGroup(entry.group) : r.row(base, entry.item))}</View>
        : sections.map(section)}
    </View>
    {(hasBottom || toggleButton) && <View style={{ minWidth: 0, gap: geometry.gap, alignItems: "center", flexDirection: collapsed ? "column-reverse" : "row", ...narrow }}>
      {hasBottom && <Animated.View style={{ minWidth: 0, opacity: fadeIn, ...(collapsed ? {} : { flex: 1 }) }}>{content(bottom)}</Animated.View>}
      {toggleButton}
    </View>}
  </View>;
}
