import { getValue } from "./table-model";

// Framework-free grouping and summary rules shared by the React, Vue and Native tables.
export type TableSummaryKind = "sum" | "count" | "average" | "min" | "max";
export interface TableRowGroup<Row extends object> {
  key: string;
  value: unknown;
  rows: Row[];
}

/** Groups keep the order their first row appears in, so a sorted table sorts inside each group. */
export function groupTableRows<Row extends object>(rows: readonly Row[], groupBy?: string | null): TableRowGroup<Row>[] | null {
  if (!groupBy) return null;
  const groups = new Map<string, TableRowGroup<Row>>();
  for (const row of rows) {
    const value = getValue(row, groupBy), key = String(value ?? "");
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { key, value, rows: [] }));
    group.rows.push(row);
  }
  return [...groups.values()];
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

export function formatSummary(value: number | null, kind: TableSummaryKind): string {
  return value == null ? "" : new Intl.NumberFormat(undefined, kind === "average" ? { maximumFractionDigits: 2 } : undefined).format(value);
}
