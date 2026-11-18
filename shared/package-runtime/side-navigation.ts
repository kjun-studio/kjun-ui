import { navigationBadge, navigationLabel, type NavigationBadge } from "./navigation-badge";

/** A small button at the end of a row or a group title, such as "New" or "More". It does not navigate; the press reaches
 * onAction (Vue: the action event) with the row's key and the action's key. */
export interface SideNavigationAction { key: string; icon: string; label: string }
/** How loud a badge is: "alert" (the default) is the danger pill, "neutral" a quiet grey count for plain totals. */
export type SideNavigationBadgeTone = "alert" | "neutral";
/** A destination in the side navigation: the bottom navigation's shape, so one list can feed both. */
export interface SideNavigationDestination { key: string; label: string; href: string;
  /** Drawn on top-level rows only; a child row starts at its parent's label and draws no icon. */
  icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+. 0 and "" draw nothing. */
  badge?: NavigationBadge;
  /** "neutral" draws the badge as a quiet grey count; keep "alert" (the default) for what needs attention. */
  badgeTone?: SideNavigationBadgeTone;
  disabled?: boolean;
  /** The name under the icon in a labelled rail (railLabels), which is only 72 wide: about four Korean characters. The
   * full label stays the accessible name and shows as a tooltip there. */
  shortLabel?: string;
  /** Where the link opens on Web, such as "_blank" for a page outside the app. Such a link is left to the browser. */
  target?: string;
  /** Buttons at the end of the row, shown under a pointer or focus (always on touch). Hidden while only icons show. */
  actions?: SideNavigationAction[] }
/** The fields every destination type shares; Native's destination has an optional href. */
type Destination = { key: string; label: string; icon?: string; badge?: NavigationBadge; badgeTone?: SideNavigationBadgeTone; disabled?: boolean; shortLabel?: string;
  target?: string; actions?: SideNavigationAction[] };
/** What any platform's destination holds, for helpers generic over Web's and Native's. */
export type SideNavigationAnyDestination = Destination;
/** A parent under a parent: the second and last level. It opens its destinations in place, one step further in. */
export interface SideNavigationSubParent<D extends Destination = SideNavigationDestination> { key: string; label: string; disabled?: boolean; children: D[] }
/** A parent that opens its destinations under it. Its children may hold one more level of parents. It is a toggle and
 * does not navigate itself. */
export interface SideNavigationParent<D extends Destination = SideNavigationDestination> { key: string; label: string; icon?: string; disabled?: boolean;
  /** The name under the icon in a labelled rail (railLabels). */
  shortLabel?: string;
  children: (D | SideNavigationSubParent<D>)[] }
export type SideNavigationItem<D extends Destination = SideNavigationDestination> = D | SideNavigationParent<D>;
/** A titled run of items, such as "Documents" or "Admin". */
export interface SideNavigationGroup<D extends Destination = SideNavigationDestination> { title: string; items: SideNavigationItem<D>[];
  /** The group's identity in expandedGroups and showAll; the title when absent. */
  key?: string;
  /** The group's mark in a collapsed rail of groups (rail="groups"); its title's first character when absent. */
  icon?: string;
  /** The group's name under its icon in a labelled rail of groups. */
  shortTitle?: string;
  /** Whether this title opens and closes its group. Absent: the navigation's collapsibleGroups. */
  collapsible?: boolean;
  /** Starts open when the navigation keeps the open groups itself. The current page's group always starts open. */
  defaultOpen?: boolean;
  /** Shows only the first rows and a "N more" row for the rest, for lists people grow (projects, channels). The row of the
   * current page always shows. */
  limit?: number;
  /** One button at the end of the title, such as "New project". */
  action?: SideNavigationAction;
  /** A quiet line shown in place of the rows while the group has none, such as "No projects yet", so an empty group does
   * not read as a closed one. */
  empty?: string }
export type SideNavigationEntry<D extends Destination = SideNavigationDestination> = SideNavigationItem<D> | SideNavigationGroup<D>;
export interface SideNavigationSection<D extends Destination = SideNavigationDestination> { title?: string; items: SideNavigationItem<D>[];
  /** Set on a titled section: the group's key (its title when the group has none) and its options. */
  key?: string; icon?: string; shortTitle?: string; collapsible?: boolean; defaultOpen?: boolean; limit?: number; action?: SideNavigationAction; empty?: string }
