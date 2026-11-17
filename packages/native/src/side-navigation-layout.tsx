import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { KjunDrawer } from "./drawer";
import { useReducedMotion } from "./internal";
import { motionOut } from "./motion";
export type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";

/** Where the menu is drawn: in the column (collapsed or open) or in the drawer of a narrow screen, which is always open. */
export type SideNavigationLayoutState = { collapsed: boolean; drawer: boolean };
export interface KjunSideNavigationLayoutProps {
  /** The menu, usually a KjunSideNavigation. A function receives where it is drawn, so it can pass collapsed on and show
   * the full menu in the drawer. */
  nav: ReactNode | ((state: SideNavigationLayoutState) => ReactNode);
  /** The page beside the menu. */
  children?: ReactNode;
  /** The column shrinks to the rail of icons. Pass the same value to the menu. */
  collapsed?: boolean;
  /** The menu shows names under its icons while collapsed (KjunSideNavigation railLabels), so the rail is wider. */
  railLabels?: boolean;
  /** The open column's width: sm 224, md 256 (default), lg 288. */
  width?: SideNavigationWidth;
  /** Below this window width the column goes away and the menu opens in a drawer from the left (navOpen).
   * Default tokens.responsive.sideNavigationLayout (768); 0 keeps the column at every width. */
  breakpoint?: number;
  /** The drawer of a narrow screen. Open it from the app's own menu button, and close it in the menu's onNavigate. */
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /** The drawer's name for assistive technology; the menu's name by default. */
  drawerLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** A screen with a side menu: a column that keeps the menu's width tokens (open or collapsed) beside the page, and a drawer
 * for the menu below a breakpoint. The column's width follows collapsed with the collapse motion. Web's sticky has no
 * Native form: the layout fills the space the app gives it, and the app owns scrolling (a ScrollView inside the menu's
 * column or around the page). */
export function KjunSideNavigationLayout({ nav, children, collapsed = false, railLabels = false, width = "md", breakpoint = tokens.responsive.sideNavigationLayout,
  navOpen = false, onNavOpenChange, drawerLabel, style }: KjunSideNavigationLayoutProps) {
  const m = useKjunMessages(), screen = useWindowDimensions(), reduced = useReducedMotion(), geometry = tokens.extensions.sideNavigation;
  const narrow = breakpoint > 0 && screen.width < breakpoint;
  const menu = (state: SideNavigationLayoutState) => typeof nav === "function" ? nav(state) : nav;
  // Open: one of three widths. Collapsed: the rail (a row's padding and icon, or a labelled rail's item) plus the column's padding.
  const labelled = collapsed && railLabels, paddingX = labelled ? geometry.railColumnPaddingX : geometry.columnPaddingX;
  const target = !collapsed ? geometry.width[width] : labelled ? geometry.railItemWidth + paddingX * 2 : geometry.paddingX * 2 + geometry.iconSize + paddingX * 2;
  const columnWidth = useRef(new Animated.Value(target)).current, first = useRef(true);
  useEffect(() => {
    if (first.current || reduced) { first.current = false; columnWidth.setValue(target); return; }
    // Width is a layout property, so the native driver cannot animate it.
    const motion = Animated.timing(columnWidth, { toValue: target, duration: tokens.motion.collapse, easing: motionOut, useNativeDriver: false });
    motion.start();
    return () => motion.stop();
  }, [target, reduced]);
  if (narrow) return <View style={[{ flex: 1, minWidth: 0 }, style]}>
    <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    <KjunDrawer open={navOpen} onOpenChange={next => onNavOpenChange?.(next)} position="left" ariaLabel={drawerLabel ?? m.mainNavigation}
      width={geometry.width[width]}>{menu({ collapsed: false, drawer: true })}</KjunDrawer>
  </View>;
  return <View style={[{ flex: 1, minWidth: 0, flexDirection: "row" }, style]}>
    <Animated.View style={{ width: columnWidth, flexShrink: 0, overflow: "hidden", paddingVertical: geometry.columnPaddingY, paddingHorizontal: paddingX }}>
      {menu({ collapsed, drawer: false })}
    </Animated.View>
    <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
  </View>;
}
