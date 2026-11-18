import { useEffect, useMemo, useRef, useState } from "react";
import { sideNavigationInitialGroups, sideNavigationSections, sideNavigationWithCurrentGroups, sideNavigationWithCurrentParents, sideSectionToggles,
  type SideNavigationAnyDestination, type SideNavigationEntry } from "./side-navigation";

type Lists = { expanded?: string[]; onExpandedChange?: (expanded: string[]) => void; expandedGroups?: string[]; onExpandedGroupsChange?: (expandedGroups: string[]) => void;
  showAll?: string[]; onShowAllChange?: (showAll: string[]) => void; collapsibleGroups: boolean };

/** KjunSideNavigation's lists for React and Native (Vue 3 keeps its own form): the open parents, the open groups and the
 * groups showing every row, each kept here unless the app holds it, and reported on change. Moving to a page under a
 * closed parent opens it, also when the items arrive after the value; parents the person opened stay as they are. The
 * first render already starts open, so only later changes are applied and reported. Groups do the same while any can be
 * closed. */
export function useSideNavigationState<D extends SideNavigationAnyDestination>(items: readonly SideNavigationEntry<D>[], value: string | null, lists: Lists) {
  const { expanded, onExpandedChange, expandedGroups, onExpandedGroupsChange, showAll, onShowAllChange, collapsibleGroups } = lists;
  const sections = useMemo(() => sideNavigationSections(items), [items]);
  const [own, setOwn] = useState(() => [...sideNavigationWithCurrentParents([], items, value)]);
  const open = expanded ?? own;
  const update = (next: string[]) => { if (expanded === undefined) setOwn(next); onExpandedChange?.(next); };
  const [ownGroups, setOwnGroups] = useState(() => sideNavigationInitialGroups(items, value));
  const openGroups = expandedGroups ?? ownGroups;
  const updateGroups = (next: string[]) => { if (expandedGroups === undefined) setOwnGroups(next); onExpandedGroupsChange?.(next); };
  const [ownShowAll, setOwnShowAll] = useState<string[]>([]);
  const allShown = showAll ?? ownShowAll;
  const updateShowAll = (next: string[]) => { if (showAll === undefined) setOwnShowAll(next); onShowAllChange?.(next); };
  const toggles = sections.some(section => sideSectionToggles(section, collapsibleGroups));
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
  return { sections, open, update, openGroups, updateGroups, allShown, updateShowAll };
}
