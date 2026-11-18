import { nextTableSort, type TableSort, type QueryDisplayProps } from "@kjun-ui/tokens";
export type { TableSort } from "@kjun-ui/tokens";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TableSummaryKind } from "./table-groups";
import type { TableColumnGroup } from "./table-columns";
export type { TableColumnGroup } from "./table-columns";
export type { TableSummaryKind } from "./table-groups";
import { filterTableRows, sortTableRows, tableRowIndex, tableRowKey, tableSelection, toggleAllRows, toggleExpandedRow, toggleSelectedRow, type TableCompare } from "./table-model";
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
  /** Makes the cell a button that runs this, instead of opening the row (row clicks and keys stay with the row elsewhere). */
  onCellPress?: (row: Row, index: number) => void;
  /** The cell button's accessible name when its content alone does not say what it does, e.g. "목표가 82,000원, 근거 보기". */
  cellLabel?: (row: Row, index: number) => string;
  /** Web: extra attributes for the grid cell element (data-*, aria-*, title). Native ignores it. */
  cellProps?: (row: Row, index: number) => Record<string, unknown> | undefined;
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
  /** Labels over runs of columns, by column key: the header gets a second row. Narrow cards use them as sections when cardSections is empty. */
  columnGroups?: TableColumnGroup[];
  /** How many columns a row's cell covers, counting itself (2 merges it with the next column). The covered cells are not drawn. */
  cellSpan?: (row: Row, column: TableColumn<Row>) => number | null | undefined;
  /** Rows listed in `order` get up and down buttons. The app keeps the order, passes `data` in it and saves it. */
  reorderable?: boolean;
  /** The rows' rowKey values in the order shown; a row whose key is not listed cannot move. */
  order?: (string | number)[];
  /** Called with the next order when a row moves; the app applies it. */
  onOrderChange?: (order: (string | number)[]) => void;
  /** The same move in detail: the row's key, where it was and where it went. */
  onReorder?: (move: { value: string | number; from: number; to: number; order: (string | number)[] }) => void;
  /** Turns the move buttons off. They are also off while the table is sorted by a column or grouped. */
  reorderDisabled?: boolean;
  /** Why moving is off, shown under the table and read with the buttons; a sorted or grouped table says so by default. */
  reorderDisabledText?: string;
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
  /** "client" filters data by the search box itself (searchKeys, or every column); "server" (default) only reports the query through onSearch. */
  searchMode?: "client" | "server";
  /** Row fields (dot paths) a client search looks in. Default: every column's key. */
  searchKeys?: string[];
  stickyHeader?: boolean;
  /** Without maxHeight a sticky header sticks under the page scroll; this is its distance from the viewport top (px). */
  stickyOffset?: number;
  maxHeight?: MaxHeight;
  pagination?: TablePagination | null;
  compact?: boolean;
  striped?: boolean;
  /** "none" drops the first column's start padding and the last column's end padding in the grid, so the table lines up with text around it. For tables without row fills. */
  edgeInset?: "default" | "none";
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
  /** The selected rows. Leave unset for internal selection; onSelectionChange still reports each change. */
  selected?: Row[];
  /** Rows that can be selected: the others keep a disabled checkbox and are skipped by select all. Row clicks and expansion stay. */
  rowSelectable?: (row: Row) => boolean;
  /** Row field (dot path) whose values split the rows into collapsible groups. */
  groupBy?: string;
  /** Original groupBy values of open groups. undefined: internal state, initially all open; []: all closed. */
  expandedGroups?: unknown[];
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
  onExpandedGroupsChange?: (values: unknown[]) => void;
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
    [internalSelected, setInternalSelected] = useState<Row[]>([]),
    [search, setSearch] = useState(""),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const sort = props.sort === undefined ? internalSort : props.sort ?? { key: "", order: "asc" as const };
  const compare = props.columns.find(column => column.key === sort.key)?.compare;
  // Sorting runs when the data or the sort changes, not on every keystroke in the search box.
  const sorted = useMemo(() => sortTableRows(data, sort, { sortable, sortMode, compare, locale }) as Row[], [data, sort.key, sort.order, sortable, sortMode, compare, locale]);
  // A client search narrows the sorted rows as the query changes; a server search leaves them to the app.
  const client = props.searchMode === "client", searchKeys = props.searchKeys, columns = props.columns;
  const rows = useMemo(() => client ? filterTableRows(sorted, search, searchKeys ?? columns.map(column => column.key), locale) as Row[] : sorted,
    [client, sorted, search, searchKeys, columns, locale]);
  const rowIndex = useMemo(() => tableRowIndex(rows), [rows]);
  const key = (row: Row, index = 0) => tableRowKey(row, rowKey, index);
  // Without a selected prop the table keeps the selection itself, as it does the sort and the expanded rows.
  const selected = props.selected ?? internalSelected;
  const select = (next: Row[]) => {
    if (props.selected === undefined) setInternalSelected(next);
    onSelectionChange?.(next);
  };
  const { isSelected: selectedRow, isSelectable: selectableRow, all, some, selectableCount } = tableSelection(rows, selected, rowKey, props.rowSelectable),
    expanded = expandedRows ?? internalExpanded;
  return {
    rows,
    rowIndex,
    key,
    sort,
    search,
    selected,
    all,
    some,
    selectableCount,
    selectedRow,
    selectableRow,
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
    toggleRow: (row: Row) => { if (selectableRow(row)) select(toggleSelectedRow(selected, row, rowKey)); },
    toggleAll: () => select(toggleAllRows(rows, selected, rowKey, all, props.rowSelectable)),
    clearSelection: () => select([]),
    toggleExpand: (row: Row, index: number) => {
      const next = toggleExpandedRow(expanded, key(row, index), expandSingle);
      setExpanded(next);
      onExpandedRowsChange?.(next);
    },
  };
}
