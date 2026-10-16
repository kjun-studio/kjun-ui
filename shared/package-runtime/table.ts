import { nextTableSort, type TableSort, type QueryDisplayProps } from "@kjun-ui/tokens";
export type { TableSort } from "@kjun-ui/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { sortTableRows, tableRowKey, tableSelection, toggleAllRows, toggleExpandedRow, toggleSelectedRow } from "./table-model";
export { getValue } from "./table-model";

export interface TableColumn<Row extends object = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
  type?: "number" | "date" | "datetime" | "text";
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
  maxHeight?: MaxHeight;
  pagination?: TablePagination | null;
  compact?: boolean;
  striped?: boolean;
  ariaLabel?: string;
  responsive?: "card" | "compact" | "none" | null;
  mobileColumns?: string[];
  cardTitle?: string | null;
  cardSubtitle?: string | null;
  cardSections?: TableCardSection[];
  expandable?: boolean;
  expandedRows?: (string | number)[];
  expandSingle?: boolean;
  rowClass?: string | ((row: Row, index: number) => string);
  selectable?: boolean;
  selected?: Row[];
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
export function useTableModel<Row extends object>(props: TableProps<Row, unknown>) {
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
  const rows = sortTableRows(data, sort, { sortable, sortMode }) as Row[];
  const key = (row: Row, index = 0) => tableRowKey(row, rowKey, index);
  const { isSelected: selectedRow, all, some } = tableSelection(rows, selected, rowKey),
    expanded = expandedRows ?? internalExpanded;
  return {
    rows,
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
    toggleRow: (row: Row) => onSelectionChange?.(toggleSelectedRow(selected, row, rowKey)),
    toggleAll: () => onSelectionChange?.(toggleAllRows(rows, all)),
    toggleExpand: (row: Row, index: number) => {
      const next = toggleExpandedRow(expanded, key(row, index), expandSingle);
      setExpanded(next);
      onExpandedRowsChange?.(next);
    },
  };
}
