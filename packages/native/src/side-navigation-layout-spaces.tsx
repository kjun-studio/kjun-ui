import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { spacesColumnWidth, spacesFocusAfterChange, spacesRailCellWidth, type SideNavigationPanelSurface } from "../../../shared/package-runtime/side-navigation-layout";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, findNodeHandle, Platform, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KjunDrawer } from "./drawer";
import { KText, useReducedMotion } from "./internal";
import { motionOut } from "./motion";
import { KjunTooltip } from "./popover";
import { useKjunStyles } from "./provider";
import { SpacesRailSelectedFill, type PressState } from "./side-navigation-parts";
import { typeStyle } from "./typography";

type State = { collapsed: boolean; drawer: boolean; closeDrawer: () => void };
type Slot = ReactNode | ((state: State) => ReactNode);
export interface SpacesLayoutProps {
  spaces: Slot; nav: Slot; children?: ReactNode; spacesTitle?: ReactNode; panelSurface: SideNavigationPanelSurface; panelCollapsed: boolean;
  onPanelCollapsedChange?: (collapsed: boolean) => void; panelLabel?: string; narrow: boolean; navOpen: boolean; onNavOpenChange?: (open: boolean) => void;
  closeDrawer: () => void; drawerLabel?: string; style?: StyleProp<ViewStyle>;
}

// React Native Web prints dataSet as data-*, so the packed web contracts can find the band's parts.
const part = (name: "nav" | "main" | "spaces" | "panel") => (Platform.OS === "web" ? { dataSet: { kjunSideNavigationLayoutPart: name } } : {});
const web = Platform.OS === "web";

/** KjunSideNavigationLayout with a spaces rail on Native: the band in the rail colour holds the rail and the menu panel. A
 * collapsed panel stays mounted (its menu keeps open groups) but leaves the screen reader once the column has narrowed. */
