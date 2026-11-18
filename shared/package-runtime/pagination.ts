// Shared by React, Vue 3 and Native KjunPagination: the page buttons to draw, and the range line's numbers.
export type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);

/**
 * The first and last page, the current page with siblingCount pages each side, and an ellipsis for each gap.
 * Once the pages outnumber the slots the list keeps one length on every page, so the arrows never move, and a gap
 * of one page shows that page instead of an ellipsis (no "1 … 3").
 */
export function paginationItems(current: number, total: number, siblingCount = 1): PaginationItem[] {
  const pages = Math.max(0, Math.floor(total)), siblings = Math.max(0, Math.floor(siblingCount));
  if (pages <= siblings * 2 + 5) return range(1, pages);
  const page = Math.max(1, Math.min(pages, current));
  const start = Math.max(Math.min(page - siblings, pages - siblings * 2 - 2), 3);
  const end = Math.min(Math.max(page + siblings, siblings * 2 + 3), pages - 2);
  return [
    1,
    start > 3 ? "start-ellipsis" : 2,
    ...range(start, end),
    end < pages - 2 ? "end-ellipsis" : pages - 1,
    pages,
  ];
}

/** The first and last row on the page, for the "81 - 100 / 195" line. */
export function pageRows(current: number, pageSize: number, totalRows: number) {
  return { from: (current - 1) * pageSize + 1, to: Math.min(current * pageSize, totalRows) };
}
