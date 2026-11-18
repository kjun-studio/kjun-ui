import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationBadge } from "../../../shared/package-runtime/navigation-badge";
import { checkSideNavigation, isPlainNavigationClick, isSideParent, isTitledSection, sideFlyoutKey, sideGroupState, sideItemsHoldCurrent, sideNavigationGroupRail,
  sideNavigationIdPart, sideNavigationInitial, sideNavigationLinkLabel, sideNavigationOpensElsewhere, sideNavigationShownLabel,
  sideNavigationShownTitle, sideNavigationToggleName, sideParentState, sideRailGroupState, sideSectionEmpty, sideSectionRows,
  sideSectionToggles, toggleSideParent, warnNoWiden, type SideNavigationAction, type SideNavigationBadgeTone, type SideNavigationCollapsedParent, type SideNavigationDestination,
  type SideNavigationEntry, type SideNavigationHeadingLevel, type SideNavigationItem, type SideNavigationParent, type SideNavigationRail, type SideNavigationSection,
  type SideNavigationSubParent, type SideNavigationTitledSection } from "../../../shared/package-runtime/side-navigation";
import { closeSideNavigationFlyout, sideNavigationArrowKey, sideNavigationOpensFlyout, type SideNavigationArrowOwner } from "../../../shared/package-runtime/side-navigation-keys";
import { scrollSideNavigationRow, sideNavigationCurrentRow } from "../../../shared/package-runtime/side-navigation-scroll";
import { useSideNavigationState } from "../../../shared/package-runtime/use-side-navigation-state";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ElementType, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { KjunIcon } from "./button";
import { Collapse } from "./collapse";
import { KjunPopover, KjunTooltip } from "./popover";
export type { SideNavigationAction, SideNavigationBadgeTone, SideNavigationCollapsedParent, SideNavigationDestination, SideNavigationHeadingLevel, SideNavigationParent,
  SideNavigationSubParent, SideNavigationItem, SideNavigationGroup, SideNavigationEntry, SideNavigationRail } from "../../../shared/package-runtime/side-navigation";

type Navigate = (key: string, event: MouseEvent<HTMLAnchorElement>) => void;
/** A header or footer: content, or a function of collapsed so it can swap to an icon-only form. */
export type SideNavigationSlot = ReactNode | ((collapsed: boolean) => ReactNode);
export interface KjunSideNavigationProps {
  /** Destinations, parents with up to two levels under them, and titled groups of either. A destination has the bottom
   * navigation's shape. */
  items: SideNavigationEntry[];
  /** The current destination's key (a child's key when the page is under a parent); null for a page outside the menu. */
  value: string | null;
  ariaLabel?: string;
  /** A plain click on a destination of this tab. Modified clicks (new tab) and target links are left to the browser.
   * With linkAs the router link already navigates: use this only for side effects such as closing a drawer. */
  onNavigate?: Navigate;
  /** The current destination was pressed again, e.g. to scroll its page back to the top. */
  onReselect?: Navigate;
  /** The open parents, at both levels. Without it the navigation keeps the list itself, starting with the parents of the
   * current destination open. */
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
  /** A group title that opens and closes ends with how many rows its group holds (a dot instead while a closed group has
   * a badge inside). */
  groupCounts?: boolean;
  /** The groups (by key) showing every row past their limit. Without it the navigation keeps the list itself. */
  showAll?: string[];
  onShowAllChange?: (showAll: string[]) => void;
  /** While collapsed: one icon per top-level item ("items"), or one per group ("groups", from the group's icon).
   * Loose items between groups keep their own row. */
  rail?: SideNavigationRail;
  /** While collapsed: a short name (shortLabel, else the label) under each icon, in a 72 wide column. The current page,
   * hover and press fill a 56 by 32 indicator around the icon, a count stays a number, and a tooltip shows only a name
   * that was shortened. */
  railLabels?: boolean;
  /** While collapsed, pressing a parent or a rail group: "widen" asks for the full width with it open (onCollapsedChange);
   * "flyout" shows its rows in a panel beside the icon and keeps the column narrow. */
  collapsedParent?: SideNavigationCollapsedParent;
  /** While collapsed, a hairline the icon's width between groups, on top of the gap that separates them. Off: the gap alone. */
  railDividers?: boolean;
  /** "compact": 32 tall rows and 30 tall children under a mouse, and counts as quiet numbers, for long lists (documentation,
   * settings). A touch pointer keeps the touch heights. */
  density?: "default" | "compact";
  /** The level of the group titles' headings (default 2), to fit the page's outline. */
  headingLevel?: SideNavigationHeadingLevel;
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
  /** Brings the current row into the menu's own scrolling column when the menu mounts, when the page changes and when
   * items that hold it arrive. */
  scrollToCurrent?: boolean;
}
type Mode = { collapsed: boolean; labelled: boolean; flyout?: boolean };
const FLYOUT: Mode = { collapsed: false, labelled: false, flyout: true };
const actionCount = (count: number) => ({ ["--_kjun-side-navigation-action-count" as string]: count }) as CSSProperties;

