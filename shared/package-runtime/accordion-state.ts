// Which Accordion items are open, shared by the React hook and the Vue composable. Items register by id;
// a single-open Accordion keeps only the last opened one.
export type OpenedItems = ReadonlySet<string>;

/** Opens or closes one item; a single-open Accordion closes the others. */
export function toggleOpened(opened: OpenedItems, id: string, multiple: boolean): Set<string> {
  const next = new Set(multiple ? opened : []);
  if (opened.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
/** A defaultOpen item joins the open set, unless a single-open Accordion already has one open. */
export function registerOpened(opened: OpenedItems, id: string, defaultOpen: boolean, multiple: boolean): OpenedItems {
  return defaultOpen && (multiple || !opened.size) ? new Set([...opened, id]) : opened;
}
/** An item that unmounts leaves the open set. */
export function unregisterOpened(opened: OpenedItems, id: string): OpenedItems {
  if (!opened.has(id)) return opened;
  const next = new Set(opened);
  next.delete(id);
  return next;
}
/** Switching to single-open keeps only the most recently opened item. */
export const trimToSingle = (opened: OpenedItems): OpenedItems => opened.size > 1 ? new Set([...opened].slice(-1)) : opened;

/** Up/Down/Home/End move between the headers of an Accordion, as in the WAI-ARIA accordion pattern. */
export function accordionKeyTarget(key: string, index: number, count: number): number | null {
  if (count < 1 || index < 0) return null;
  switch (key) {
    case "ArrowDown": return (index + 1) % count;
    case "ArrowUp": return (index - 1 + count) % count;
    case "Home": return 0;
    case "End": return count - 1;
    default: return null;
  }
}
