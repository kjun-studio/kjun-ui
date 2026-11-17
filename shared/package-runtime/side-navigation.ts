import { navigationBadge, type NavigationBadge } from "./navigation-badge";

/** A small button at the end of a row or a group title, such as "New" or "More". It does not navigate; the press reaches
 * onAction (Vue: the action event) with the row's key and the action's key. */
export interface SideNavigationAction { key: string; icon: string; label: string }
/** A destination in the side navigation: the bottom navigation's shape, so one list can feed both. */
export interface SideNavigationDestination { key: string; label: string; href: string;
  /** Drawn on top-level rows only; a child row starts at its parent's label and draws no icon. */
  icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+. 0 and "" draw nothing. */
  badge?: NavigationBadge; disabled?: boolean;
  /** Where the link opens on Web, such as "_blank" for a page outside the app. Such a link is left to the browser. */
  target?: string;
  /** Buttons at the end of the row, shown under a pointer or focus (always on touch). Hidden while only icons show. */
  actions?: SideNavigationAction[] }
/** The fields every destination type shares; Native's destination has an optional href. */
type Destination = { key: string; label: string; icon?: string; badge?: NavigationBadge; disabled?: boolean; target?: string; actions?: SideNavigationAction[] };
/** A parent that opens one level of destinations under it. It is a toggle and does not navigate itself. */
export interface SideNavigationParent<D extends Destination = SideNavigationDestination> { key: string; label: string; icon?: string; disabled?: boolean; children: D[] }
export type SideNavigationItem<D extends Destination = SideNavigationDestination> = D | SideNavigationParent<D>;
/** A titled run of items, such as "Documents" or "Admin". */
export interface SideNavigationGroup<D extends Destination = SideNavigationDestination> { title: string; items: SideNavigationItem<D>[];
  /** The group's identity in expandedGroups; the title when absent. */
  key?: string;
  /** The group's mark in a collapsed rail of groups (rail="groups"); its title's first character when absent. */
  icon?: string;
  /** Whether this title opens and closes its group. Absent: the navigation's collapsibleGroups. */
  collapsible?: boolean;
  /** Starts open when the navigation keeps the open groups itself. The current page's group always starts open. */
  defaultOpen?: boolean;
  /** One button at the end of the title, such as "New project". */
  action?: SideNavigationAction }
export type SideNavigationEntry<D extends Destination = SideNavigationDestination> = SideNavigationItem<D> | SideNavigationGroup<D>;
export interface SideNavigationSection<D extends Destination = SideNavigationDestination> { title?: string; items: SideNavigationItem<D>[];
  /** Set on a titled section: the group's key (its title when the group has none) and icon. */
  key?: string; icon?: string; collapsible?: boolean; defaultOpen?: boolean; action?: SideNavigationAction }
/** A titled section, as a rail of groups or a toggle reads it. */
export type SideNavigationTitledSection<D extends Destination = SideNavigationDestination> = SideNavigationSection<D> & { key: string; title: string };
/** What a collapsed menu shows one icon for: each top-level item, or each group (loose items keep their own row). */
export type SideNavigationRail = "items" | "groups";
/** While collapsed, what pressing a parent or a group does: widen the column with it open, or show its rows in a
 * floating panel beside the icon and keep the column narrow. */
export type SideNavigationCollapsedParent = "widen" | "flyout";

export const isSideGroup = <D extends Destination>(entry: SideNavigationEntry<D>): entry is SideNavigationGroup<D> => "items" in entry;
export const isSideParent = <D extends Destination>(item: SideNavigationItem<D>): item is SideNavigationParent<D> => "children" in item;
export const isTitledSection = <D extends Destination>(section: SideNavigationSection<D>): section is SideNavigationTitledSection<D> => section.key !== undefined;

