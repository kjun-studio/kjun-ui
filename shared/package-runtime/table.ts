import { nextTableSort, type TableSort, type QueryDisplayProps } from "@kjun-ui/tokens";
export type { TableSort } from "@kjun-ui/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TableSummaryKind } from "./table-groups";
export type { TableSummaryKind } from "./table-groups";
import { sortTableRows, tableRowIndex, tableRowKey, tableSelection, toggleAllRows, toggleExpandedRow, toggleSelectedRow, type TableCompare } from "./table-model";
import { useMemo } from "react";
export { getValue } from "./table-model";

export interface TableColumn<Row extends object = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
  type?: "number" | "date" | "datetime" | "text";
  /** The column's own sort order for two cell values (ascending); by default dates, numbers and text compare naturally. */
  compare?: TableCompare;
  format?: (value: unknown, row: Row) => ReactNode;
  render?: (value: unknown, row: Row, index: number) => ReactNode;
  pill?: boolean;
  badge?: boolean;
  inlineInCard?: boolean;
  hideInCard?: boolean;
  hideEmptyInCard?: boolean;
  fullWidthInCard?: boolean;
  secondary?: boolean;
  className?: string;
  headerClass?: string;
}
export interface TableCardSection {
  key?: string;
  label?: string;
  labelAlign?: "left" | "right";
  layout?: "stack" | "grid" | "metrics";
  columns: string[];
}
export interface TablePagination {
  page: number;
  total: number;
  pageSize?: number;
}
export interface TableProps<Row extends object = Record<string, unknown>, MaxHeight = number>
  extends QueryDisplayProps {
  columns: TableColumn<Row>[];
  data?: Row[];
  rowKey?: string;
  skeletonRows?: number;
  /** false shows the shared spinner and loadingText instead of skeleton rows. Default true. */
  skeleton?: boolean;
  loadingText?: string;
  /** Milliseconds a first load must last before its loading display shows. */
  loadingDelay?: number;
  emptyText?: string;
  sortable?: boolean;
  sort?: TableSort | null;
  sortMode?: "client" | "server";
  hoverable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  stickyHeader?: boolean;
  /** Without maxHeight a sticky header sticks under the page scroll; this is its distance from the viewport top (px). */
  stickyOffset?: number;
  maxHeight?: MaxHeight;
  pagination?: TablePagination | null;
  compact?: boolean;
  striped?: boolean;
  ariaLabel?: string;
  responsive?: "card" | "list" | "compact" | "none" | null;
  mobileColumns?: string[];
  cardTitle?: string | null;
  cardSubtitle?: string | null;
  cardSections?: TableCardSection[];
  /** Card shape on narrow screens: "stacked" (default) field grid, "rows" label-value lines, or "tiles" two small cards a row. */
  cardLayout?: "stacked" | "rows" | "tiles";
  /** Column shown large under the card's title (a total, a balance); tiles show it as their main value. */
  cardHighlight?: string | null;
  expandable?: boolean;
  expandedRows?: (string | number)[];
  expandSingle?: boolean;
  rowClass?: string | ((row: Row, index: number) => string);
  selectable?: boolean;
  selected?: Row[];
  /** Row field (dot path) whose values split the rows into collapsible groups. */
  groupBy?: string;
  renderGroupLabel?: (value: unknown, rows: Row[]) => ReactNode;
  /** Per column key: a subtotal under each group and a total row at the end. */
  summary?: Partial<Record<string, TableSummaryKind | ((rows: Row[], column: TableColumn<Row>) => ReactNode)>>;
  /** Shows computed summaries, for columns whose cells are drawn by renderCell rather than a column format. */
  summaryFormat?: (value: number | null, column: TableColumn<Row>, kind: TableSummaryKind) => ReactNode;
  toolbar?: ReactNode;
  emptyContent?: ReactNode;
  renderCell?: (
    value: unknown,
    column: TableColumn<Row>,
    row: Row,
    index: number
  ) => ReactNode;
  formatValue?: (
    value: unknown,
    column: TableColumn<Row>,
    row: Row
  ) => ReactNode;
  renderExpand?: (row: Row, index: number) => ReactNode;
  renderSelectionToolbar?: (selected: Row[]) => ReactNode;
  onSortChange?: (value: { key: string; order: "asc" | "desc" }) => void;
  onSelectionChange?: (selected: Row[]) => void;
  onExpandedRowsChange?: (keys: (string | number)[]) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: Row, index: number) => void;
  onSearch?: (query: string) => void;
  onRetry?: () => void;
}
/** locale is the KjunProvider locale for text order; the platform wrapper passes it. */
export function useTableModel<Row extends object>(props: TableProps<Row, unknown>, locale?: string) {
  const {
    data = [],
    rowKey = "id",
    sortable = true,
    sortMode = "client",
    selected = [],
    onSelectionChange,
    expandedRows,
    expandSingle = false,
    onExpandedRowsChange,
  } = props;
  const [internalSort, setSort] = useState<TableSort>({
      key: "",
      order: "asc",
    }),
    [internalExpanded, setExpanded] = useState<(string | number)[]>([]),
    [search, setSearch] = useState(""),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const sort = props.sort === undefined ? internalSort : props.sort ?? { key: "", order: "asc" as const };
  const compare = props.columns.find(column => column.key === sort.key)?.compare;
  // Sorting runs when the data or the sort changes, not on every keystroke in the search box.
  const rows = useMemo(() => sortTableRows(data, sort, { sortable, sortMode, compare, locale }) as Row[], [data, sort.key, sort.order, sortable, sortMode, compare, locale]);
  const rowIndex = useMemo(() => tableRowIndex(rows), [rows]);
  const key = (row: Row, index = 0) => tableRowKey(row, rowKey, index);
  const { isSelected: selectedRow, all, some } = tableSelection(rows, selected, rowKey),
    expanded = expandedRows ?? internalExpanded;
  return {
    rows,
    rowIndex,
    key,
    sort,
    search,
    all,
    some,
    selectedRow,
    expanded,
    searchChange: (q: string) => {
      setSearch(q);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => props.onSearch?.(q), 300);
    },
    sortColumn: (col: TableColumn<Row>) => {
      if (!sortable || !col.sortable) return;
      const next = nextTableSort(sort, col.key);
      if (props.sort === undefined) setSort(next);
      props.onSortChange?.(next);
    },
    /** The narrow-screen sort choice: an exact key and order, or { key: "" } for the data's own order. */
    sortTo: (next: TableSort) => {
      if (!sortable) return;
      if (props.sort === undefined) setSort(next);
      props.onSortChange?.(next);
    },
    toggleRow: (row: Row) => onSelectionChange?.(toggleSelectedRow(selected, row, rowKey)),
    toggleAll: () => onSelectionChange?.(toggleAllRows(rows, selected, rowKey, all)),
    toggleExpand: (row: Row, index: number) => {
      const next = toggleExpandedRow(expanded, key(row, index), expandSingle);
      setExpanded(next);
      onExpandedRowsChange?.(next);
    },
  };
}
