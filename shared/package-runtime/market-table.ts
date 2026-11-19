import type { PriceFlash } from "./data-cells";

/** Columns with these keys draw the row's name and symbol (the identity cell). */
export const isMarketIdentity = (key?: string) => ["stock_name", "name", "symbol"].includes(key || "");

/** The cell shape a market table column draws; every platform renders the same kind for the same column. */
export type MarketCellKind = "identity" | "sparkline" | "price" | "percent" | "signed" | "text";
/** Metric types whose value carries a sign colour (net flows), drawn as a signed value with the app's text. */
export const marketSignedTypes = ["investor", "net_amount", "net_volume"];

export interface MarketTableColumnLike {
  key: string;
  type?: string;
  sortable?: boolean;
  /** Price columns: true or "text" colours the digits, "background" fills the price for a moment after it moves. "price" reads as true. */
  flash?: PriceFlash | "price" | "change";
}

export function marketCellKind(column: MarketTableColumnLike): MarketCellKind {
  if (isMarketIdentity(column.key)) return "identity";
  if (column.type === "sparkline" || column.type === "price" || column.type === "percent") return column.type;
  return marketSignedTypes.includes(column.type || "") ? "signed" : "text";
}

/** The PriceCell flash a price column asks for. "change" never had an effect and still has none. */
export function marketColumnFlash(column: MarketTableColumnLike): PriceFlash | undefined {
  const flash = column.flash;
  if (flash === "price") return true;
  return flash === "change" || !flash ? undefined : flash;
}

export type MarketSort = "ascending" | "descending" | "none";
/** aria-sort for a header: undefined for a column that does not sort. */
export function marketSortState(column: MarketTableColumnLike, sortKey: string | null | undefined, sortOrder: "asc" | "desc"): MarketSort | undefined {
  if (!column.sortable) return undefined;
  return sortKey === column.key ? (sortOrder === "asc" ? "ascending" : "descending") : "none";
}
export const marketSortIcon = (state: MarketSort | undefined) =>
  state === "ascending" ? "sort-ascending" : state === "descending" ? "sort-descending" : "arrows-sort";

/** The first price column with a value in this row; the row's quote status sits after it. */
export function marketStatusColumn<Row, Column extends MarketTableColumnLike>(
  columns: Column[], row: Row, cellLoading: (row: Row, column: Column) => boolean, value: (row: Row, key: string) => unknown,
) {
  return columns.find(column => column.type === "price" && !cellLoading(row, column) && value(row, column.key) != null)?.key;
}

/** The row's name for its toggles and its open button. */
export function marketRowLabel<Row>(row: Row, primaryLabel: ((row: Row) => string) | undefined, value: (row: Row, key: string) => unknown) {
  return primaryLabel?.(row) || String(value(row, "name") ?? "");
}

/**
 * The identity column stays in view while the other columns scroll sideways (stickyIdentity), together with the
 * toggle column before it. Only an identity column that leads the data columns is pinned; elsewhere nothing is.
 */
export function marketPinnedIdentity(columns: MarketTableColumnLike[], sticky: boolean) {
  return sticky && columns.length > 1 && isMarketIdentity(columns[0]?.key) ? columns[0].key : undefined;
}

/** Enter and Space open a row that has onRowClick, like KjunTable. */
export const marketRowActivates = (key: string) => key === "Enter" || key === " ";
