// Breadcrumb trail rules shared by every platform: which step is the current page, and how a long trail collapses.
export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
  /** Marks this step as the current page; by default that is a last step without `to`. */
  current?: boolean;
}
export const breadcrumbCurrent = (item: BreadcrumbItem, index: number, count: number) =>
  item.current ?? (index === count - 1 && !item.to);
/** With maxItems, a long trail keeps its first step and the last maxItems - 1, and the steps between fold into a menu. */
export function collapseBreadcrumb<T>(items: readonly T[], maxItems?: number): { shown: { item: T; index: number }[]; hidden: { item: T; index: number }[]; at: number } {
  const all = items.map((item, index) => ({ item, index }));
  if (!maxItems || maxItems < 2 || items.length <= maxItems) return { shown: all, hidden: [], at: -1 };
  const tail = maxItems - 1;
  return { shown: [all[0], ...all.slice(-tail)], hidden: all.slice(1, -tail), at: 1 };
}
