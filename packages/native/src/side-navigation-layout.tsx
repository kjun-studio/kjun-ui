import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { sideNavigationRailRequest, type SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Platform, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { KjunDrawer } from "./drawer";
import { useReducedMotion } from "./internal";
import { motionOut } from "./motion";
export type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";

/** Where the menu is drawn: in the column (collapsed or open) or in the drawer of a narrow screen, which is always open.
 * closeDrawer closes that drawer, e.g. in the menu's onNavigate; in the column it does nothing. */
export type SideNavigationLayoutState = { collapsed: boolean; drawer: boolean; closeDrawer: () => void };
export interface KjunSideNavigationLayoutProps {
  /** The menu, usually a KjunSideNavigation. A function receives where it is drawn, so it can pass collapsed on, show
   * the full menu in the drawer and close the drawer after navigating. */
  nav: ReactNode | ((state: SideNavigationLayoutState) => ReactNode);
  /** The page beside the menu. */
  children?: ReactNode;
  /** The column shrinks to the rail of icons. Pass the same value to the menu. */
  collapsed?: boolean;
  /** railBreakpoint asks to collapse or widen the column as the window crosses it. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Below this window width the column asks to shrink to the rail (onCollapsedChange(true)), and above it to widen
   * again; between crossings the menu's own toggle stands. Default 0, off. */
  railBreakpoint?: number;
  /** The menu shows names under its icons while collapsed (KjunSideNavigation railLabels), so the rail is wider. */
  railLabels?: boolean;
  /** The open column's width: sm 224, md 256 (default), lg 288. */
  width?: SideNavigationWidth;
  /** Below this window width the column goes away and the menu opens in a drawer from the left (navOpen).
   * Default tokens.responsive.sideNavigationLayout (768); 0 keeps the column at every width. */
  breakpoint?: number;
  /** The drawer of a narrow screen. Open it from the app's own menu button, and close it with the nav state's
   * closeDrawer. Widening past the breakpoint closes it (onNavOpenChange(false)). */
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /** The drawer's name for assistive technology; the menu's name by default. */
  drawerLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// React Native Web prints dataSet as data-*, so the packed web contracts and anatomy figures can find the column and the page.
const part = (name: "nav" | "main") => (Platform.OS === "web" ? { dataSet: { kjunSideNavigationLayoutPart: name } } : {});

/** A screen with a side menu: a column that keeps the menu's width tokens (open or collapsed) beside the page, and a drawer
 * for the menu below a breakpoint. The column's width follows collapsed with the collapse motion. Web's sticky has no
 * Native form: the layout fills the space the app gives it, and the app owns scrolling (a ScrollView inside the menu's
 * column or around the page), so Web's stickyOffset has none either. */
export function KjunSideNavigationLayout({ nav, children, collapsed = false, onCollapsedChange, railBreakpoint = 0, railLabels = false, width = "md",
  breakpoint = tokens.responsive.sideNavigationLayout, navOpen = false, onNavOpenChange, drawerLabel, style }: KjunSideNavigationLayoutProps) {
  const m = useKjunMessages(), screen = useWindowDimensions(), reduced = useReducedMotion(), geometry = tokens.extensions.sideNavigation;
  const narrow = breakpoint > 0 && screen.width < breakpoint, below = railBreakpoint > 0 && screen.width < railBreakpoint;
  const latest = useRef({ collapsed, navOpen, onCollapsedChange, onNavOpenChange }); latest.current = { collapsed, navOpen, onCollapsedChange, onNavOpenChange };
  // Widening past the breakpoint takes the drawer away, so it closes rather than opening again on the next narrowing.
  const wasNarrow = useRef(narrow);
  useEffect(() => {
    if (wasNarrow.current && !narrow && latest.current.navOpen) latest.current.onNavOpenChange?.(false);
    wasNarrow.current = narrow;
  }, [narrow]);
  const wasBelow = useRef<boolean | null>(null);
  useEffect(() => {
    if (railBreakpoint <= 0) { wasBelow.current = null; return; }
    const request = sideNavigationRailRequest(wasBelow.current, below, latest.current.collapsed);
    wasBelow.current = below;
    if (request !== null) latest.current.onCollapsedChange?.(request);
  }, [below, railBreakpoint]);
  const closeDrawer = () => { if (latest.current.navOpen) latest.current.onNavOpenChange?.(false); };
  const menu = (state: Omit<SideNavigationLayoutState, "closeDrawer">) => typeof nav === "function" ? nav({ ...state, closeDrawer }) : nav;
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
    <View style={{ flex: 1, minWidth: 0 }} {...part("main")}>{children}</View>
    <KjunDrawer open={navOpen} onOpenChange={next => onNavOpenChange?.(next)} position="left" ariaLabel={drawerLabel ?? m.mainNavigation}
      width={geometry.width[width]}>{menu({ collapsed: false, drawer: true })}</KjunDrawer>
  </View>;
  return <View style={[{ flex: 1, minWidth: 0, flexDirection: "row" }, style]}>
    <Animated.View style={{ width: columnWidth, flexShrink: 0, overflow: "hidden", paddingVertical: geometry.columnPaddingY, paddingHorizontal: paddingX }} {...part("nav")}>
      {menu({ collapsed, drawer: false })}
    </Animated.View>
    <View style={{ flex: 1, minWidth: 0 }} {...part("main")}>{children}</View>
  </View>;
}
