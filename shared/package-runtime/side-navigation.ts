import { navigationBadge, type NavigationBadge } from "./navigation-badge";

/** A destination in the side navigation: the bottom navigation's shape, so one list can feed both. */
export interface SideNavigationDestination { key: string; label: string; href: string;
  /** Drawn on top-level rows only; a child row starts at its parent's label and draws no icon. */
  icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+. 0 and "" draw nothing. */
  badge?: NavigationBadge; disabled?: boolean;
  /** Where the link opens on Web, such as "_blank" for a page outside the app. Such a link is left to the browser. */
  target?: string }
/** The fields every destination type shares; Native's destination has an optional href. */
type Destination = { key: string; label: string; icon?: string; badge?: NavigationBadge; disabled?: boolean; target?: string };
/** A parent that opens one level of destinations under it. It is a toggle and does not navigate itself. */
export interface SideNavigationParent<D extends Destination = SideNavigationDestination> { key: string; label: string; icon?: string; disabled?: boolean; children: D[] }
export type SideNavigationItem<D extends Destination = SideNavigationDestination> = D | SideNavigationParent<D>;
/** A titled run of items, such as "Documents" or "Admin". */
export interface SideNavigationGroup<D extends Destination = SideNavigationDestination> { title: string; items: SideNavigationItem<D>[];
  /** The group's identity in expandedGroups; the title when absent. */
  key?: string;
  /** The group's mark in a collapsed rail of groups (rail="groups"); its title's first character when absent. */
  icon?: string }
export type SideNavigationEntry<D extends Destination = SideNavigationDestination> = SideNavigationItem<D> | SideNavigationGroup<D>;
export interface SideNavigationSection<D extends Destination = SideNavigationDestination> { title?: string; items: SideNavigationItem<D>[];
  /** Set on a titled section: the group's key (its title when the group has none) and icon. */
  key?: string; icon?: string }
/** What a collapsed menu shows one icon for: each top-level item, or each group (loose items keep their own row). */
export type SideNavigationRail = "items" | "groups";

export const isSideGroup = <D extends Destination>(entry: SideNavigationEntry<D>): entry is SideNavigationGroup<D> => "items" in entry;
export const isSideParent = <D extends Destination>(item: SideNavigationItem<D>): item is SideNavigationParent<D> => "children" in item;

/** The entries as sections in order: loose items between groups form untitled sections, each group its own titled one. */
export function sideNavigationSections<D extends Destination>(entries: readonly SideNavigationEntry<D>[]): SideNavigationSection<D>[] {
  const sections: SideNavigationSection<D>[] = [];
  let loose: SideNavigationItem<D>[] | null = null;
  for (const entry of entries) {
    if (isSideGroup(entry)) { loose = null; sections.push({ title: entry.title, items: entry.items, key: sideGroupKey(entry), icon: entry.icon }); }
    else { if (!loose) sections.push({ items: (loose = []) }); loose.push(entry); }
  }
  return sections;
}

/** The parents that hold the current destination; they start open so the current page is in view. */
export function sideNavigationCurrentParents<D extends Destination>(entries: readonly SideNavigationEntry<D>[], value: string | null | undefined): string[] {
  return sideNavigationSections(entries).flatMap(section => section.items)
    .filter(item => isSideParent(item) && item.children.some(child => child.key === value)).map(item => item.key);
}

/** The open parents once the current destination's parents are added. The same array when nothing was added, so a
 * component can tell whether to store or report a change. */
export function sideNavigationWithCurrentParents<D extends Destination>(open: readonly string[], entries: readonly SideNavigationEntry<D>[], value: string | null | undefined): readonly string[] {
  const missing = sideNavigationCurrentParents(entries, value).filter(key => !open.includes(key));
  return missing.length ? [...open, ...missing] : open;
}

/** A group's identity in expandedGroups. */
export const sideGroupKey = (group: { key?: string; title: string }) => group.key ?? group.title;

/** Whether a run of items holds the current destination, directly or under a parent. */
export const sideItemsHoldCurrent = <D extends Destination>(items: readonly SideNavigationItem<D>[], value: string | null | undefined) =>
  items.some(item => isSideParent(item) ? sideParentHoldsCurrent(item, value) : item.key === value);
/** Whether a run of items has a badge to show while it is hidden behind its group. */
export const sideItemsHaveBadge = <D extends Destination>(items: readonly SideNavigationItem<D>[]) =>
  items.some(item => isSideParent(item) ? !item.disabled && sideParentHasBadge(item) : !item.disabled && !!navigationBadge(item.badge));

/** The open groups once the group of the current destination is added. The same array when nothing was added, like
 * sideNavigationWithCurrentParents, so a component can tell whether to store or report a change. */
export function sideNavigationWithCurrentGroups<D extends Destination>(open: readonly string[], entries: readonly SideNavigationEntry<D>[], value: string | null | undefined): readonly string[] {
  const missing = sideNavigationSections(entries).filter(section => section.key !== undefined && sideItemsHoldCurrent(section.items, value))
    .map(section => section.key!).filter(key => !open.includes(key));
  return missing.length ? [...open, ...missing] : open;
}

/** The rows of a collapsed rail of groups, in order: one per titled group, and the loose items between groups as they are. */
export type SideNavigationRailRow<D extends Destination = SideNavigationDestination> = { group: SideNavigationSection<D> & { key: string; title: string } } | { item: SideNavigationItem<D> };
export function sideNavigationGroupRail<D extends Destination>(entries: readonly SideNavigationEntry<D>[]): SideNavigationRailRow<D>[] {
  return sideNavigationSections(entries).flatMap((section): SideNavigationRailRow<D>[] => section.key !== undefined
    ? [{ group: section as SideNavigationSection<D> & { key: string; title: string } }] : section.items.map(item => ({ item })));
}

/** The next list of open parents after one is toggled. */
export const toggleSideParent = (open: readonly string[], key: string): string[] => open.includes(key) ? open.filter(item => item !== key) : [...open, key];

/** A parent stands for its children while they are hidden: it holds the current page, or a child has a badge. */
export const sideParentHoldsCurrent = <D extends Destination>(parent: SideNavigationParent<D>, value: string | null | undefined) => parent.children.some(child => child.key === value);
export const sideParentHasBadge = <D extends Destination>(parent: SideNavigationParent<D>) => parent.children.some(child => !child.disabled && navigationBadge(child.badge));

/** A link that leaves this tab (target="_blank" and the like). The browser opens it; the app is not asked to route. */
export const sideNavigationOpensElsewhere = (destination: { target?: string }) => !!destination.target && destination.target !== "_self";

/** A plain primary click: no modifier key and the main button. Modified clicks open a new tab or window, so they are left
 * to the browser. Fields missing from an event (a touch on Native Web) count as plain. */
export function isPlainNavigationClick(event: { button?: number; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; defaultPrevented?: boolean } | null | undefined) {
  if (!event) return true;
  return !event.defaultPrevented && (event.button ?? 0) === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** The first character of a label: the mark of a row without an icon while the navigation shows icons only. */
export const sideNavigationInitial = (label: string) => Array.from(label.trim())[0] ?? "";