/** The entries as sections in order: loose items between groups form untitled sections, each group its own titled one. */
export function sideNavigationSections<D extends Destination>(entries: readonly SideNavigationEntry<D>[]): SideNavigationSection<D>[] {
  const sections: SideNavigationSection<D>[] = [];
  let loose: SideNavigationItem<D>[] | null = null;
  for (const entry of entries) {
    if (isSideGroup(entry)) {
      loose = null;
      sections.push({ title: entry.title, items: entry.items, key: sideGroupKey(entry), icon: entry.icon, collapsible: entry.collapsible, defaultOpen: entry.defaultOpen, action: entry.action });
    } else { if (!loose) sections.push({ items: (loose = []) }); loose.push(entry); }
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

/** Whether a titled section's title opens and closes it: its own collapsible, else the navigation's collapsibleGroups. */
export const sideSectionToggles = <D extends Destination>(section: SideNavigationSection<D>, collapsibleGroups: boolean): section is SideNavigationTitledSection<D> =>
  isTitledSection(section) && (section.collapsible ?? collapsibleGroups);

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

/** The groups a navigation that keeps its own list starts with: those marked defaultOpen and the current page's group. */
export function sideNavigationInitialGroups<D extends Destination>(entries: readonly SideNavigationEntry<D>[], value: string | null | undefined): string[] {
  const marked = sideNavigationSections(entries).filter(section => section.key !== undefined && section.defaultOpen).map(section => section.key!);
  return [...sideNavigationWithCurrentGroups(marked, entries, value)];
}

/** The rows of a collapsed rail of groups, in order: one per titled group, and the loose items between groups as they are. */
export type SideNavigationRailRow<D extends Destination = SideNavigationDestination> = { group: SideNavigationTitledSection<D> } | { item: SideNavigationItem<D> };
export function sideNavigationGroupRail<D extends Destination>(entries: readonly SideNavigationEntry<D>[]): SideNavigationRailRow<D>[] {
  return sideNavigationSections(entries).flatMap((section): SideNavigationRailRow<D>[] => isTitledSection(section)
    ? [{ group: section }] : section.items.map(item => ({ item })));
}

/** The next list of open parents after one is toggled. */
export const toggleSideParent = (open: readonly string[], key: string): string[] => open.includes(key) ? open.filter(item => item !== key) : [...open, key];

/** A parent stands for its children while they are hidden: it holds the current page, or a child has a badge. */
export const sideParentHoldsCurrent = <D extends Destination>(parent: SideNavigationParent<D>, value: string | null | undefined) => parent.children.some(child => child.key === value);
export const sideParentHasBadge = <D extends Destination>(parent: SideNavigationParent<D>) => parent.children.some(child => !child.disabled && navigationBadge(child.badge));

/** What a parent row shows: whether its children are on screen, and what it stands for while they are not (a closed
 * parent holding the current page, a dot for a child's badge). In a flyout the children show beside, not under, it. */
export function sideParentState<D extends Destination>(parent: SideNavigationParent<D>, { open, collapsed, value }: { open: readonly string[]; collapsed: boolean; value: string | null | undefined }) {
  const shown = !collapsed && open.includes(parent.key);
  return { shown, within: !shown && sideParentHoldsCurrent(parent, value), dot: !shown && sideParentHasBadge(parent) };
}
/** What a group toggle shows while closed: the selection's trace, a dot for a badge inside, and how many rows it holds. */
export function sideGroupState<D extends Destination>(section: SideNavigationTitledSection<D>, { openGroups, value }: { openGroups: readonly string[]; value: string | null | undefined }) {
  const shown = openGroups.includes(section.key);
  return { shown, within: !shown && sideItemsHoldCurrent(section.items, value), dot: !shown && sideItemsHaveBadge(section.items), count: section.items.length };
}
/** A rail-of-groups row: always closed, so it stands for everything in its group. */
export const sideRailGroupState = <D extends Destination>(section: SideNavigationTitledSection<D>, value: string | null | undefined) =>
  ({ within: sideItemsHoldCurrent(section.items, value), dot: sideItemsHaveBadge(section.items) });

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

/** A key as part of an element id: anything outside [A-Za-z0-9_-] becomes its code point, so different keys stay apart. */
export const sideNavigationIdPart = (key: string) => key.replace(/[^\w-]/g, char => "_" + char.codePointAt(0)!.toString(36));

const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
const warned = new Set<string>();
/** A one-time development warning. */
export function warnSideNavigation(message: string) {
  if (!developmentMode() || warned.has(message)) return;
  warned.add(message);
  console.warn("[KJUN] KjunSideNavigation: " + message);
}
/** Keys that repeat: two rows or two groups with one key open, close and mark the current page together. */
export function sideNavigationDuplicateKeys<D extends Destination>(entries: readonly SideNavigationEntry<D>[]) {
  const items = new Set<string>(), groups = new Set<string>(), repeated: string[] = [];
  const see = (set: Set<string>, key: string, kind: string) => { if (set.has(key)) repeated.push(kind + " \"" + key + "\""); else set.add(key); };
  for (const section of sideNavigationSections(entries)) {
    if (section.key !== undefined) see(groups, section.key, "group");
    for (const item of section.items) {
      see(items, item.key, "item");
      if (isSideParent(item)) for (const child of item.children) see(items, child.key, "item");
    }
  }
  return repeated;
}
/** Development checks for a navigation's items and the props that read them. */
export function checkSideNavigation<D extends Destination>(entries: readonly SideNavigationEntry<D>[]) {
  const repeated = sideNavigationDuplicateKeys(entries);
  if (repeated.length) warnSideNavigation("keys must be unique; repeated " + repeated.join(", ") + ". Give groups with the same title a key.");
}
/** A parent or group pressed while collapsed asks to widen; without a handler the press would do nothing visible. */
export const warnNoWiden = () => warnSideNavigation("a parent or group was pressed while collapsed, but nothing handles onCollapsedChange (Vue: v-model:collapsed). Handle it, or use collapsedParent=\"flyout\".");
