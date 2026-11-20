import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { sideNavigationRailRequest, type SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useCallback, useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { KjunDrawer } from "./drawer";
import { SpacesLayout } from "./side-navigation-layout-spaces";
import { spacesIgnoredProps, type SideNavigationPanelSurface } from "../../../shared/package-runtime/side-navigation-layout";
export type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
export type { SideNavigationPanelSurface } from "../../../shared/package-runtime/side-navigation-layout";

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
  /** railBreakpoint asks to collapse or widen the column as the viewport crosses it. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Below this viewport width the column asks to shrink to the rail (onCollapsedChange(true)), and above it to widen
   * again; between crossings the menu's own toggle stands. Default 0, off. */
  railBreakpoint?: number;
  /** The menu shows names under its icons while collapsed (KjunSideNavigation railLabels), so the rail is wider. */
  railLabels?: boolean;
  /** The open column's width: sm 224, md 256 (default), lg 288. */
  width?: SideNavigationWidth;
  /** The column stays in view as the page scrolls (default), the viewport's height, scrolling on its own. false lets it
   * scroll away with the page. */
  sticky?: boolean;
  /** How far below the viewport's top the sticky column stays, such as the height of a fixed top bar; the column is
   * that much shorter than the viewport. Default 0. */
  stickyOffset?: number;
  /** Below this viewport width the column goes away and the menu opens in a drawer from the start edge (navOpen).
   * Default tokens.responsive.sideNavigationLayout (768); 0 keeps the column at every width. */
  breakpoint?: number;
  /** The drawer of a narrow screen. Open it from the app's own menu button, and close it with the nav state's
   * closeDrawer. Widening past the breakpoint closes it (onNavOpenChange(false)). */
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /** The drawer's name for assistive technology; the menu's name by default. */
  drawerLabel?: string;
  /** A rail of spaces, usually a collapsed KjunSideNavigation, before a menu panel that holds nav. The rail and the panel sit
   * in a band in the navigation-rail-bg colour; the panel's head shows spacesTitle and a collapse button, and below the
   * breakpoint the drawer holds both. With spaces, collapsed, railLabels and width do not apply, and railBreakpoint asks
   * onPanelCollapsedChange instead. A function receives where it is drawn (collapsed is true: the rail is a collapsed menu). */
  spaces?: ReactNode | ((state: SideNavigationLayoutState) => ReactNode);
  /** The chosen space's name at the top of the panel, on one line. */
  spacesTitle?: ReactNode;
  /** The panel: a card set into the band ("card", default) or flat against it with a line before the page ("flat"). */
  panelSurface?: SideNavigationPanelSurface;
  /** The panel is collapsed and only the rail stays; the rail's top cell then holds the expand button. Default false. */
  panelCollapsed?: boolean;
  onPanelCollapsedChange?: (collapsed: boolean) => void;
  /** The panel's name for assistive technology; "메뉴 패널" by default. */
  panelLabel?: string;
  className?: string;
}

const subscribeTo = (query: string) => (notify: () => void) => {
  if (typeof matchMedia !== "function") return () => {};
  const list = matchMedia(query);
  list.addEventListener("change", notify);
  return () => list.removeEventListener("change", notify);
};
/** Whether the viewport is narrower than a width (never for 0). The server and the first render take the wide layout. */
function useNarrow(breakpoint: number) {
  const query = `(width < ${breakpoint}px)`;
  const subscribe = useCallback(subscribeTo(query), [query]);
  return useSyncExternalStore(subscribe, () => breakpoint > 0 && typeof matchMedia === "function" && matchMedia(query).matches, () => false);
}

/** A page with a side menu: a column that keeps the menu's width tokens (open or collapsed, sticky by default) beside the
 * page, and a drawer for the menu below a breakpoint. The column's width follows collapsed with the collapse motion. */
export function KjunSideNavigationLayout({ nav, children, collapsed = false, onCollapsedChange, railBreakpoint = 0, railLabels = false, width = "md", sticky = true,
  stickyOffset = 0, breakpoint = tokens.responsive.sideNavigationLayout, navOpen = false, onNavOpenChange, drawerLabel, spaces, spacesTitle, panelSurface = "card",
  panelCollapsed = false, onPanelCollapsedChange, panelLabel, className }: KjunSideNavigationLayoutProps) {
  const m = useKjunMessages(), narrow = useNarrow(breakpoint), below = useNarrow(railBreakpoint);
  // With spaces the rail is the collapsed column, so railBreakpoint folds the panel instead.
  const spaced = spaces != null && spaces !== false;
  const folded = spaced ? panelCollapsed : collapsed, onFold = spaced ? onPanelCollapsedChange : onCollapsedChange;
  const latest = useRef({ collapsed: folded, navOpen, onCollapsedChange: onFold, onNavOpenChange }); latest.current = { collapsed: folded, navOpen, onCollapsedChange: onFold, onNavOpenChange };
  const warned = useRef(false);
  useEffect(() => {
    if (!spaced || warned.current || process.env.NODE_ENV === "production") return;
    const ignored = spacesIgnoredProps({ collapsed, railLabels, width });
    if (ignored.length > 0) { warned.current = true; console.warn(`KjunSideNavigationLayout: ${ignored.join(", ")} do not apply with spaces.`); }
  }, [spaced, collapsed, railLabels, width]);
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
  const classes = "kjun-side-navigation-layout" + (className ? " " + className : "");
  const offset = sticky && stickyOffset > 0 ? { ["--_kjun-side-navigation-layout-top" as string]: stickyOffset + "px" } as CSSProperties : undefined;
  if (spaced) return <SpacesLayout spaces={spaces} nav={nav} spacesTitle={spacesTitle} panelSurface={panelSurface} panelCollapsed={panelCollapsed}
    onPanelCollapsedChange={onPanelCollapsedChange} panelLabel={panelLabel} narrow={narrow} navOpen={navOpen} onNavOpenChange={onNavOpenChange}
    closeDrawer={closeDrawer} drawerLabel={drawerLabel} sticky={sticky} offset={offset} classes={classes}>{children}</SpacesLayout>;
  if (narrow) return <div className={classes} data-drawer="">
    <div className="kjun-side-navigation-layout-main">{children}</div>
    <KjunDrawer open={navOpen} onOpenChange={next => onNavOpenChange?.(next)} position="left" ariaLabel={drawerLabel ?? m.mainNavigation}
      width={tokens.extensions.sideNavigation.width[width]}>{menu({ collapsed: false, drawer: true })}</KjunDrawer>
  </div>;
  return <div className={classes} data-width={width === "md" ? undefined : width} data-collapsed={collapsed ? "" : undefined}
    data-rail-labels={collapsed && railLabels ? "" : undefined} data-sticky={sticky ? undefined : "false"} style={offset}>
    <div className="kjun-side-navigation-layout-nav">{menu({ collapsed, drawer: false })}</div>
    <div className="kjun-side-navigation-layout-main">{children}</div>
  </div>;
}