/** A vertical menu for the side of a wide screen: links aligned to the start, the current one filled, groups with titles and up to two levels of children. */
export function KjunSideNavigation({ items, value, ariaLabel, onNavigate, onReselect, expanded, onExpandedChange, collapsed = false, onCollapsedChange,
  collapsibleGroups = false, expandedGroups, onExpandedGroupsChange, groupCounts = false, showAll, onShowAllChange, rail = "items", railLabels = false,
  collapsedParent = "widen", railDividers = false, density = "default", headingLevel = 2, header, footer, collapseToggle = false, onAction, linkAs, scrollToCurrent = true }: KjunSideNavigationProps) {
  const m = useKjunMessages(), id = "kjun-side-" + useId().replace(/[^\w-]/g, ""), geometry = tokens.extensions.sideNavigation;
  const nav = useRef<HTMLElement>(null);
  useEffect(() => checkSideNavigation(items), [items]);
  const { sections, open, update, openGroups, updateGroups, allShown, updateShowAll } = useSideNavigationState(items, value,
    { expanded, onExpandedChange, expandedGroups, onExpandedGroupsChange, showAll, onShowAllChange, collapsibleGroups });
  // The current row comes into the menu's own column: at once the first time it is there (on mount, or when the items
  // that hold it arrive), and after a parent or group has opened when the page changes.
  const present = useMemo(() => sections.some(section => sideItemsHoldCurrent(section.items, value)), [sections, value]);
  const scrolled = useRef(false);
  useEffect(() => {
    if (!scrollToCurrent || !present) return;
    const first = !scrolled.current; scrolled.current = true;
    const timer = setTimeout(() => scrollSideNavigationRow(sideNavigationCurrentRow(nav.current), first), first ? 0 : tokens.motion.collapse);
    return () => clearTimeout(timer);
  }, [value, present, scrollToCurrent]);
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
  // A group pressed in a rail of groups is brought into view once the column has finished widening.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (collapsed || !pending.current) return;
    const target = pending.current; pending.current = null;
    const timer = setTimeout(() => scrollSideNavigationRow(document.getElementById(target)), tokens.motion.collapse);
    return () => clearTimeout(timer);
  }, [collapsed]);
  // After "N more" the first row it revealed takes focus, so the keyboard continues where the list grew.
  const focusNext = useRef<string | null>(null);
  const focusOnMount = (node: HTMLElement | null) => { if (node && focusNext.current) { focusNext.current = null; node.focus(); } };
  const widen = () => { if (!onCollapsedChange) warnNoWiden(); onCollapsedChange?.(false); };
  const setParent = (key: string, next: boolean) => { if (open.includes(key) !== next) update(toggleSideParent(open, key)); };
  // While collapsed a parent cannot show its children, so pressing it asks for the full width with that parent open.
  const reveal = (key: string) => { setParent(key, true); widen(); };
  const titleId = (key: string) => id + "-title-" + sideNavigationIdPart(key);
  const revealGroup = (key: string) => {
    if (!openGroups.includes(key) && sections.some(section => section.key === key && sideSectionToggles(section, collapsibleGroups))) updateGroups([...openGroups, key]);
    pending.current = titleId(key); widen();
  };
  const flyoutMode = collapsed && collapsedParent === "flyout";
  const labelled = collapsed && railLabels, base: Mode = { collapsed, labelled };
  const Heading = ("h" + headingLevel) as "h2";

  // ← and → in an open menu or a flyout (Tab still walks every row); "out" from a flyout's outer row closes the flyout.
  const flyoutTrigger = (key: string) => id + "-fly-" + sideNavigationIdPart(key);
  const leaveFlyout = () => { if (flyout) closeSideNavigationFlyout(() => setFlyout(null), flyoutTrigger(flyout)); };
  const arrows = (mode: Mode, event: KeyboardEvent<HTMLElement>, own?: SideNavigationArrowOwner) => sideNavigationArrowKey(event, own, mode.flyout ? leaveFlyout : undefined);
  const badge = (text: string, dot: boolean, tone?: SideNavigationBadgeTone | null) =>
    <span className="kjun-navigation-badge" data-dot={dot || undefined} data-tone={tone === "neutral" ? "neutral" : undefined} aria-hidden="true">{text}</span>;
  const opens = <span className="kjun-side-navigation-opens" aria-hidden="true"><KjunIcon name="chevron-right" size={geometry.opensMarkerSize} /></span>;
  const glyph = (mode: Mode, icon: string | undefined, label: string, filled: boolean, mark?: ReactNode) => (icon || mode.collapsed) && <span className="kjun-side-navigation-glyph">
    {icon ? <KjunIcon name={icon} className="kjun-side-navigation-icon" filled={filled} size={geometry.iconSize} />
      : <span className="kjun-side-navigation-initial" aria-hidden="true">{sideNavigationInitial(label)}</span>}
    {mode.collapsed && mark}
  </span>;
  // While only icons show, the name is a tooltip; under a labelled rail's icons only a shortened name needs one.
  const named = (mode: Mode, label: string, shown: string, row: ReactElement) =>
    mode.collapsed && (!mode.labelled || shown !== label) ? <KjunTooltip content={label} placement="right">{row}</KjunTooltip> : row;
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
    <KjunPopover open={flyout === key} onOpenChange={next => setFlyout(next ? key : null)} modal={false} placement="right-start" header={title} focusOnOpen trigger={trigger}>{content}</KjunPopover>;
  const openOnArrow = (key: string) => (event: KeyboardEvent) => { if (sideNavigationOpensFlyout(event)) { event.preventDefault(); setFlyout(key); } };

  const link = (mode: Mode, item: SideNavigationDestination, depth: 0 | 1 | 2) => {
    const selected = item.key === value, mark = navigationBadge(item.badge), elsewhere = sideNavigationOpensElsewhere(item), shown = sideNavigationShownLabel(item, mode.labelled);
    const Link: ElementType = !item.disabled && linkAs ? linkAs : "a";
    // A disabled destination keeps its link role and name (an <a> without href has neither) but leaves the tab order.
    return <Link ref={focusNext.current === item.key ? focusOnMount : undefined} className="kjun-side-navigation-item" data-child={depth ? "" : undefined} data-depth={depth === 2 ? "2" : undefined}
      href={item.disabled ? undefined : item.href} role={item.disabled ? "link" : undefined} tabIndex={item.disabled ? -1 : undefined}
      target={item.disabled ? undefined : item.target} rel={elsewhere ? "noopener noreferrer" : undefined}
      aria-label={sideNavigationLinkLabel(item, m, mode.labelled)} aria-disabled={item.disabled || undefined} aria-current={selected ? "page" : undefined}
      onKeyDown={mode.collapsed ? undefined : (event: KeyboardEvent<HTMLElement>) => arrows(mode, event)}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (item.disabled) { event.preventDefault(); return; }
        if (elsewhere || !isPlainNavigationClick(event)) return;
        onNavigate?.(item.key, event);
        if (selected) onReselect?.(item.key, event);
        if (mode.flyout) setFlyout(null);
      }}>
      {/* On the icon's corner a count would cover the icon, so it shrinks to a dot; the link's name keeps the number.
          Beside a labelled rail's wider indicator the number fits. */}
      {!depth && glyph(mode, item.icon, item.label, selected, mark && (mode.labelled ? badge(mark.text, mark.dot, item.badgeTone) : badge("", true, item.badgeTone)))}
      <span className={labelClass(mode)}>{shown}</span>
      {!mode.collapsed && mark && badge(mark.text, mark.dot, item.badgeTone)}
      {!mode.collapsed && elsewhere && <KjunIcon name="external-link" className="kjun-side-navigation-trailing" size={geometry.chevronSize} />}
    </Link>;
  };
  // A destination's row: the link, and its actions beside it (a button cannot sit inside a link).
  const destination = (mode: Mode, item: SideNavigationDestination, depth: 0 | 1 | 2 = 0) => {
    const actions = !mode.collapsed && item.actions?.length ? item.actions : undefined;
    return <li key={item.key} className="kjun-side-navigation-row" data-actions={actions ? "" : undefined} style={actions && actionCount(actions.length)}>
      {named(mode, item.label, sideNavigationShownLabel(item, mode.labelled), link(mode, item, depth))}
      {actions && actionButtons(item.key, actions)}
    </li>;
  };
  // A parent inside a parent: a child row with a chevron that opens its destinations one step further in, in a full menu
  // and in a flyout alike.
  const subParent = (mode: Mode, item: SideNavigationSubParent) => {
    const panel = id + "-parent-" + sideNavigationIdPart(item.key), { shown, within, dot, tone } = sideParentState(item, { open, collapsed: false, value });
    return <li key={item.key} className="kjun-side-navigation-row">
      <button ref={focusNext.current === item.key ? focusOnMount : undefined} type="button" className="kjun-side-navigation-item" data-child="" aria-expanded={shown} aria-controls={panel}
        aria-disabled={item.disabled || undefined} tabIndex={item.disabled ? -1 : undefined} aria-label={dot ? sideNavigationToggleName(item.label, dot, m) : undefined}
        data-current-within={within ? "" : undefined} onClick={item.disabled ? undefined : () => setParent(item.key, !shown)}
        onKeyDown={item.disabled ? undefined : event => arrows(mode, event, { shown, panel, set: next => setParent(item.key, next) })}>
        <span className="kjun-side-navigation-label">{item.label}</span>
        {dot && badge("", true, tone)}
        <KjunIcon name="chevron-down" className="kjun-side-navigation-chevron" size={geometry.chevronSize} />
      </button>
      <div id={panel} data-side-panel=""><Collapse open={shown}><ul className="kjun-side-navigation-children">{item.children.map(child => destination(mode, child, 2))}</ul></Collapse></div>
    </li>;
  };
  const childRow = (mode: Mode, child: SideNavigationParent["children"][number]) => isSideParent(child) ? subParent(mode, child) : destination(mode, child, 1);
  const parent = (mode: Mode, item: SideNavigationParent) => {
    const flies = mode.collapsed && flyoutMode && !item.disabled, panel = id + "-parent-" + sideNavigationIdPart(item.key), shown = sideNavigationShownLabel(item, mode.labelled);
    const state = sideParentState(item, { open, collapsed: mode.collapsed, value });
    const button = <button ref={focusNext.current === item.key ? focusOnMount : undefined} id={flies ? flyoutTrigger(sideFlyoutKey("parent", item.key)) : undefined} type="button"
      className="kjun-side-navigation-item" aria-expanded={flies ? undefined : state.shown}
      aria-controls={flies ? undefined : panel}
      // aria-disabled instead of disabled: the row keeps its tooltip and its name while it cannot open.
      aria-disabled={item.disabled || undefined} tabIndex={item.disabled ? -1 : undefined}
      aria-label={state.dot || shown !== item.label ? sideNavigationToggleName(item.label, state.dot, m) : undefined}
      onKeyDown={item.disabled ? undefined : flies ? openOnArrow(sideFlyoutKey("parent", item.key)) : mode.collapsed ? undefined
        : event => arrows(mode, event, { shown: state.shown, panel, set: next => setParent(item.key, next) })}
      onClick={flies || item.disabled ? undefined : () => mode.collapsed ? reveal(item.key) : setParent(item.key, !state.shown)}
      // A hidden set of children is stood for by its parent, so the place in the menu is never lost.
      data-current-within={state.within ? "" : undefined}>
      {glyph(mode, item.icon, item.label, false, <>{state.dot && badge("", true, state.tone)}{!item.disabled && opens}</>)}
      <span className={labelClass(mode)}>{shown}</span>
      {!mode.collapsed && state.dot && badge("", true, state.tone)}
      {!mode.collapsed && <KjunIcon name="chevron-down" className="kjun-side-navigation-chevron" size={geometry.chevronSize} />}
    </button>;
    return <li key={item.key} className="kjun-side-navigation-row">
      {flies ? flyoutPanel(sideFlyoutKey("parent", item.key), item.label, named(mode, item.label, shown, button),
        <ul className="kjun-side-navigation-flyout" data-parent="">{item.children.map(child => childRow(FLYOUT, child))}</ul>)
        : named(mode, item.label, shown, button)}
      {!flies && <div id={panel} data-side-panel=""><Collapse open={state.shown}><ul className="kjun-side-navigation-children">{item.children.map(child => childRow(mode, child))}</ul></Collapse></div>}
    </li>;
  };
  const row = (mode: Mode, item: SideNavigationItem) => isSideParent(item) ? parent(mode, item) : destination(mode, item);
  // An empty group's line in place of its rows: quiet text where a child row's name starts, never a link.
  const emptyRow = (text: string) => <li key=":empty" className="kjun-side-navigation-row"><p className="kjun-side-navigation-empty">{text}</p></li>;
  // A group's rows under its limit, and the row that shows the rest or folds them again. Icons only, every row shows.
  const groupRows = (mode: Mode, section: SideNavigationSection) => {
    if (mode.collapsed) return section.items.map(item => row(mode, item));
    const none = sideSectionEmpty(section);
    if (none) return [emptyRow(none)];
    const { items: visible, hidden, expandable, expanded: all } = sideSectionRows(section, { value, showAll: allShown });
    if (!expandable) return visible.map(item => row(mode, item));
    const key = section.key!, iconic = section.items.some(item => item.icon);
    const toggle = () => {
      if (!all) focusNext.current = section.items.find(item => !visible.includes(item))?.key ?? null;
      updateShowAll(toggleSideParent(allShown, key));
    };
    return [...visible.map(item => row(mode, item)), <li key=":more" className="kjun-side-navigation-row">
      <button type="button" className="kjun-side-navigation-item kjun-side-navigation-more" aria-expanded={all} onClick={toggle} onKeyDown={event => arrows(mode, event)}>
        {iconic && glyph(mode, all ? "chevron-up" : "dots", "", false)}
        <span className="kjun-side-navigation-label">{all ? m.showFewerItems : m.showMoreItems(hidden)}</span>
      </button>
    </li>];
  };

  // A titled group's heading: its title (static or a toggle) and the group's action.
  const heading = (section: SideNavigationTitledSection, title: ReactNode) => {
    const action = !collapsed && section.action;
    return <div className="kjun-side-navigation-heading" data-actions={action ? "" : undefined} style={action ? actionCount(1) : undefined}>
      {title}{action && actionButtons(section.key, [action])}
    </div>;
  };
  // A group title that opens and closes its group, inside its heading. Its end holds what a parent row's end holds: a dot
  // for a badge inside a closed group, or the number of rows (groupCounts), then a chevron that turns over when open.
  // Closed over the current page, the name takes full ink.
  const groupToggle = (section: SideNavigationTitledSection, rows: ReactNode) => {
    const { shown, within, dot, tone, count } = sideGroupState(section, { openGroups, value }), panel = id + "-group-" + sideNavigationIdPart(section.key);
    const set = (next: boolean) => { if (shown !== next) updateGroups(toggleSideParent(openGroups, section.key)); };
    return <>
      {heading(section, <Heading className="kjun-side-navigation-title-heading">
        <button type="button" id={titleId(section.key)} className="kjun-side-navigation-title" data-toggle="" aria-expanded={shown} aria-controls={panel}
          aria-label={dot ? sideNavigationToggleName(section.title, dot, m) : undefined} data-current-within={within ? "" : undefined}
          onClick={() => set(!shown)} onKeyDown={event => arrows(base, event, { shown, panel, set })}>
          <span className="kjun-side-navigation-label">{section.title}</span>
          {dot ? badge("", true, tone) : groupCounts ? <span className="kjun-side-navigation-count" aria-hidden="true">{count}</span> : null}
          <KjunIcon name="chevron-down" className="kjun-side-navigation-chevron" size={geometry.groupChevronSize} />
        </button>
      </Heading>)}
      <div id={panel} data-side-panel=""><Collapse open={shown}><ul className="kjun-side-navigation-group-items">{rows}</ul></Collapse></div>
    </>;
  };
  const section = (entry: SideNavigationSection, index: number) => {
    const rows = groupRows(base, entry);
    if (!isTitledSection(entry)) return <ul key={"loose:" + (entry.items[0]?.key ?? index)}>{rows}</ul>;
    const toggled = !collapsed && sideSectionToggles(entry, collapsibleGroups);
    return <div key={"group:" + entry.key} className="kjun-side-navigation-section" role="group" aria-labelledby={titleId(entry.key)} data-toggles={toggled ? "" : undefined}>
      {toggled ? groupToggle(entry, rows) : <>
        {heading(entry, <Heading id={titleId(entry.key)} className={"kjun-side-navigation-title" + (collapsed ? " kjun-sr-only" : "")}>{entry.title}</Heading>)}
        <ul>{rows}</ul>
      </>}
    </div>;
  };
  // A group in a rail of groups: its icon (or initial) with the opens mark, half the selection fill while it holds the
  // current page, and a dot when an item in it has a badge. Pressing it widens with the group open, or opens its rows
  // beside it (flyout).
  const railGroup = (group: SideNavigationTitledSection) => {
    const { within, dot, tone } = sideRailGroupState(group, value), shown = sideNavigationShownTitle(group, labelled), key = sideFlyoutKey("group", group.key);
    const button = <button type="button" id={flyoutMode ? flyoutTrigger(key) : undefined} className="kjun-side-navigation-item" aria-label={dot || shown !== group.title ? sideNavigationToggleName(group.title, dot, m) : undefined}
      data-current-within={within ? "" : undefined} onKeyDown={flyoutMode ? openOnArrow(key) : undefined} onClick={flyoutMode ? undefined : () => revealGroup(group.key)}>
      {glyph(base, group.icon, group.title, false, <>{dot && badge("", true, tone)}{opens}</>)}
      <span className={labelClass(base)}>{shown}</span>
    </button>;
    return <li key={key} className="kjun-side-navigation-row">
      {flyoutMode ? flyoutPanel(key, group.title, named(base, group.title, shown, button), <ul className="kjun-side-navigation-flyout">{sideSectionEmpty(group) ? emptyRow(group.empty!) : group.items.map(item => row(FLYOUT, item))}</ul>)
        : named(base, group.title, shown, button)}
    </li>;
  };

  const slot = (content: SideNavigationSlot) => typeof content === "function" ? content(collapsed) : content;
  const top = slot(header), bottom = slot(footer), listId = id + "-list";
  const toggleLabel = collapsed ? m.expandNavigation : m.collapseNavigation;
  // The sidebar icons are outside the default icon set, so the toggle carries them itself.
  const toggleButton = collapseToggle && <KjunTooltip content={toggleLabel} placement="right">
    <button type="button" className="kjun-side-navigation-toggle" aria-label={toggleLabel} aria-expanded={!collapsed} aria-controls={listId} onClick={() => onCollapsedChange?.(!collapsed)}>
      <IconFallbacks icons={componentIcons}><KjunIcon name={collapsed ? "layout-sidebar-left-expand" : "layout-sidebar-left-collapse"} size={geometry.iconSize} /></IconFallbacks>
    </button>
  </KjunTooltip>;
  const hasTop = top != null && top !== false, hasBottom = bottom != null && bottom !== false;
  const railOfGroups = collapsed && rail === "groups";
  return <nav ref={nav} className="kjun-side-navigation" data-collapsed={collapsed ? "" : undefined} data-rail={railOfGroups ? "groups" : undefined} data-rail-dividers={collapsed && railDividers ? "" : undefined} data-rail-labels={labelled ? "" : undefined}
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
