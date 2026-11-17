import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { checkSideNavigation, isPlainNavigationClick, isSideParent, isTitledSection, sideGroupState, sideNavigationGroupRail, sideNavigationIdPart, sideNavigationInitial,
  sideNavigationInitialGroups, sideNavigationOpensElsewhere, sideNavigationSections, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, sideParentState,
  sideRailGroupState, sideSectionToggles, toggleSideParent, warnNoWiden, type SideNavigationAction, type SideNavigationCollapsedParent, type SideNavigationDestination,
  type SideNavigationEntry, type SideNavigationItem, type SideNavigationParent, type SideNavigationRail, type SideNavigationSection, type SideNavigationTitledSection } from "../../../shared/package-runtime/side-navigation";
import { scrollSideNavigationRow, sideNavigationCurrentRow } from "../../../shared/package-runtime/side-navigation-scroll";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ElementType, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { KjunPopover, KjunTooltip } from "./popover";
export type { SideNavigationAction, SideNavigationCollapsedParent, SideNavigationDestination, SideNavigationParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";

type Navigate = (key: string, event: MouseEvent<HTMLAnchorElement>) => void;
/** A header or footer: content, or a function of collapsed so it can swap to an icon-only form. */
export type SideNavigationSlot = ReactNode | ((collapsed: boolean) => ReactNode);
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
  /** A parent or group was pressed while collapsed (collapsedParent="widen"), or the collapse toggle was pressed. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Group titles become toggles that show or hide their group. A group's own collapsible overrides this. The group of
   * the current destination starts open, and so do groups marked defaultOpen. */
  collapsibleGroups?: boolean;
  /** The open groups by key (a group's key, else its title). Without it the navigation keeps the list itself. */
  expandedGroups?: string[];
  /** Also called when moving to a page in a closed group opens it. */
  onExpandedGroupsChange?: (expandedGroups: string[]) => void;
  /** A closed group's title ends with how many rows it holds (a dot instead while one of them has a badge). */
  groupCounts?: boolean;
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon).
   * Loose items between groups keep their own row. */
  rail?: SideNavigationRail;
  /** While collapsed: a short name under each icon, in a 72 wide column. The current page, hover and press fill a 56 by 32
   * indicator around the icon, a count stays a number, and no tooltip is needed. */
  railLabels?: boolean;
  /** While collapsed, pressing a parent or a rail group: "widen" asks for the full width with it open (onCollapsedChange);
   * "flyout" shows its rows in a panel beside the icon and keeps the column narrow. */
  collapsedParent?: SideNavigationCollapsedParent;
  /** "compact": 32 tall rows and 30 tall children under a mouse, and counts as quiet numbers, for long lists (documentation,
   * settings). A touch pointer keeps the touch heights. */
  density?: "default" | "compact";
  /** Above the list, such as a logo, a workspace switcher or search. With a header or footer only the list scrolls. */
  header?: SideNavigationSlot;
  /** Below the list, such as the account. */
  footer?: SideNavigationSlot;
  /** A button at the end of the footer that asks to collapse or widen the column (onCollapsedChange). */
  collapseToggle?: boolean;
  /** An action button of a row (the row's key) or a group title (the group's key) was pressed. */
  onAction?: (key: string, action: string, event: MouseEvent<HTMLButtonElement>) => void;
  /** Renders enabled links with the app's router link (Next.js Link, React Router Link) instead of <a>. It receives href,
   * className, the aria-* and data-* attributes, onClick and children, and must render an <a> with them. */
  linkAs?: ElementType;
  /** Brings the current row into the menu's own scrolling column when the menu mounts and when the page changes. */
  scrollToCurrent?: boolean;
}
type Mode = { collapsed: boolean; labelled: boolean; flyout?: boolean };
const FLYOUT: Mode = { collapsed: false, labelled: false, flyout: true };
const actionCount = (count: number) => ({ ["--_kjun-side-navigation-action-count" as string]: count }) as CSSProperties;

