import { getValue } from "./table-model";

// Framework-free grouping and summary rules shared by the React, Vue and Native tables.
export type TableSummaryKind = "sum" | "count" | "average" | "min" | "max";
export interface TableRowGroup<Row extends object> {
  key: string;
  value: unknown;
  rows: Row[];
}

// The same identity rule is used for grouping and externally supplied group values.
export const tableGroupKey = (value: unknown): string => value == null ? "null:" : typeof value + ":" + String(value);

/** Groups keep the order their first row appears in, so a sorted table sorts inside each group. */
export function groupTableRows<Row extends object>(rows: readonly Row[], groupBy?: string | null): TableRowGroup<Row>[] | null {
  if (!groupBy) return null;
  const groups = new Map<string, TableRowGroup<Row>>();
  for (const row of rows) {
    // The key carries the value's type, so 1 and "1", or a missing value and "", stay separate groups.
    const value = getValue(row, groupBy), key = tableGroupKey(value);
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { key, value, rows: [] }));
    group.rows.push(row);
  }
  return [...groups.values()];
}

/** undefined uses internal collapsed keys; a supplied array contains the original groupBy values. */
export function tableGroupExpansion<Row extends object>(groups: TableRowGroup<Row>[] | null, expanded: unknown[] | undefined, internalCollapsed: string[]) {
  const keys = expanded === undefined ? null : new Set(expanded.map(tableGroupKey));
  const collapsed = keys ? (groups ?? []).filter(group => !keys.has(group.key)).map(group => group.key) : internalCollapsed;
  return {
    collapsed,
    toggle(key: string) {
      const group = groups?.find(group => group.key === key);
      if (!group) return null;
      const values = expanded ?? groups!.filter(group => !collapsed.includes(group.key)).map(group => group.value);
      const next = values.filter(value => tableGroupKey(value) !== key);
      const opening = collapsed.includes(key);
      return {
        expanded: opening ? [...next, group.value] : next,
        collapsed: opening ? collapsed.filter(value => value !== key) : [...collapsed, key],
      };
    },
  };
}

/** count counts rows; the other kinds read finite numbers only and give null when a column has none. */
export function summarizeColumn<Row extends object>(rows: readonly Row[], key: string, kind: TableSummaryKind): number | null {
  if (kind === "count") return rows.length;
  const values = rows.map((row) => getValue(row, key)).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return null;
  if (kind === "min") return Math.min(...values);
  if (kind === "max") return Math.max(...values);
  const sum = values.reduce((total, value) => total + value, 0);
  return kind === "average" ? sum / values.length : sum;
}

export function formatSummary(value: number | null, kind: TableSummaryKind, locale?: string): string {
  return value == null ? "" : new Intl.NumberFormat(locale, kind === "average" ? { maximumFractionDigits: 2 } : undefined).format(value);
}
