import { webSafeBottom, webSafeTop } from "../../../shared/package-runtime/safe-area";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationBadge, navigationLabel, type NavigationBadge } from "../../../shared/package-runtime/navigation-badge";
import { bottomNavigationLayout, navigationIconFilled, type NavigationIconStyle } from "../../../shared/package-runtime/bottom-navigation";
export type { NavigationIconStyle };
import { tokens } from "@kjun-ui/tokens";
import { useLayoutEffect, useState, type MouseEvent, type ReactNode } from "react";
import { trackBottomBar } from "../../../shared/package-runtime/bottom-bar";
import { KjunIcon } from "./button";
import { ActionShapeContext, ActionSizeContext } from "../../../shared/package-runtime/action-size";
import { TopNavigationContext } from "./top-navigation-context";
export interface KjunTopNavigationProps { title: string; description?: string; leading?: ReactNode; actions?: ReactNode;
  /** Keeps clear of the screen's safe area from KjunProvider (default true); false where the app already reserved it. */
  safeArea?: boolean;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunTopNavigation({ title, description, leading, actions, safeArea = true, surface = true }: KjunTopNavigationProps) {
  return <TopNavigationContext.Provider value={tokens.extensions.topNavigation}>
    <header className="kjun-top-navigation" data-surface={surface ? undefined : "false"} style={{ paddingTop: webSafeTop(safeArea) }}>
      <div className="kjun-navigation-content">
        {leading && <div className="kjun-navigation-leading">{leading}</div>}
        <div className="kjun-navigation-title"><strong>{title}</strong>{description && <p>{description}</p>}</div>
        {actions && <div className="kjun-navigation-actions">{actions}</div>}
      </div>
    </header>
  </TopNavigationContext.Provider>;
}
export interface NavigationDestination { key: string; label: string; href: string; icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+, and the accessible name keeps the value. 0 and "" draw nothing. */
  badge?: NavigationBadge; disabled?: boolean }
type Navigate = (key: string, event: MouseEvent<HTMLAnchorElement>) => void;
function NavigationBadgeMark({ badge }: { badge: NavigationDestination["badge"] }) {
  const mark = navigationBadge(badge);
  return mark && <span className="kjun-navigation-badge" data-dot={mark.dot || undefined} aria-hidden="true">{mark.text}</span>;
}
/** One destination link, shared by the bottom and floating bars. */
function Destination({ item, selected, onNavigate, onReselect, children }: { item: NavigationDestination; selected: boolean; onNavigate?: Navigate; onReselect?: Navigate; children: ReactNode }) {
  const m = useKjunMessages();
  // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
  return <a href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabIndex={item.disabled ? -1 : undefined}
    aria-label={navigationLabel(item.label, item.badge, m.newContent, m.newCount)} aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
    onClick={event => {
      if (item.disabled) { event.preventDefault(); return; }
      onNavigate?.(item.key, event);
      if (selected) onReselect?.(item.key, event);
    }}>
    {children}
  </a>;
}
/** A docked bottom bar reports its height to the provider scope, so KjunFab sits above it. */
function useBottomBar() {
  const [bar, setBar] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => trackBottomBar(bar), [bar]);
  return setBar;
}
export interface KjunBottomNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string;
  /** Keeps clear of the screen's safe area from KjunProvider (default true); false where the app already reserved it. */
  safeArea?: boolean;
  keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** Paints the surface (default true): a square bar with a hairline shadow along its top edge; false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean;
  /** "auto" (default) draws outline icons and fills the selected one; "filled" or "outline" keeps one style for every destination, the selection then carried by colour (and stroke weight). */
  iconStyle?: NavigationIconStyle;
  /** Shows each label under its icon (default true); false draws icons alone on a lower bar, each label staying the destination's accessible name. Destinations without icons always show their labels. */
  showLabels?: boolean }
