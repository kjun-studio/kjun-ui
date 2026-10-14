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

export function sortTableRows<Row extends object>(
  data: readonly Row[],
  sort: TableSort,
  { sortable = true, sortMode = "client" }: { sortable?: boolean; sortMode?: "client" | "server" }
): readonly Row[] {
  if (!sortable || sortMode === "server" || !sort.key) return data;
  return [...data].sort((a, b) => {
    const x = getValue(a, sort.key),
      y = getValue(b, sort.key);
    const order =
      x === y
        ? 0
        : typeof x === "number" && typeof y === "number"
        ? x > y
          ? 1
          : -1
        : String(x) > String(y)
        ? 1
        : -1;
    return sort.order === "asc" ? order : -order;
  });
}

export const tableRowKey = (row: object, rowKey: string, index = 0) =>
  (getValue(row, rowKey) ?? index) as string | number;

export function tableSelection<Row extends object>(rows: readonly Row[], selected: readonly Row[], rowKey: string) {
  const isSelected = (row: Row) => selected.some((r) => getValue(r, rowKey) === getValue(row, rowKey));
  const all = rows.length > 0 && rows.every(isSelected);
  return { isSelected, all, some: rows.some(isSelected) && !all };
}

export const toggleSelectedRow = <Row extends object>(selected: readonly Row[], row: Row, rowKey: string): Row[] =>
  selected.some((r) => getValue(r, rowKey) === getValue(row, rowKey))
    ? selected.filter((r) => getValue(r, rowKey) !== getValue(row, rowKey))
    : [...selected, row];

export const toggleAllRows = <Row extends object>(rows: readonly Row[], all: boolean): Row[] => (all ? [] : [...rows]);

export const toggleExpandedRow = (expanded: readonly (string | number)[], id: string | number, single: boolean) =>
  expanded.includes(id) ? expanded.filter((v) => v !== id) : [...(single ? [] : expanded), id];
