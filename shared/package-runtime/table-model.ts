import type { TableSort } from "@kjun-ui/tokens";

// Framework-free table rules shared by the React hook and the Vue composable.
export function getValue(row: object, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (value, part) =>
        value != null && typeof value === "object"
          ? (value as Record<string, unknown>)[part]
          : undefined,
      row
    );
}

const collators = new Map<string, Intl.Collator>();
const collator = (locale?: string) => {
  const key = locale ?? "";
  let found = collators.get(key);
  if (!found) collators.set(key, found = new Intl.Collator(locale, { numeric: true, sensitivity: "base" }));
  return found;
};
const empty = (value: unknown) => value == null || value === "" || (typeof value === "number" && Number.isNaN(value));
const time = (value: unknown) => value instanceof Date ? value.getTime() : NaN;

/**
 * One ascending order for every column: dates by time, numbers numerically, text by the locale with numbers inside it
 * ("item2" before "item10"), booleans false first. Empty values are left for the caller to put last.
 */
export function compareTableValues(x: unknown, y: unknown, locale?: string): number {
  if (x instanceof Date || y instanceof Date) {
    const a = time(x), b = time(y);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return a - b;
  }
  if (typeof x === "number" && typeof y === "number") return x - y;
  if (typeof x === "boolean" && typeof y === "boolean") return Number(x) - Number(y);
  // A number and its text form ("10" and 9) compare as numbers when both read as one.
  if ((typeof x === "number" || typeof y === "number") && Number.isFinite(Number(x)) && Number.isFinite(Number(y))) return Number(x) - Number(y);
  return collator(locale).compare(String(x), String(y));
}

/** A column's own order for its cell values, replacing the shared one. */
export type TableCompare = (a: unknown, b: unknown) => number;

export function sortTableRows<Row extends object>(
  data: readonly Row[],
  sort: TableSort,
  { sortable = true, sortMode = "client", compare, locale }: { sortable?: boolean; sortMode?: "client" | "server"; compare?: TableCompare; locale?: string }
): readonly Row[] {
  if (!sortable || sortMode === "server" || !sort.key) return data;
  const direction = sort.order === "asc" ? 1 : -1;
  // Array#sort is stable, so equal values keep the data's order in both directions.
  return [...data].sort((a, b) => {
    const x = getValue(a, sort.key), y = getValue(b, sort.key);
    // Empty values sit at the end whichever way the column sorts.
    if (empty(x) || empty(y)) return empty(x) === empty(y) ? 0 : empty(x) ? 1 : -1;
    return direction * (compare ? compare(x, y) : compareTableValues(x, y, locale));
  });
}

export const tableRowKey = (row: object, rowKey: string, index = 0) =>
  (getValue(row, rowKey) ?? index) as string | number;

/** What tells rows apart for selection: the rowKey value, or the row object itself when it has none. */
export const tableRowIdentity = (row: object, rowKey: string): unknown => getValue(row, rowKey) ?? row;

const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
let warnedKey = false;
function warnMissingKey(rows: readonly object[], rowKey: string) {
  if (warnedKey || !developmentMode() || !rows.length || getValue(rows[0], rowKey) != null) return;
  warnedKey = true;
  console.warn(`KJUN Table: rows have no "${rowKey}"; selection and expansion fall back to the row objects. Pass rowKey.`);
}

export function tableSelection<Row extends object>(rows: readonly Row[], selected: readonly Row[], rowKey: string) {
  warnMissingKey(rows, rowKey);
  // One set per render instead of scanning the selection for every row.
  const chosen = new Set(selected.map(row => tableRowIdentity(row, rowKey)));
  const isSelected = (row: Row) => chosen.has(tableRowIdentity(row, rowKey));
  let count = 0;
  for (const row of rows) if (isSelected(row)) count++;
  const all = rows.length > 0 && count === rows.length;
  return { isSelected, all, some: count > 0 && !all };
}

export const toggleSelectedRow = <Row extends object>(selected: readonly Row[], row: Row, rowKey: string): Row[] => {
  const id = tableRowIdentity(row, rowKey);
  return selected.some((r) => tableRowIdentity(r, rowKey) === id)
    ? selected.filter((r) => tableRowIdentity(r, rowKey) !== id)
    : [...selected, row];
};

/**
 * The header checkbox: with every shown row selected it clears just those rows, otherwise it adds the shown rows
 * that are missing. Rows selected on other pages or outside the current search stay selected.
 */
export function toggleAllRows<Row extends object>(rows: readonly Row[], selected: readonly Row[], rowKey: string, all: boolean): Row[] {
  const shown = new Set(rows.map(row => tableRowIdentity(row, rowKey)));
  if (all) return selected.filter(row => !shown.has(tableRowIdentity(row, rowKey)));
  const chosen = new Set(selected.map(row => tableRowIdentity(row, rowKey)));
  return [...selected, ...rows.filter(row => !chosen.has(tableRowIdentity(row, rowKey)))];
}

/** Each row's position in the sorted rows, so grouped bodies need not search for it. */
export const tableRowIndex = <Row extends object>(rows: readonly Row[]) => {
  const positions = new Map<Row, number>();
  rows.forEach((row, index) => positions.set(row, index));
  return (row: Row) => positions.get(row) ?? -1;
};

export const toggleExpandedRow = (expanded: readonly (string | number)[], id: string | number, single: boolean) =>
  expanded.includes(id) ? expanded.filter((v) => v !== id) : [...(single ? [] : expanded), id];

/** A row's name for its checkbox: the title column's text ("행 선택 한빛테크"), or its position when that is not text. */
export function tableRowLabel(row: object, titleKey: string | undefined, index: number): string | number {
  const value = titleKey ? getValue(row, titleKey) : undefined;
  return typeof value === "string" && value.trim() ? value : typeof value === "number" ? value : index + 1;
}

/** The scroller a page-level sticky header sticks under: the nearest scrolling ancestor, or the viewport (null). */
export function stickyScroller(element: Element | null): Element | null {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}
/** Whether rows have scrolled under a page-level sticky header, measured against its own scroller. */
export function stickyHeaderStuck(table: Element | null, offset: number) {
  if (!table) return false;
  const rect = table.getBoundingClientRect(), scroller = stickyScroller(table);
  const top = (scroller ? scroller.getBoundingClientRect().top : 0) + offset;
  return rect.top < top && rect.bottom > top;
}