export function KjunBottomNavigation({ items, value, ariaLabel, safeArea = true, keyboardVisible = false, hideOnKeyboard = true, onNavigate, onReselect, surface = true, iconStyle = "auto", showLabels = true }: KjunBottomNavigationProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.mainNavigation;
  const layout = bottomNavigationLayout(items, showLabels), bar = useBottomBar();
  if (keyboardVisible && hideOnKeyboard) return null;
  return <nav ref={bar} className="kjun-bottom-navigation" data-icons={layout.hasIcons || undefined} data-icon-style={iconStyle} data-labels={layout.iconOnly ? "false" : undefined} data-surface={surface ? undefined : "false"} aria-label={ariaLabel} style={{ paddingBottom: webSafeBottom(safeArea) }}>
    {items.map(item => {
      const selected = value === item.key, parts = layout.parts(item);
      const badge = <NavigationBadgeMark badge={item.badge} />;
      return <Destination key={item.key} item={item} selected={selected} onNavigate={onNavigate} onReselect={onReselect}>
        {parts.iconBox && <span className="kjun-navigation-icon">{item.icon && <KjunIcon name={item.icon} filled={navigationIconFilled(iconStyle, selected)} size={tokens.extensions.bottomNavigation.iconSize} />}{badge}</span>}
        {parts.showLabel && <span className="kjun-navigation-label">{item.label}{!parts.badgeOnIcon && badge}</span>}
      </Destination>;
    })}
  </nav>;
}
export interface KjunFloatingNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string;
  /** Keeps clear of the screen's safe area from KjunProvider (default true); false where the app already reserved it. */
  safeArea?: boolean;
  keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate }
/** A capsule detached from the screen edge. Destinations with an icon show only the icon; the label stays their accessible name. */
export function KjunFloatingNavigation({ items, value, ariaLabel, safeArea = true, keyboardVisible = false, hideOnKeyboard = true, onNavigate, onReselect }: KjunFloatingNavigationProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.mainNavigation;
  const geometry = tokens.extensions.floatingNavigation;
  if (keyboardVisible && hideOnKeyboard) return null;
  return <nav className="kjun-floating-navigation" aria-label={ariaLabel} style={{ marginBottom: `calc(${geometry.offset}px + ${webSafeBottom(safeArea)})` }}>
    {items.map(item => {
      const selected = value === item.key;
      const badge = <NavigationBadgeMark badge={item.badge} />;
      return <Destination key={item.key} item={item} selected={selected} onNavigate={onNavigate} onReselect={onReselect}>
        {item.icon
          ? <span className="kjun-navigation-icon"><KjunIcon name={item.icon} filled={selected} size={geometry.iconSize} />{badge}</span>
          : <span className="kjun-navigation-label">{item.label}{badge}</span>}
      </Destination>;
    })}
  </nav>;
}
export interface KjunBottomActionBarProps { description?: string; children: ReactNode;
  /** Keeps clear of the screen's safe area from KjunProvider (default true); false where the app already reserved it. */
  safeArea?: boolean;
  keyboardVisible?: boolean; hideOnKeyboard?: boolean;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean;
  /** "floating" is a capsule detached from the screen edge, like KjunFloatingNavigation: the description and the actions sit on one line and unsized buttons in it are lg pills. */
  variant?: "docked" | "floating" }
export function KjunBottomActionBar({ description, children, safeArea = true, keyboardVisible = false, hideOnKeyboard = false, surface = true, variant = "docked" }: KjunBottomActionBarProps) {
  const bar = useBottomBar();
  if (keyboardVisible && hideOnKeyboard) return null;
  const floating = variant === "floating", inset = floating ? tokens.extensions.floatingNavigation.offset : tokens.extensions.navigation.padding;
  const actions = <div className="kjun-navigation-actions">{children}</div>;
  return <div ref={bar} className="kjun-bottom-action-bar" data-variant={floating ? "floating" : undefined} data-surface={surface ? undefined : "false"} style={{ paddingBottom: `calc(${inset}px + ${webSafeBottom(safeArea)})` }}><div className="kjun-bottom-action-content">{description && <p>{description}</p>}{floating ? <ActionSizeContext.Provider value="lg"><ActionShapeContext.Provider value="pill">{actions}</ActionShapeContext.Provider></ActionSizeContext.Provider> : actions}</div></div>;
}