export function SpacesLayout(p: SpacesLayoutProps) {
  const m = useKjunMessages(), { colors } = useKjunStyles(), reduced = useReducedMotion(), geometry = tokens.extensions.sideNavigation;
  const panelId = "kjun-side-panel-" + useId().replace(/[^\w-]/g, "");
  const card = p.panelSurface === "card", panel = useRef<View>(null), expand = useRef<View>(null), collapse = useRef<View>(null);
  const target = spacesColumnWidth(geometry, p.panelSurface, p.panelCollapsed);
  const width = useRef(new Animated.Value(target)).current, first = useRef(true), byButton = useRef(false);
  const [settled, setSettled] = useState(p.panelCollapsed);
  useEffect(() => {
    if (first.current) { first.current = false; width.setValue(target); return; }
    const inPanel = web && !!panel.current && (panel.current as unknown as HTMLElement).contains(document.activeElement);
    const focus = spacesFocusAfterChange(p.panelCollapsed, inPanel, byButton.current);
    byButton.current = false;
    const button = focus === "expand" ? expand.current : focus === "collapse" ? collapse.current : null;
    if (button) {
      if (web) (button as unknown as HTMLElement).focus();
      else { const tag = findNodeHandle(button); if (tag) AccessibilityInfo.setAccessibilityFocus(tag); }
    }
    if (!p.panelCollapsed) setSettled(false);
    if (reduced) { width.setValue(target); if (p.panelCollapsed) setSettled(true); return; }
    // Width is a layout property, so the native driver cannot animate it.
    const motion = Animated.timing(width, { toValue: target, duration: tokens.motion.collapse, easing: motionOut, useNativeDriver: false });
    motion.start(({ finished }) => { if (finished && p.panelCollapsed) setSettled(true); });
    return () => motion.stop();
  }, [target, reduced]);
  const request = (next: boolean) => { byButton.current = true; p.onPanelCollapsedChange?.(next); };
  const render = (slot: Slot, state: State) => typeof slot === "function" ? slot(state) : slot;
  const button = (label: string, icon: string, onPress: () => void, ref?: typeof expand, expanded?: boolean) =>
    <Pressable ref={ref} focusRingInset accessibilityRole="button" accessibilityLabel={label} accessibilityState={expanded === undefined ? undefined : { expanded }} aria-controls={expanded === undefined ? undefined : panelId} onPress={onPress}
      style={({ pressed, hovered }: PressState) => ({ width: geometry.toggleSize, height: geometry.toggleSize, borderRadius: geometry.toggleRadius, alignItems: "center",
        justifyContent: "center", backgroundColor: pressed ? colors.active : hovered ? colors.hover : "transparent" })}>
      {(state: PressState) => <IconFallbacks icons={componentIcons}><KjunIcon name={icon} size={geometry.iconSize} color={state.pressed ? colors.text : colors.textSecondary} /></IconFallbacks>}
    </Pressable>;
  const toggle = (next: boolean, ref: typeof expand) => {
    const label = next ? m.collapseSpacesPanel : m.expandSpacesPanel;
    return <KjunTooltip content={label} placement="right">{button(label, next ? "layout-sidebar-left-collapse" : "layout-sidebar-left-expand", () => request(next), ref, !p.panelCollapsed)}</KjunTooltip>;
  };
  const head: ViewStyle = { height: geometry.spacesPanelHeadHeight, marginBottom: geometry.groupGap, flexDirection: "row", alignItems: "center" };
  const band = (drawer: boolean) => {
    const closed = !drawer && p.panelCollapsed, hidden = closed && settled;
    return <>
      <View style={{ width: spacesRailCellWidth(geometry), flexShrink: 0, alignItems: "center", paddingVertical: geometry.columnPaddingY }} {...part("spaces")}>
        <View style={{ ...head, alignSelf: "stretch", justifyContent: "center" }}>{closed && <View>{toggle(false, expand)}</View>}</View>
        <SpacesRailSelectedFill.Provider value={colors.background}>{render(p.spaces, { collapsed: true, drawer, closeDrawer: p.closeDrawer })}</SpacesRailSelectedFill.Provider>
      </View>
      <View ref={panel} role="region" nativeID={panelId} accessibilityLabel={p.panelLabel ?? m.spacesPanel} accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
        style={{ width: geometry.spacesPanelWidth, flexShrink: 0, display: hidden ? "none" : "flex", backgroundColor: colors.background,
          paddingHorizontal: geometry.spacesPanelInset, paddingBottom: geometry.columnPaddingY,
          ...(card ? { marginVertical: geometry.spacesPanelInset, marginEnd: geometry.spacesPanelInset, borderRadius: geometry.spacesPanelRadius,
            paddingTop: geometry.columnPaddingY - geometry.spacesPanelInset }
            : { paddingTop: geometry.columnPaddingY, borderEndWidth: tokens.border.defaultWidth, borderEndColor: colors.divider }) }} {...part("panel")}>
        <View style={{ ...head, gap: geometry.itemGap, paddingStart: geometry.paddingX, paddingEnd: (geometry.spacesPanelHeadHeight - geometry.toggleSize) / 2 }}>
          {p.spacesTitle != null && p.spacesTitle !== false && <KText numberOfLines={1} style={{ flex: 1, minWidth: 0, color: colors.text, ...typeStyle("cardTitle") }}>{p.spacesTitle}</KText>}
          <View style={{ marginStart: "auto" }}>{drawer ? button(m.close, "x", p.closeDrawer) : (!closed || !settled) && toggle(true, collapse)}</View>
        </View>
        {render(p.nav, { collapsed: false, drawer, closeDrawer: p.closeDrawer })}
      </View>
    </>;
  };
  if (p.narrow) return <View style={[{ flex: 1, minWidth: 0 }, p.style]}>
    <View style={{ flex: 1, minWidth: 0 }} {...part("main")}>{p.children}</View>
    <KjunDrawer open={p.navOpen} onOpenChange={next => p.onNavOpenChange?.(next)} position="left" ariaLabel={p.drawerLabel ?? m.mainNavigation}
      width={spacesColumnWidth(geometry, p.panelSurface, false)} closable={false} noPadding
      // The band's colour reaches the drawer's foot under a short menu.
      renderScrollView={props => <ScrollView {...props} contentContainerStyle={[props.contentContainerStyle, { flexGrow: 1 }]} />}>
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.navigationRailBg }}>{band(true)}</View>
    </KjunDrawer>
  </View>;
  return <View style={[{ flex: 1, minWidth: 0, flexDirection: "row" }, p.style]}>
    <Animated.View style={{ width, flexShrink: 0, overflow: "hidden", flexDirection: "row", backgroundColor: colors.navigationRailBg }} {...part("nav")}>{band(false)}</Animated.View>
    <View style={{ flex: 1, minWidth: 0 }} {...part("main")}>{p.children}</View>
  </View>;
}
