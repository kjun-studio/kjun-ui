import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import type { MouseEvent, ReactNode } from "react";
import { KjunIcon } from "./button";
import { TopNavigationContext } from "./top-navigation-context";
export interface KjunTopNavigationProps { title: string; description?: string; leading?: ReactNode; actions?: ReactNode; safeAreaTop?: number;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunTopNavigation({ title, description, leading, actions, safeAreaTop = 0, surface = true }: KjunTopNavigationProps) {
  return <TopNavigationContext.Provider value={tokens.extensions.topNavigation}>
    <header className="kjun-top-navigation" data-surface={surface ? undefined : "false"} style={{ paddingTop: Math.max(0, safeAreaTop) }}>
      <div className="kjun-navigation-content">
        {leading && <div className="kjun-navigation-leading">{leading}</div>}
        <div className="kjun-navigation-title"><strong>{title}</strong>{description && <p>{description}</p>}</div>
        {actions && <div className="kjun-navigation-actions">{actions}</div>}
      </div>
    </header>
  </TopNavigationContext.Provider>;
}
export interface NavigationDestination { key: string; label: string; href: string; icon?: string; badge?: string | number; disabled?: boolean }
export interface KjunBottomNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: (key: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunBottomNavigation({ items, value, ariaLabel, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = true, onNavigate, surface = true }: KjunBottomNavigationProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.mainNavigation;
  const hasIcons = items.some(item => item.icon);
  if (keyboardVisible && hideOnKeyboard) return null;
  return <nav className="kjun-bottom-navigation" data-icons={hasIcons || undefined} data-surface={surface ? undefined : "false"} aria-label={ariaLabel} style={{ paddingBottom: Math.max(0, safeAreaBottom) }}>
    {items.map(item => {
      const badge = item.badge != null && <span className="kjun-navigation-badge" aria-hidden="true">{item.badge}</span>;
      return <a key={item.key} href={item.disabled ? undefined : item.href} aria-label={item.label + (item.badge != null ? ", " + item.badge : "")} aria-disabled={item.disabled || undefined} aria-current={value === item.key ? "page" : undefined} onClick={event => { if (item.disabled) event.preventDefault(); else onNavigate?.(item.key, event); }}>
        {hasIcons && <span className="kjun-navigation-icon">{item.icon && <KjunIcon name={item.icon} size={tokens.extensions.bottomNavigation.iconSize} />}{badge}</span>}
        <span className="kjun-navigation-label">{item.label}{!hasIcons && badge}</span>
      </a>;
    })}
  </nav>;
}
export interface KjunBottomActionBarProps { description?: string; children: ReactNode; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunBottomActionBar({ description, children, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = false, surface = true }: KjunBottomActionBarProps) {
  if (keyboardVisible && hideOnKeyboard) return null;
  return <div className="kjun-bottom-action-bar" data-surface={surface ? undefined : "false"} style={{ paddingBottom: tokens.extensions.navigation.padding + Math.max(0, safeAreaBottom) }}><div className="kjun-bottom-action-content">{description && <p>{description}</p>}<div className="kjun-navigation-actions">{children}</div></div></div>;
}
