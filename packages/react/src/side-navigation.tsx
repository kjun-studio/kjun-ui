import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isSideParent, sideNavigationCurrentParents, sideNavigationSections, toggleSideParent,
  type SideNavigationDestination, type SideNavigationEntry, type SideNavigationItem } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useState, type MouseEvent } from "react";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
export type { SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry } from "../../../shared/package-runtime/side-navigation";

type Navigate = (key: string, event: MouseEvent<HTMLAnchorElement>) => void;
export interface KjunSideNavigationProps {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: SideNavigationEntry[];
  /** The current destination's key (a child's key when the page is under a parent). */
  value: string;
  ariaLabel?: string;
  onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** The open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open. */
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
}
/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children. */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange }: KjunSideNavigationProps) {
  const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/:/g, ""), geometry = tokens.extensions.sideNavigation;
  const [own, setOwn] = useState(() => sideNavigationCurrentParents(items, value));
  // Moving to a page under a closed parent opens it; parents the person opened stay as they are.
  useEffect(() => { setOwn(open => [...new Set([...open, ...sideNavigationCurrentParents(items, value)])]); }, [value]);
  const open = expanded ?? own;
  const toggle = (key: string) => { const next = toggleSideParent(open, key); if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  const link = (item: SideNavigationDestination, child = false) => {
    const selected = item.key === value, mark = navigationBadge(item.badge);
    // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
    return <a className="kjun-side-navigation-item" data-child={child ? "" : undefined} href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabIndex={item.disabled ? -1 : undefined}
      aria-label={mark ? navigationLabel(item.label, item.badge, m.newContent, m.newCount) : undefined} aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
      onClick={event => {
        if (item.disabled) { event.preventDefault(); return; }
        onNavigate?.(item.key, event);
        if (selected) onReselect?.(item.key, event);
      }}>
      {item.icon && <KjunIcon name={item.icon} className="kjun-side-navigation-icon" filled={selected} size={geometry.iconSize} />}
      <span className="kjun-side-navigation-label">{item.label}</span>
      {mark && <span className="kjun-navigation-badge" data-dot={mark.dot || undefined} aria-hidden="true">{mark.text}</span>}
    </a>;
  };
  const row = (item: SideNavigationItem) => {
    if (!isSideParent(item)) return <li key={item.key}>{link(item)}</li>;
    const shown = open.includes(item.key), panel = id + "-" + item.key;
    return <li key={item.key}>
      <button type="button" className="kjun-side-navigation-item" aria-expanded={shown} aria-controls={panel} disabled={item.disabled} onClick={() => toggle(item.key)}
        // A closed parent stands for the current page inside it, so the place in the menu is never lost.
        data-current-within={!shown && item.children.some(child => child.key === value) ? "" : undefined}>
        {item.icon && <KjunIcon name={item.icon} className="kjun-side-navigation-icon" size={geometry.iconSize} />}
        <span className="kjun-side-navigation-label">{item.label}</span>
        <KjunIcon name="chevron-down" className="kjun-side-navigation-chevron" size={geometry.chevronSize} />
      </button>
      <div id={panel}><Collapse open={shown}><ul className="kjun-side-navigation-children">{item.children.map(child => <li key={child.key}>{link(child, true)}</li>)}</ul></Collapse></div>
    </li>;
  };
  return <nav className="kjun-side-navigation" aria-label={ariaLabel ?? m.mainNavigation}>
    {sideNavigationSections(items).map((section, index) => section.title
      ? <div key={index} className="kjun-side-navigation-section" role="group" aria-labelledby={id + "-title-" + index}>
          <div id={id + "-title-" + index} className="kjun-side-navigation-title">{section.title}</div>
          <ul>{section.items.map(row)}</ul>
        </div>
      : <ul key={index}>{section.items.map(row)}</ul>)}
  </nav>;
}
