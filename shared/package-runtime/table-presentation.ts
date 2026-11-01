import type { ReactNode } from "react";
import { getValue } from "./table-model";
import type { TableColumn, TableCardSection, TableProps, useTableModel } from "./table";
import { formatSummary, summarizeColumn, type TableRowGroup } from "./table-groups";

export function tablePresentation<Row extends object>(props: TableProps<Row, unknown>, mobile: boolean) {
  const { columns, responsive = null, mobileColumns = [], cardTitle, cardSubtitle, cardSections = [] } = props;
  const card = mobile && (responsive === "card" || (!responsive && columns.length >= 4));
  // The two-line list: title over one meta line, the first right-aligned value and badges at the end.
  const list = mobile && responsive === "list";
  const visible = mobile && responsive === "compact" && mobileColumns.length
    ? columns.filter(column => mobileColumns.includes(column.key)) : columns;
  const titleKey = cardTitle || columns[0]?.key;
  const title = columns.find(column => column.key === titleKey);
  const subtitle = columns.find(column => column.key === cardSubtitle);
  const badges = columns.filter(column => column.badge);
  const actions = columns.find(column => column.key === "actions");
  const inline = columns.filter(column => column.inlineInCard);
  const bodyColumns = columns.filter(column => column.key !== titleKey
    && !(column.key === cardSubtitle && !badges.length) && column.key !== "actions"
    && !column.badge && !column.hideInCard && !column.inlineInCard);
  const used = new Set(cardSections.flatMap(section => section.columns));
  const sections: TableCardSection[] = cardSections.length
    ? [...cardSections, { key: "remaining", columns: bodyColumns.filter(column => !used.has(column.key)).map(column => column.key) }]
    : [{ columns: bodyColumns.map(column => column.key) }];
  const listValue = columns.find(column => column.key !== titleKey && !column.badge && column.key !== "actions" && (column.align === "right" || column.type === "number"));
  const listMeta = subtitle ?? columns.find(column => column.key !== titleKey && !column.badge && column.key !== "actions" && column !== listValue && !column.hideInCard);
  return {
    card, list, listValue, listMeta, visible, title, subtitle, badges, actions, inline, sections,
    columnsForSection(row: Row, section: TableCardSection) {
      return bodyColumns.filter(column => section.columns.includes(column.key)
        && !(column.hideEmptyInCard && [null, undefined, ""].includes(getValue(row, column.key) as null | undefined | string)));
    },
  };
}

const warnedFormats = new Set<string>();
// format must be a function; a string preset from another component would otherwise throw and blank the table.
export function columnFormat<Format>(column: { key: string; format?: Format }): Format | undefined {
  if (typeof column.format === "function") return column.format;
  if (column.format != null && !warnedFormats.has(column.key)) {
    warnedFormats.add(column.key);
    console.warn(`KJUN Table: ${column.key} 열의 format은 함수여야 합니다.`);
  }
  return undefined;
}

export function tableCellValue<Row extends object>(props: TableProps<Row, unknown>, column: TableColumn<Row>, row: Row, index: number) {
  const value = getValue(row, column.key);
  const body = props.renderCell ? props.renderCell(value, column, row, index)
    : column.render ? column.render(value, row, index)
    : columnFormat(column) ? columnFormat(column)!(value, row)
    : props.formatValue ? props.formatValue(value, column, row)
    : value == null ? "-"
    : typeof value === "number" && column.type === "number" ? new Intl.NumberFormat().format(value) : String(value);
  return { value, body };
}

/** A summary cell: the app's function, or the kind computed and shown through the column's format. */
export function tableSummaryValue<Row extends object>(props: TableProps<Row, unknown>, column: TableColumn<Row>, rows: Row[]): ReactNode {
  const spec = props.summary?.[column.key];
  if (!spec) return null;
  if (typeof spec === "function") return spec(rows, column);
  const value = summarizeColumn(rows, column.key, spec), format = columnFormat(column);
  return value != null && format && spec !== "count" && rows[0] ? format(value, rows[0]) : formatSummary(value, spec);
}

export interface TableGroupingProps<Row extends object> {
  groups: TableRowGroup<Row>[] | null;
  collapsed: string[];
  toggleGroup: (key: string) => void;
  groupLabel: (group: TableRowGroup<Row>) => ReactNode;
  summary: ((column: TableColumn<Row>, rows: Row[]) => ReactNode) | null;
}

export type TableCellRole = "title" | "listTitle" | "listMeta" | "listValue";

export interface TableRowsProps<Row extends object> {
  initialLoading: boolean;
  skeletonRows: number;
  /** A loadingDelay is still running: the skeleton keeps its space but stays out of sight. */
  skeletonHidden?: boolean;
  state: Pick<ReturnType<typeof useTableModel<Row>>, "rows" | "key" | "expanded" | "selectedRow">;
  onRowClick: TableProps<Row>["onRowClick"];
  selectable: boolean;
  expandable: boolean;
  checkbox: (row: Row, index: number) => ReactNode;
  expand: (row: Row, index: number) => ReactNode;
  // A text role where text styles do not inherit (Native): the card title, or the list's title, meta line and value.
  cell: (column: TableColumn<Row>, row: Row, index: number, role?: TableCellRole) => ReactNode;
  renderExpand: TableProps<Row>["renderExpand"];
  emptyContent: ReactNode;
  emptyText: string;
}
export interface TableCardsProps<Row extends object> extends TableRowsProps<Row> {
  layout: ReturnType<typeof tablePresentation<Row>>;
}
export interface TableGridProps<Row extends object, Height> extends TableRowsProps<Row>, TableGroupingProps<Row> {
  state: TableRowsProps<Row>["state"] & Pick<ReturnType<typeof useTableModel<Row>>, "all" | "some" | "toggleAll" | "sort" | "sortColumn">;
  visible: TableColumn<Row>[];
  maxHeight?: Height;
  stickyHeader: boolean;
  sortable?: boolean;
  compact: boolean;
  striped: boolean;
  hoverable: boolean;
}
export interface TableToolbarProps<Row extends object> {
  selectable: boolean;
  selected: Row[];
  /** Every visible row is selected: the bar drops its select-all action. */
  allSelected: boolean;
  toggleAll: () => void;
  clearSelection: () => void;
  renderSelectionToolbar: TableProps<Row>["renderSelectionToolbar"];
  searchable: boolean;
  search: string;
  searchChange: (value: string) => void;
  searchPlaceholder: string;
  toolbar: ReactNode;
}