/** A titled section, as a rail of groups or a toggle reads it. */
export type SideNavigationTitledSection<D extends Destination = SideNavigationDestination> = SideNavigationSection<D> & { key: string; title: string };
/** What a collapsed menu shows one icon for: each top-level item, or each group (loose items keep their own row). */
export type SideNavigationRail = "items" | "groups";
/** While collapsed, what pressing a parent or a group does: widen the column with it open, or show its rows in a
 * floating panel beside the icon and keep the column narrow. */
export type SideNavigationCollapsedParent = "widen" | "flyout";
/** The width of an open column in KjunSideNavigationLayout. */
export type SideNavigationWidth = "sm" | "md" | "lg";

type AnyParent<D extends Destination> = SideNavigationParent<D> | SideNavigationSubParent<D>;
type Node<D extends Destination> = D | AnyParent<D>;

export const isSideGroup = <D extends Destination>(entry: SideNavigationEntry<D>): entry is SideNavigationGroup<D> => "items" in entry;
export const isSideParent = <T extends { key: string }>(item: T): item is Extract<T, { children: unknown[] }> => "children" in item;
/** The same test inside the runtime, where the destination type is generic. */
const isParentNode = <D extends Destination>(node: Node<D>): node is AnyParent<D> => "children" in node;
export const isTitledSection = <D extends Destination>(section: SideNavigationSection<D>): section is SideNavigationTitledSection<D> => section.key !== undefined;

/** The entries as sections in order: loose items between groups form untitled sections, each group its own titled one. */
export function sideNavigationSections<D extends Destination>(entries: readonly SideNavigationEntry<D>[]): SideNavigationSection<D>[] {
  const sections: SideNavigationSection<D>[] = [];
  let loose: SideNavigationItem<D>[] | null = null;
  for (const entry of entries) {
    if (isSideGroup(entry)) {
      loose = null;
      const { title, items, icon, shortTitle, collapsible, defaultOpen, limit, action, empty } = entry;
      sections.push({ title, items, key: sideGroupKey(entry), icon, shortTitle, collapsible, defaultOpen, limit, action, empty });
    } else { if (!loose) sections.push({ items: (loose = []) }); loose.push(entry); }
  }
  return sections;
}

/** The parents on the way to a destination, outermost first; empty when it is not under a parent (or not found). */
function sideNavigationPath<D extends Destination>(items: readonly Node<D>[], value: string | null | undefined): string[] {
  for (const item of items) {
    if (!isParentNode(item)) continue;
    if (item.children.some(child => !isParentNode(child) && child.key === value)) return [item.key];
    const inner = sideNavigationPath<D>(item.children, value);
    if (inner.length) return [item.key, ...inner];
  }
  return [];
}

