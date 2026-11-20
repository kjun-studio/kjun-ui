import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { spacesColumnWidth, spacesFocusAfterChange, type SideNavigationPanelSurface } from "../../../shared/package-runtime/side-navigation-layout";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { KjunIcon } from "./button";
import { KjunDrawer } from "./drawer";
import { KjunTooltip } from "./popover";
import { useReducedMotion } from "./use-reduced-motion";

type Slot<S> = ReactNode | ((state: S) => ReactNode);
type State = { collapsed: boolean; drawer: boolean; closeDrawer: () => void };
export interface SpacesLayoutProps {
  spaces: Slot<State>;
  nav: Slot<State>;
  children?: ReactNode;
  spacesTitle?: ReactNode;
  panelSurface: SideNavigationPanelSurface;
  panelCollapsed: boolean;
  onPanelCollapsedChange?: (collapsed: boolean) => void;
  panelLabel?: string;
  narrow: boolean;
  navOpen: boolean;
  onNavOpenChange?: (open: boolean) => void;
  closeDrawer: () => void;
  drawerLabel?: string;
  sticky: boolean;
  offset?: CSSProperties;
  classes: string;
}

/** KjunSideNavigationLayout with a spaces rail: a band in the rail colour holds the rail and the menu panel, whose head
 * carries the space's name and the collapse button; the rail's top cell holds the expand button while the panel is
 * collapsed. Below the breakpoint the whole band opens in the drawer, the panel always open there. */
export function SpacesLayout(p: SpacesLayoutProps) {
  const m = useKjunMessages(), reduced = useReducedMotion(), panelId = "kjun-side-panel-" + useId().replace(/[^\w-]/g, "");
  const panel = useRef<HTMLElement>(null), expand = useRef<HTMLButtonElement>(null), collapse = useRef<HTMLButtonElement>(null);
  // A collapsing panel stays in the page while the column narrows, then leaves the tab order and the accessibility tree.
  const [settled, setSettled] = useState(p.panelCollapsed);
  const byButton = useRef(false), first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const inPanel = !!panel.current && panel.current.contains(document.activeElement);
    const target = spacesFocusAfterChange(p.panelCollapsed, inPanel, byButton.current);
    byButton.current = false;
    if (target === "expand") expand.current?.focus(); else if (target === "collapse") collapse.current?.focus();
    if (!p.panelCollapsed) { setSettled(false); return; }
    const timer = setTimeout(() => setSettled(true), reduced ? 0 : tokens.motion.collapse);
    return () => clearTimeout(timer);
  }, [p.panelCollapsed]);
  const request = (next: boolean) => { byButton.current = true; p.onPanelCollapsedChange?.(next); };
  const render = (slot: Slot<State>, state: State) => typeof slot === "function" ? slot(state) : slot;
  const toggle = (next: boolean, ref: typeof expand) => {
    const label = next ? m.collapseSpacesPanel : m.expandSpacesPanel;
    return <KjunTooltip content={label} placement="right">
      <button ref={ref} type="button" className="kjun-side-navigation-toggle kjun-side-navigation-layout-panel-toggle" aria-label={label}
        aria-expanded={!p.panelCollapsed} aria-controls={panelId} onClick={() => request(next)}>
        <IconFallbacks icons={componentIcons}><KjunIcon name={next ? "layout-sidebar-left-collapse" : "layout-sidebar-left-expand"} size={tokens.extensions.sideNavigation.iconSize} /></IconFallbacks>
      </button>
    </KjunTooltip>;
  };
  const band = (drawer: boolean) => {
    const closed = !drawer && p.panelCollapsed;
    return <>
      <div className="kjun-side-navigation-layout-spaces">
        <div className="kjun-side-navigation-layout-spaces-top">{closed && toggle(false, expand)}</div>
        {render(p.spaces, { collapsed: true, drawer, closeDrawer: p.closeDrawer })}
      </div>
      <section ref={panel} id={panelId} className="kjun-side-navigation-layout-panel" aria-label={p.panelLabel ?? m.spacesPanel} hidden={closed && settled}>
        {/* While the column narrows the collapse button stays, so focus on it is still in the panel when the effect looks. */}
        <div className="kjun-side-navigation-layout-panel-head">
          {p.spacesTitle != null && p.spacesTitle !== false && p.spacesTitle !== "" && <div className="kjun-side-navigation-layout-panel-title">{p.spacesTitle}</div>}
          {drawer
            ? <button type="button" className="kjun-side-navigation-toggle kjun-side-navigation-layout-panel-toggle" aria-label={m.close} onClick={p.closeDrawer}>
                <KjunIcon name="x" size={tokens.extensions.sideNavigation.iconSize} /></button>
            : (!closed || !settled) && toggle(true, collapse)}
        </div>
        {render(p.nav, { collapsed: false, drawer, closeDrawer: p.closeDrawer })}
      </section>
    </>;
  };
  if (p.narrow) return <div className={p.classes} data-drawer="">
    <div className="kjun-side-navigation-layout-main">{p.children}</div>
    <KjunDrawer open={p.navOpen} onOpenChange={next => p.onNavOpenChange?.(next)} position="left" ariaLabel={p.drawerLabel ?? m.mainNavigation}
      width={spacesColumnWidth(tokens.extensions.sideNavigation, p.panelSurface, false)} closable={false} noPadding>
      <div className="kjun-side-navigation-layout-band" data-panel-surface={p.panelSurface}>{band(true)}</div>
    </KjunDrawer>
  </div>;
  return <div className={p.classes} data-spaces="" data-panel-surface={p.panelSurface} data-panel-collapsed={p.panelCollapsed ? "" : undefined}
    data-sticky={p.sticky ? undefined : "false"} style={p.offset}>
    <div className="kjun-side-navigation-layout-nav">{band(false)}</div>
    <div className="kjun-side-navigation-layout-main">{p.children}</div>
  </div>;
}
