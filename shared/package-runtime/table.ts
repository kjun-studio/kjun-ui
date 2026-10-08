import { nextTableSort, type TableSort, type QueryDisplayProps } from "@kjun/tokens";
export type { TableSort } from "@kjun/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
  const rows =
    sortable && sortMode !== "server" && sort.key
      ? [...data].sort((a, b) => {
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
        })
      : data;
  const key = (row: Row, index = 0) =>
    (getValue(row, rowKey) ?? index) as string | number;
  const selectedRow = (row: Row) =>
    selected.some((r) => getValue(r, rowKey) === getValue(row, rowKey));
  const all = rows.length > 0 && rows.every(selectedRow),
    some = rows.some(selectedRow) && !all,
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
    toggleRow: (row: Row) =>
      onSelectionChange?.(
        selectedRow(row)
          ? selected.filter(
              (r) => getValue(r, rowKey) !== getValue(row, rowKey)
            )
          : [...selected, row]
      ),
    toggleAll: () => onSelectionChange?.(all ? [] : [...rows]),
    toggleExpand: (row: Row, index: number) => {
      const id = key(row, index),
        next = expanded.includes(id)
          ? expanded.filter((v) => v !== id)
          : [...(expandSingle ? [] : expanded), id];
      setExpanded(next);
      onExpandedRowsChange?.(next);
    },
  };
}