/** The parents that hold the current destination, at both levels; they start open so the current page is in view. */
export function sideNavigationCurrentParents<D extends Destination>(entries: readonly SideNavigationEntry<D>[], value: string | null | undefined): string[] {
  return sideNavigationPath<D>(sideNavigationSections(entries).flatMap(section => section.items), value);
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

/** Whether a parent holds the current destination, at either level under it. */
export const sideParentHoldsCurrent = <D extends Destination>(parent: AnyParent<D>, value: string | null | undefined): boolean =>
  parent.children.some(child => isParentNode(child) ? sideParentHoldsCurrent(child, value) : child.key === value);
/** Whether a run of items holds the current destination, directly or under a parent. */
export const sideItemsHoldCurrent = <D extends Destination>(items: readonly Node<D>[], value: string | null | undefined) =>
  items.some(item => isParentNode(item) ? sideParentHoldsCurrent(item, value) : item.key === value);

/** The tone of the dot that stands for the badges hidden in a run of items: "alert" when any of them is an alert, else
 * "neutral" when any has a badge, else null. Disabled rows and their badges do not count. */
export function sideItemsBadgeTone<D extends Destination>(items: readonly Node<D>[]): SideNavigationBadgeTone | null {
  let tone: SideNavigationBadgeTone | null = null;
  for (const item of items) {
    if (item.disabled) continue;
    const found = isParentNode(item) ? sideItemsBadgeTone(item.children) : navigationBadge(item.badge) ? item.badgeTone ?? "alert" : null;
    if (found === "alert") return found;
    tone ??= found;
  }
  return tone;
}
/** Whether a run of items has a badge to show while it is hidden behind its group. */
export const sideItemsHaveBadge = <D extends Destination>(items: readonly Node<D>[]) => sideItemsBadgeTone(items) !== null;
export const sideParentHasBadge = <D extends Destination>(parent: AnyParent<D>) => sideItemsHaveBadge(parent.children);

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

/** The next list of open parents (or groups, or groups showing all rows) after one is toggled. */
export const toggleSideParent = (open: readonly string[], key: string): string[] => open.includes(key) ? open.filter(item => item !== key) : [...open, key];

/** What a parent row shows: whether its children are on screen, and what it stands for while they are not (a closed
 * parent holding the current page, a dot for a child's badge in that badge's tone). In a flyout the children show beside,
 * not under, it. */
export function sideParentState<D extends Destination>(parent: AnyParent<D>, { open, collapsed, value }: { open: readonly string[]; collapsed: boolean; value: string | null | undefined }) {
  const shown = !collapsed && open.includes(parent.key), tone = shown ? null : sideItemsBadgeTone(parent.children);
  return { shown, within: !shown && sideParentHoldsCurrent(parent, value), dot: tone !== null, tone };
}
/** What a group toggle shows: the selection's trace and a dot for a badge inside while closed, and how many rows it holds. */
export function sideGroupState<D extends Destination>(section: SideNavigationTitledSection<D>, { openGroups, value }: { openGroups: readonly string[]; value: string | null | undefined }) {
  const shown = openGroups.includes(section.key), tone = shown ? null : sideItemsBadgeTone(section.items);
  return { shown, within: !shown && sideItemsHoldCurrent(section.items, value), dot: tone !== null, tone, count: section.items.length };
}
/** A rail-of-groups row: always closed, so it stands for everything in its group. */
export function sideRailGroupState<D extends Destination>(section: SideNavigationTitledSection<D>, value: string | null | undefined) {
  const tone = sideItemsBadgeTone(section.items);
  return { within: sideItemsHoldCurrent(section.items, value), dot: tone !== null, tone };
}

/** The rows a group shows under its limit: the first `limit`, plus any later row that holds the current page, in their
 * places. hidden is how many stay behind the "more" row; 0 when the group has no limit, fits it, or shows all. */
export function sideSectionRows<D extends Destination>(section: SideNavigationSection<D>, { value, showAll }: { value: string | null | undefined; showAll: readonly string[] }) {
  const limit = section.limit, all = section.items;
  const expandable = limit !== undefined && limit >= 0 && all.length > limit && isTitledSection(section);
  if (!expandable) return { items: all, hidden: 0, expandable: false, expanded: false };
  if (showAll.includes(section.key!)) return { items: all, hidden: 0, expandable: true, expanded: true };
  const items = all.filter((item, index) => index < limit || sideItemsHoldCurrent([item], value));
  // Every row past the limit is the current page's: nothing is left to show, so there is no "more" row.
  if (items.length === all.length) return { items: all, hidden: 0, expandable: false, expanded: false };
  return { items, hidden: all.length - items.length, expandable: true, expanded: false };
}

/** The line a titled group shows in place of its rows: its empty text while it has none, else nothing. */
export const sideSectionEmpty = (section: { items: readonly unknown[]; empty?: string }) => section.items.length ? undefined : section.empty || undefined;

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

/** The name a row shows: its short name under an icon in a labelled rail, else its label. */
export const sideNavigationShownLabel = (item: { label: string; shortLabel?: string }, labelled: boolean) => labelled && item.shortLabel ? item.shortLabel : item.label;
/** A group's name under its icon in a labelled rail of groups. */
export const sideNavigationShownTitle = (group: { title: string; shortTitle?: string }, labelled: boolean) => labelled && group.shortTitle ? group.shortTitle : group.title;

type Messages = { newContent: string; newCount: (count: number) => string; newWindow: string };
/** A destination's accessible name: its full label, what its badge says, and that it opens elsewhere. */
export const sideNavigationLinkName = (item: { label: string; badge?: NavigationBadge; target?: string }, m: Messages) =>
  navigationLabel(item.label, item.badge, m.newContent, m.newCount) + (sideNavigationOpensElsewhere(item) ? m.newWindow : "");
/** The same name for Web's aria-label, or undefined when the shown text already is the whole name. */
export function sideNavigationLinkLabel(item: { label: string; shortLabel?: string; badge?: NavigationBadge; target?: string }, m: Messages, labelled: boolean) {
  const name = sideNavigationLinkName(item, m);
  return name === sideNavigationShownLabel(item, labelled) ? undefined : name;
}
/** A parent's or group's accessible name: its label, and "new" while a dot stands for a hidden badge. */
export const sideNavigationToggleName = (label: string, dot: boolean, m: { newContent: string }) => dot ? navigationLabel(label, true, m.newContent) : label;

/** What an arrow key asks of a row in an open menu: "in" opens a closed parent or group, or moves to its first row;
 * "out" closes an open one, or moves from a row to the parent or group title it sits under. Right to left swaps them. */
export function sideNavigationArrow(key: string, rtl: boolean): "in" | "out" | null {
  if (key !== "ArrowRight" && key !== "ArrowLeft") return null;
  return (key === "ArrowRight") !== rtl ? "in" : "out";
}

/** The flyout open beside a collapsed icon, by kind, so a parent and a group with the same key never share one. */
export const sideFlyoutKey = (kind: "parent" | "group", key: string) => kind + ":" + key;

/** A key as part of an element id: anything outside [A-Za-z0-9_-] becomes its code point, so different keys stay apart. */
export const sideNavigationIdPart = (key: string) => key.replace(/[^\w-]/g, char => "_" + char.codePointAt(0)!.toString(36));

/** Heading levels a group title can take. */
export type SideNavigationHeadingLevel = 2 | 3 | 4 | 5 | 6;

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
  const walk = (nodes: readonly Node<D>[]) => { for (const node of nodes) { see(items, node.key, "item"); if (isParentNode(node)) walk(node.children); } };
  for (const section of sideNavigationSections(entries)) {
    if (section.key !== undefined) see(groups, section.key, "group");
    walk(section.items);
  }
  return repeated;
}
/** Parents nested deeper than two levels: the third level is not drawn. */
export function sideNavigationTooDeep<D extends Destination>(entries: readonly SideNavigationEntry<D>[]) {
  const deep: string[] = [];
  for (const item of sideNavigationSections(entries).flatMap(section => section.items))
    if (isParentNode(item)) for (const child of item.children)
      if (isParentNode(child)) for (const grandchild of child.children) if (isParentNode(grandchild as Node<D>)) deep.push(grandchild.key);
  return deep;
}
/** Development checks for a navigation's items and the props that read them. */
export function checkSideNavigation<D extends Destination>(entries: readonly SideNavigationEntry<D>[]) {
  const repeated = sideNavigationDuplicateKeys(entries);
  if (repeated.length) warnSideNavigation("keys must be unique; repeated " + repeated.join(", ") + ". Give groups with the same title a key.");
  const deep = sideNavigationTooDeep(entries);
  if (deep.length) warnSideNavigation("parents go two levels deep at most; not drawn: " + deep.join(", ") + ".");
}
/** A parent or group pressed while collapsed asks to widen; without a handler the press would do nothing visible. */
export const warnNoWiden = () => warnSideNavigation("a parent or group was pressed while collapsed, but nothing handles onCollapsedChange (Vue: v-model:collapsed). Handle it, or use collapsedParent=\"flyout\".");

/** KjunSideNavigationLayout's railBreakpoint: the collapsed value to ask for when the viewport moves across it, else null.
 * previous is null before the first reading, where only a viewport already below it asks (for the rail). Between
 * crossings the person's own toggle stands. */
export function sideNavigationRailRequest(previous: boolean | null, below: boolean, collapsed: boolean): boolean | null {
  if (previous === below || (previous === null && !below)) return null;
  return below === collapsed ? null : below;
}
