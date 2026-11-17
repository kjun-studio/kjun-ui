import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import type { SideNavigationWidth } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { KjunDrawer } from "./drawer";
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
  /** The column stays in view as the page scrolls (default), the viewport's height, scrolling on its own. false lets it
   * scroll away with the page. */
  sticky?: boolean;
  /** Below this viewport width the column goes away and the menu opens in a drawer from the start edge (navOpen).
   * Default tokens.responsive.sideNavigationLayout (768); 0 keeps the column at every width. */
  breakpoint?: number;
  /** The drawer of a narrow screen. Open it from the app's own menu button, and close it in the menu's onNavigate. */
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /** The drawer's name for assistive technology; the menu's name by default. */
  drawerLabel?: string;
  className?: string;
}

const subscribeTo = (query: string) => (notify: () => void) => {
  if (typeof matchMedia !== "function") return () => {};
  const list = matchMedia(query);
  list.addEventListener("change", notify);
  return () => list.removeEventListener("change", notify);
};
/** Whether the viewport is narrower than the breakpoint. The server and the first render take the wide layout. */
function useNarrow(breakpoint: number) {
  const query = `(width < ${breakpoint}px)`;
  const subscribe = useCallback(subscribeTo(query), [query]);
  return useSyncExternalStore(subscribe, () => breakpoint > 0 && typeof matchMedia === "function" && matchMedia(query).matches, () => false);
}

/** A page with a side menu: a column that keeps the menu's width tokens (open or collapsed, sticky by default) beside the
 * page, and a drawer for the menu below a breakpoint. The column's width follows collapsed with the collapse motion. */
export function KjunSideNavigationLayout({ nav, children, collapsed = false, railLabels = false, width = "md", sticky = true,
  breakpoint = tokens.responsive.sideNavigationLayout, navOpen = false, onNavOpenChange, drawerLabel, className }: KjunSideNavigationLayoutProps) {
  const m = useKjunMessages(), narrow = useNarrow(breakpoint);
  const menu = (state: SideNavigationLayoutState) => typeof nav === "function" ? nav(state) : nav;
  const classes = "kjun-side-navigation-layout" + (className ? " " + className : "");
  if (narrow) return <div className={classes} data-drawer="">
    <div className="kjun-side-navigation-layout-main">{children}</div>
    <KjunDrawer open={navOpen} onOpenChange={next => onNavOpenChange?.(next)} position="left" ariaLabel={drawerLabel ?? m.mainNavigation}
      width={tokens.extensions.sideNavigation.width[width]}>{menu({ collapsed: false, drawer: true })}</KjunDrawer>
  </div>;
  return <div className={classes} data-width={width === "md" ? undefined : width} data-collapsed={collapsed ? "" : undefined}
    data-rail-labels={collapsed && railLabels ? "" : undefined} data-sticky={sticky ? undefined : "false"}>
    <div className="kjun-side-navigation-layout-nav">{menu({ collapsed, drawer: false })}</div>
    <div className="kjun-side-navigation-layout-main">{children}</div>
  </div>;
}
