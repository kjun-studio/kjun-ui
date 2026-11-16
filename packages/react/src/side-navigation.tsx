import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { isPlainNavigationClick, isSideParent, sideNavigationInitial, sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationWithCurrentParents,
  sideParentHasBadge, sideParentHoldsCurrent, toggleSideParent,
  type SideNavigationDestination, type SideNavigationEntry, type SideNavigationItem } from "../../../shared/package-runtime/side-navigation";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { KjunTooltip } from "./popover";
export type { SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry } from "../../../shared/package-runtime/side-navigation";

type Navigate = (key: string, event: MouseEvent<HTMLAnchorElement>) => void;
export interface KjunSideNavigationProps {
  /** Destinations, parents with one level of children, and titled groups of either. A destination has the bottom navigation's shape. */
  items: SideNavigationEntry[];
  /** The current destination's key (a child's key when the page is under a parent). */
  value: string;
  ariaLabel?: string;
  /** A plain click on a destination of this tab. Modified clicks (new tab) and target links are left to the browser. */
  onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** The open parents. Without it the navigation keeps the list itself, starting with the parent of the current destination open. */
  expanded?: string[];
  /** Also called when moving to a page under a closed parent opens it. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Icons only, for a narrowed column. Names show as tooltips, and children stay hidden behind their parent. */
  collapsed?: boolean;
  /** A parent was pressed while collapsed: widen the column (collapsed=false) to show its children. */
  onCollapsedChange?: (collapsed: boolean) => void;
}
/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children. */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange }: KjunSideNavigationProps) {
  const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/:/g, ""), geometry = tokens.extensions.sideNavigation;
  const [own, setOwn] = useState(() => sideNavigationWithCurrentParents([], items, value) as string[]);
  const open = expanded ?? own;
  const update = (next: string[]) => { if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
  // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
  const latest = useRef({ open, update }); latest.current = { open, update };
  const holders = JSON.stringify(sideNavigationWithCurrentParents([], items, value)), mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const next = sideNavigationWithCurrentParents(latest.current.open, items, value);
    if (next !== latest.current.open) latest.current.update([...next]);
  }, [value, holders]);
  const toggle = (key: string) => update(toggleSideParent(open, key));
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { if (!open.includes(key)) toggle(key); onCollapsedChange?.(false); };
  const badge = (text: string, dot: boolean) => <span className="kjun-navigation-badge" data-dot={dot || undefined} aria-hidden="true">{text}</span>;
  const glyph = (icon: string | undefined, label: string, filled: boolean, mark?: ReactNode) => (icon || collapsed) && <span className="kjun-side-navigation-glyph">
    {icon ? <KjunIcon name={icon} className="kjun-side-navigation-icon" filled={filled} size={geometry.iconSize} />
      : <span className="kjun-side-navigation-initial" aria-hidden="true">{sideNavigationInitial(label)}</span>}
    {collapsed && mark}
  </span>;
  const named = (label: string, row: ReactElement) => collapsed ? <KjunTooltip content={label} placement="right">{row}</KjunTooltip> : row;
  const labelClass = "kjun-side-navigation-label" + (collapsed ? " kjun-sr-only" : "");
  const link = (item: SideNavigationDestination, child = false) => {
    const selected = item.key === value, mark = navigationBadge(item.badge), elsewhere = sideNavigationOpensElsewhere(item);
    const shown = mark && badge(mark.text, mark.dot);
    // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
    return <a className="kjun-side-navigation-item" data-child={child ? "" : undefined} href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabIndex={item.disabled ? -1 : undefined}
      target={item.disabled ? undefined : item.target} rel={elsewhere ? "noopener noreferrer" : undefined}
      aria-label={mark || elsewhere ? navigationLabel(item.label, item.badge, m.newContent, m.newCount) + (elsewhere ? m.newWindow : "") : undefined}
      aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
      onClick={event => {
        if (item.disabled) { event.preventDefault(); return; }
        if (elsewhere || !isPlainNavigationClick(event)) return;
        onNavigate?.(item.key, event);
        if (selected) onReselect?.(item.key, event);
      }}>
      {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number. */}
      {!child && glyph(item.icon, item.label, selected, mark && badge("", true))}
      <span className={labelClass}>{item.label}</span>
      {!collapsed && shown}
      {!collapsed && elsewhere && <KjunIcon name="external-link" className="kjun-side-navigation-trailing" size={geometry.chevronSize} />}
    </a>;
  };
  const row = (item: SideNavigationItem, panel: string) => {
    if (!isSideParent(item)) return <li key={item.key}>{named(item.label, link(item))}</li>;
    const shown = open.includes(item.key) && !collapsed, dot = !shown && sideParentHasBadge(item);
    return <li key={item.key}>
      {named(item.label, <button type="button" className="kjun-side-navigation-item" aria-expanded={shown} aria-controls={panel} disabled={item.disabled}
        aria-label={dot ? navigationLabel(item.label, true, m.newContent) : undefined} onClick={() => collapsed ? reveal(item.key) : toggle(item.key)}
        // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
        data-current-within={!shown && sideParentHoldsCurrent(item, value) ? "" : undefined}>
        {glyph(item.icon, item.label, false, dot && badge("", true))}
        <span className={labelClass}>{item.label}</span>
        {!collapsed && dot && badge("", true)}
        {!collapsed && <KjunIcon name="chevron-down" className="kjun-side-navigation-chevron" size={geometry.chevronSize} />}
      </button>)}
      <div id={panel}><Collapse open={shown}><ul className="kjun-side-navigation-children">{item.children.map(child => <li key={child.key}>{link(child, true)}</li>)}</ul></Collapse></div>
    </li>;
  };
  return <nav className="kjun-side-navigation" data-collapsed={collapsed ? "" : undefined} aria-label={ariaLabel ?? m.mainNavigation}>
    {sideNavigationSections(items).map((section, index) => {
      const rows = section.items.map((item, at) => row(item, id + "-panel-" + index + "-" + at));
      return section.title
        ? <div key={index} className="kjun-side-navigation-section" role="group" aria-labelledby={id + "-title-" + index}>
            <div id={id + "-title-" + index} className={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{section.title}</div>
            <ul>{rows}</ul>
          </div>
        : <ul key={index}>{rows}</ul>;
    })}
  </nav>;
}
