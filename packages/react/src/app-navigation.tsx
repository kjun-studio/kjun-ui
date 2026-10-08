import { tokens } from "@kjun-ui/tokens";
import type { MouseEvent, ReactNode } from "react";
import { DsIcon } from "./button";
import { TopNavigationContext } from "./top-navigation-context";
export interface DsTopNavigationProps { title: string; description?: string; leading?: ReactNode; actions?: ReactNode; safeAreaTop?: number }
export function DsTopNavigation({ title, description, leading, actions, safeAreaTop = 0 }: DsTopNavigationProps) {
  return <TopNavigationContext.Provider value={tokens.extensions.topNavigation}>
    <header className="kjun-top-navigation" style={{ paddingTop: Math.max(0, safeAreaTop) }}>
      <div className="kjun-navigation-content">
        {leading && <div className="kjun-navigation-leading">{leading}</div>}
        <div className="kjun-navigation-title"><strong>{title}</strong>{description && <p>{description}</p>}</div>
        {actions && <div className="kjun-navigation-actions">{actions}</div>}
      </div>
    </header>
  </TopNavigationContext.Provider>;
}
export interface NavigationDestination { key: string; label: string; href: string; icon?: string; badge?: string | number; disabled?: boolean }
export interface DsBottomNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: (key: string, event: MouseEvent<HTMLAnchorElement>) => void }
export function DsBottomNavigation({ items, value, ariaLabel = "주요 탐색", safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = true, onNavigate }: DsBottomNavigationProps) {
  const hasIcons = items.some(item => item.icon);
  if (keyboardVisible && hideOnKeyboard) return null;
  return <nav className="kjun-bottom-navigation" data-icons={hasIcons || undefined} aria-label={ariaLabel} style={{ paddingBottom: Math.max(0, safeAreaBottom) }}>
    {items.map(item => {
      const badge = item.badge != null && <span className="kjun-navigation-badge" aria-hidden="true">{item.badge}</span>;
      return <a key={item.key} href={item.disabled ? undefined : item.href} aria-label={item.label + (item.badge != null ? ", " + item.badge : "")} aria-disabled={item.disabled || undefined} aria-current={value === item.key ? "page" : undefined} onClick={event => { if (item.disabled) event.preventDefault(); else onNavigate?.(item.key, event); }}>
        {hasIcons && <span className="kjun-navigation-icon">{item.icon && <DsIcon name={item.icon} size={tokens.extensions.bottomNavigation.iconSize} />}{badge}</span>}
        <span className="kjun-navigation-label">{item.label}{!hasIcons && badge}</span>
      </a>;
    })}
  </nav>;
}
export interface DsBottomActionBarProps { description?: string; children: ReactNode; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean }
export function DsBottomActionBar({ description, children, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = false }: DsBottomActionBarProps) {
  if (keyboardVisible && hideOnKeyboard) return null;
  return <div className="kjun-bottom-action-bar" style={{ paddingBottom: tokens.extensions.navigation.padding + Math.max(0, safeAreaBottom) }}><div className="kjun-bottom-action-content">{description && <p>{description}</p>}<div className="kjun-navigation-actions">{children}</div></div></div>;
}