/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and one level of children. */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange,
  collapsibleGroups = false, expandedGroups, onExpandedGroupsChange, groupCounts = false, rail = "items", railLabels = false, collapsedParent = "widen",
  density = "default", header, footer, collapseToggle = false, onAction, linkAs, scrollToCurrent = true }: KjunSideNavigationProps) {
  const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
  const nav = useRef<HTMLElement>(null);
  const sections = useMemo(() => sideNavigationSections(items), [items]);
  useEffect(() => checkSideNavigation(items), [items]);
  const [own, setOwn] = useState(() => [...sideNavigationWithCurrentParents([], items, value)]);
  const open = expanded ?? own;
  const update = (next: string[]) => { if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  const [ownGroups, setOwnGroups] = useState(() => sideNavigationInitialGroups(items, value));
  const openGroups = expandedGroups ?? ownGroups;
  const updateGroups = (next: string[]) => { if (expandedGroups === undefined) setOwnGroups(next); onExpandedGroupsChange?.(next); };
  const toggles = sections.some(section => sideSectionToggles(section, collapsibleGroups));
  // Moving to a page under a closed parent opens it, also when the items arrive after the value; parents the person
  // opened stay as they are. The first render already starts open, so only later changes are applied and reported.
  // Groups do the same while any can be closed.
  const latest = useRef({ open, update, openGroups, updateGroups, toggles }); latest.current = { open, update, openGroups, updateGroups, toggles };
  const holders = useMemo(() => JSON.stringify([sideNavigationWithCurrentParents([], items, value), sideNavigationWithCurrentGroups([], items, value)]), [items, value]);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const next = sideNavigationWithCurrentParents(latest.current.open, items, value);
    if (next !== latest.current.open) latest.current.update([...next]);
    if (!latest.current.toggles) return;
    const groups = sideNavigationWithCurrentGroups(latest.current.openGroups, items, value);
    if (groups !== latest.current.openGroups) latest.current.updateGroups([...groups]);
  }, [value, holders]);
  // The current row comes into the menu's own column: at once on mount, after a parent or group has opened on a change.
  const scrolled = useRef(false);
  useEffect(() => {
    if (!scrollToCurrent) return;
    const first = !scrolled.current; scrolled.current = true;
    const timer = setTimeout(() => scrollSideNavigationRow(sideNavigationCurrentRow(nav.current), first), first ? 0 : tokens.motion.collapse);
    return () => clearTimeout(timer);
  }, [value, scrollToCurrent]);
  // Widening: names wait for the column and fade in (data-expanding); a flyout closes with the rail it belongs to.
  const [flyout, setFlyout] = useState<string | null>(null);
  const [expanding, setExpanding] = useState(false), wasCollapsed = useRef(collapsed);
  useEffect(() => {
    const widened = wasCollapsed.current && !collapsed; wasCollapsed.current = collapsed;
    if (!collapsed) setFlyout(null);
    // Narrowing again inside the window ends it at once (its timer is cleared with this effect).
    if (!widened) { setExpanding(false); return; }
    setExpanding(true);
    const timer = setTimeout(() => setExpanding(false), tokens.motion.control * 2);
    return () => clearTimeout(timer);
  }, [collapsed]);
  // A group pressed in a rail of groups is brought into view once the column has widened.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (collapsed || !pending.current) return;
    scrollSideNavigationRow(document.getElementById(pending.current));
    pending.current = null;
  }, [collapsed]);
  const widen = () => { if (!onCollapsedChange) warnNoWiden(); onCollapsedChange?.(false); };
  const toggle = (key: string) => update(toggleSideParent(open, key));
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { if (!open.includes(key)) toggle(key); widen(); };
  const titleId = (key: string) => id + "-title-" + sideNavigationIdPart(key);
  const revealGroup = (key: string) => {
    if (!openGroups.includes(key) && sections.some(section => section.key === key && sideSectionToggles(section, collapsibleGroups))) updateGroups([...openGroups, key]);
    pending.current = titleId(key); widen();
  };
  const flyoutMode = collapsed && collapsedParent === "flyout";
  const labelled = collapsed && railLabels, base: Mode = { collapsed, labelled };

  const badge = (text: string, dot: boolean) => <span className="kjun-navigation-badge" data-dot={dot || undefined} aria-hidden="true">{text}</span>;
  const glyph = (mode: Mode, icon: string | undefined, label: string, filled: boolean, mark?: ReactNode) => (icon || mode.collapsed) && <span className="kjun-side-navigation-glyph">
    {icon ? <KjunIcon name={icon} className="kjun-side-navigation-icon" filled={filled} size={geometry.iconSize} />
      : <span className="kjun-side-navigation-initial" aria-hidden="true">{sideNavigationInitial(label)}</span>}
    {mode.collapsed && mark}
  </span>;
  // With names under the icons a collapsed menu reads on its own: no tooltips, and the names stay on screen.
  const named = (mode: Mode, label: string, row: ReactElement) => mode.collapsed && !mode.labelled ? <KjunTooltip content={label} placement="right">{row}</KjunTooltip> : row;
  const labelClass = (mode: Mode) => "kjun-side-navigation-label" + (mode.collapsed && !mode.labelled ? " kjun-sr-only" : "");
  const actionButtons = (key: string, actions: readonly SideNavigationAction[]) => <span className="kjun-side-navigation-actions">
    {actions.map(action => <KjunTooltip key={action.key} content={action.label}>
      <button type="button" className="kjun-side-navigation-action" aria-label={action.label} onClick={event => onAction?.(key, action.key, event)}>
        <KjunIcon name={action.icon} size={geometry.actionIconSize} />
      </button>
    </KjunTooltip>)}
  </span>;
  // A panel beside a collapsed icon, holding what the icon stands for. It is non-modal: Tab leaves it, an outside press
  // closes it, and → opens it from the keyboard.
  const flyoutPanel = (key: string, title: string, trigger: ReactElement, content: ReactNode) =>
    <KjunPopover open={flyout === key} onOpenChange={next => setFlyout(next ? key : null)} modal={false} placement="right" header={title} focusOnOpen trigger={trigger}>{content}</KjunPopover>;
  const openOnArrow = (key: string) => (event: KeyboardEvent) => { if (event.key === "ArrowRight") { event.preventDefault(); setFlyout(key); } };

  const link = (mode: Mode, item: SideNavigationDestination, child = false) => {
    const selected = item.key === value, mark = navigationBadge(item.badge), elsewhere = sideNavigationOpensElsewhere(item);
    const Link: ElementType = !item.disabled && linkAs ? linkAs : "a";
    // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
    return <Link className="kjun-side-navigation-item" data-child={child ? "" : undefined} href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabIndex={item.disabled ? -1 : undefined}
      target={item.disabled ? undefined : item.target} rel={elsewhere ? "noopener noreferrer" : undefined}
      aria-label={mark || elsewhere ? navigationLabel(item.label, item.badge, m.newContent, m.newCount) + (elsewhere ? m.newWindow : "") : undefined}
      aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (item.disabled) { event.preventDefault(); return; }
        if (elsewhere || !isPlainNavigationClick(event)) return;
        onNavigate?.(item.key, event);
        if (selected) onReselect?.(item.key, event);
        if (mode.flyout) setFlyout(null);
      }}>
      {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
          Beside a labelled rail's wider indicator the number fits. */}
      {!child && glyph(mode, item.icon, item.label, selected, mark && (mode.labelled ? badge(mark.text, mark.dot) : badge("", true)))}
      <span className={labelClass(mode)}>{item.label}</span>
      {!mode.collapsed && mark && badge(mark.text, mark.dot)}
      {!mode.collapsed && elsewhere && <KjunIcon name="external-link" className="kjun-side-navigation-trailing" size={geometry.chevronSize} />}
    </Link>;
  };
  // A destination's row: the link, and its actions beside it (a button cannot sit inside a link).
  const destination = (mode: Mode, item: SideNavigationDestination, child = false) => {
    const actions = !mode.collapsed && item.actions?.length ? item.actions : undefined;
    return <li key={item.key} className="kjun-side-navigation-row" data-actions={actions ? "" : undefined} style={actions && actionCount(actions.length)}>
      {named(mode, item.label, link(mode, item, child))}
      {actions && actionButtons(item.key, actions)}
    </li>;
  };
  const parent = (mode: Mode, item: SideNavigationParent) => {
    const flies = mode.collapsed && flyoutMode && !item.disabled, panel = id + "-parent-" + sideNavigationIdPart(item.key);
    const { shown, within, dot } = sideParentState(item, { open, collapsed: mode.collapsed, value });
    const button = <button type="button" className="kjun-side-navigation-item" aria-expanded={flies ? undefined : shown} aria-controls={flies ? undefined : panel}
      // aria-disabled instead of disabled: the row keeps its tooltip and its name while it cannot open.
      aria-disabled={item.disabled || undefined} tabIndex={item.disabled ? -1 : undefined}
      aria-label={dot ? navigationLabel(item.label, true, m.newContent) : undefined} onKeyDown={flies ? openOnArrow(item.key) : undefined}
      onClick={flies || item.disabled ? undefined : () => mode.collapsed ? reveal(item.key) : toggle(item.key)}
      // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
      data-current-within={within ? "" : undefined}>
      {glyph(mode, item.icon, item.label, false, dot && badge("", true))}
      <span className={labelClass(mode)}>{item.label}</span>
      {!mode.collapsed && dot && badge("", true)}
      {!mode.collapsed && <KjunIcon name="chevron-down" className="kjun-side-navigation-chevron" size={geometry.chevronSize} />}
    </button>;
    return <li key={item.key} className="kjun-side-navigation-row">
      {flies ? flyoutPanel(item.key, item.label, named(mode, item.label, button), <ul className="kjun-side-navigation-flyout" data-parent="">{item.children.map(child => destination(FLYOUT, child, true))}</ul>)
        : named(mode, item.label, button)}
      {!flies && <div id={panel}><Collapse open={shown}><ul className="kjun-side-navigation-children">{item.children.map(child => destination(mode, child, true))}</ul></Collapse></div>}
    </li>;
  };
  const row = (mode: Mode, item: SideNavigationItem) => isSideParent(item) ? parent(mode, item) : destination(mode, item);

  // A titled group's heading: its title (static or a toggle) and the group's action.
  const heading = (section: SideNavigationTitledSection, title: ReactNode) => {
    const action = !collapsed && section.action;
    return <div className="kjun-side-navigation-heading" data-actions={action ? "" : undefined} style={action ? actionCount(1) : undefined}>
      {title}{action && actionButtons(section.key, [action])}
    </div>;
  };
  // A group title that opens and closes its group. Its small chevron follows the name; the end holds a dot for a badge
  // inside, or the number of rows (groupCounts). Closed over the current page, the name takes full ink.
  const groupToggle = (section: SideNavigationTitledSection, rows: ReactNode) => {
    const { shown, within, dot, count } = sideGroupState(section, { openGroups, value }), panel = id + "-group-" + sideNavigationIdPart(section.key);
    return <>
      {heading(section, <button type="button" id={titleId(section.key)} className="kjun-side-navigation-title" data-toggle="" aria-expanded={shown} aria-controls={panel}
        aria-label={dot ? navigationLabel(section.title, true, m.newContent) : undefined} data-current-within={within ? "" : undefined}
        onClick={() => updateGroups(toggleSideParent(openGroups, section.key))}>
        <span className="kjun-side-navigation-label">{section.title}</span>
        <KjunIcon name="chevron-right" className="kjun-side-navigation-chevron" size={geometry.groupChevronSize} />
        {dot ? badge("", true) : !shown && groupCounts ? <span className="kjun-side-navigation-count" aria-hidden="true">{count}</span> : null}
      </button>)}
      <div id={panel}><Collapse open={shown}><ul className="kjun-side-navigation-group-items">{rows}</ul></Collapse></div>
    </>;
  };
  const section = (entry: SideNavigationSection, index: number) => {
    const rows = entry.items.map(item => row(base, item));
    if (!isTitledSection(entry)) return <ul key={"loose:" + (entry.items[0]?.key ?? index)}>{rows}</ul>;
    const toggled = !collapsed && sideSectionToggles(entry, collapsibleGroups);
    return <div key={"group:" + entry.key} className="kjun-side-navigation-section" role="group" aria-labelledby={titleId(entry.key)} data-toggles={toggled ? "" : undefined}>
      {toggled ? groupToggle(entry, rows) : <>
        {heading(entry, <div id={titleId(entry.key)} className={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{entry.title}</div>)}
        <ul>{rows}</ul>
      </>}
    </div>;
  };
  // A group in a rail of groups: its icon (or initial), half the selection fill while it holds the current page, and a
  // dot when an item in it has a badge. Pressing it widens with the group open, or opens its rows beside it (flyout).
  const railGroup = (group: SideNavigationTitledSection) => {
    const { within, dot } = sideRailGroupState(group, value);
    const button = <button type="button" className="kjun-side-navigation-item" aria-expanded={flyoutMode ? undefined : false}
      aria-label={dot ? navigationLabel(group.title, true, m.newContent) : undefined} data-current-within={within ? "" : undefined}
      onKeyDown={flyoutMode ? openOnArrow("group:" + group.key) : undefined} onClick={flyoutMode ? undefined : () => revealGroup(group.key)}>
      {glyph(base, group.icon, group.title, false, dot && badge("", true))}
      <span className={labelClass(base)}>{group.title}</span>
    </button>;
    return <li key={"group:" + group.key} className="kjun-side-navigation-row">
      {flyoutMode ? flyoutPanel("group:" + group.key, group.title, named(base, group.title, button), <ul className="kjun-side-navigation-flyout">{group.items.map(item => row(FLYOUT, item))}</ul>)
        : named(base, group.title, button)}
    </li>;
  };

  const slot = (content: SideNavigationSlot) => typeof content === "function" ? content(collapsed) : content;
  const top = slot(header), bottom = slot(footer), listId = id + "-list";
  const toggleLabel = collapsed ? m.expandNavigation : m.collapseNavigation;
  const toggleButton = collapseToggle && <KjunTooltip content={toggleLabel} placement="right">
    <button type="button" className="kjun-side-navigation-toggle" aria-label={toggleLabel} aria-expanded={!collapsed} aria-controls={listId} onClick={() => onCollapsedChange?.(!collapsed)}>
      <KjunIcon name={collapsed ? "layout-sidebar-left-expand" : "layout-sidebar-left-collapse"} size={geometry.iconSize} />
    </button>
  </KjunTooltip>;
  const hasTop = top != null && top !== false, hasBottom = bottom != null && bottom !== false;
  const railOfGroups = collapsed && rail === "groups";
  return <nav ref={nav} className="kjun-side-navigation" data-collapsed={collapsed ? "" : undefined} data-rail={railOfGroups ? "groups" : undefined} data-rail-labels={labelled ? "" : undefined}
    data-density={density === "compact" ? "compact" : undefined} data-chrome={hasTop || hasBottom || collapseToggle ? "" : undefined} data-expanding={expanding ? "" : undefined}
    aria-label={ariaLabel ?? m.mainNavigation}>
    {hasTop && <div className="kjun-side-navigation-header">{top}</div>}
    <div id={listId} className="kjun-side-navigation-list">
      {railOfGroups
        ? <ul>{sideNavigationGroupRail(items).map(entry => "group" in entry ? railGroup(entry.group) : row(base, entry.item))}</ul>
        : sections.map(section)}
    </div>
    {(hasBottom || toggleButton) && <div className="kjun-side-navigation-footer">
      {hasBottom && <div className="kjun-side-navigation-footer-content">{bottom}</div>}
      {toggleButton}
    </div>}
  </nav>;
}
