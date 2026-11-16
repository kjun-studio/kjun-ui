import type { NavigationBadge } from "./navigation-badge";

/** A destination in the side navigation: the bottom navigation's shape, so one list can feed both. */
export interface SideNavigationDestination { key: string; label: string; href: string; icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+. 0 and "" draw nothing. */
  badge?: NavigationBadge; disabled?: boolean }
/** A parent that opens one level of destinations under it. It is a toggle and does not navigate itself. */
export interface SideNavigationParent { key: string; label: string; icon?: string; disabled?: boolean; children: SideNavigationDestination[] }
export type SideNavigationItem = SideNavigationDestination | SideNavigationParent;
/** A titled run of items, such as "Documents" or "Admin". */
export interface SideNavigationGroup { title: string; items: SideNavigationItem[] }
export type SideNavigationEntry = SideNavigationItem | SideNavigationGroup;

export const isSideGroup = (entry: SideNavigationEntry): entry is SideNavigationGroup => "items" in entry;
export const isSideParent = (item: SideNavigationItem): item is SideNavigationParent => "children" in item;

/** The entries as sections in order: loose items between groups form untitled sections, each group its own titled one. */
export function sideNavigationSections(entries: readonly SideNavigationEntry[]): { title?: string; items: SideNavigationItem[] }[] {
  const sections: { title?: string; items: SideNavigationItem[] }[] = [];
  let loose: SideNavigationItem[] | null = null;
  for (const entry of entries) {
    if (isSideGroup(entry)) { loose = null; sections.push({ title: entry.title, items: entry.items }); }
    else { if (!loose) sections.push({ items: (loose = []) }); loose.push(entry); }
  }
  return sections;
}

/** The parents that hold the current destination; they start open so the current page is in view. */
export function sideNavigationCurrentParents(entries: readonly SideNavigationEntry[], value: string | null | undefined): string[] {
  return sideNavigationSections(entries).flatMap(section => section.items)
    .filter(item => isSideParent(item) && item.children.some(child => child.key === value)).map(item => item.key);
}

/** The next list of open parents after one is toggled. */
export const toggleSideParent = (open: readonly string[], key: string): string[] => open.includes(key) ? open.filter(item => item !== key) : [...open, key];
