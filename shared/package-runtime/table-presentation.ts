import type { ReactNode } from "react";
import { getValue } from "./table-model";
import type { TableColumn, TableCardSection, TableProps, TableSort, useTableModel } from "./table";
import { formatSummary, summarizeColumn, type TableRowGroup } from "./table-groups";

export function tablePresentation<Row extends object>(props: TableProps<Row, unknown>, mobile: boolean) {
  const { columns, responsive = null, mobileColumns = [], cardTitle, cardSubtitle, cardSections = [], cardLayout = "stacked", cardHighlight } = props;
  const card = mobile && (responsive === "card" || (!responsive && columns.length >= 4));
  // The two-line list: title over one meta line, the first right-aligned value and badges at the end.
  const list = mobile && responsive === "list";
  const visible = mobile && responsive === "compact" && mobileColumns.length
    ? columns.filter(column => mobileColumns.includes(column.key)) : columns;
  const titleKey = cardTitle || columns[0]?.key;
  const title = columns.find(column => column.key === titleKey);
  // A card part is an ordinary column: never the title, a badge, the actions or a column hidden in cards, and never both parts.
  const cardPart = (key?: string | null) => columns.find(column => column.key === key && column.key !== titleKey && column.key !== "actions" && !column.badge && !column.hideInCard);
  const listSubtitle = columns.find(column => column.key === cardSubtitle && column.key !== titleKey);
  const subtitle = cardPart(cardSubtitle);
  const highlight = cardHighlight !== cardSubtitle ? cardPart(cardHighlight) : undefined;
  const badges = columns.filter(column => column.badge);
  const actions = columns.find(column => column.key === "actions");
  const tiles = cardLayout === "tiles";
  if (card && tiles) warnTiles(props);
  const inline = columns.filter(column => column.inlineInCard);
  // The subtitle reads under the title and the highlight under that, so neither repeats among the fields.
  const bodyColumns = columns.filter(column => column.key !== titleKey && column !== subtitle && column !== highlight
    && column.key !== "actions" && !column.badge && !column.hideInCard && !column.inlineInCard);
  const used = new Set(cardSections.flatMap(section => section.columns));
  const sections: TableCardSection[] = cardSections.length
    ? [...cardSections, { key: "remaining", columns: bodyColumns.filter(column => !used.has(column.key)).map(column => column.key) }]
    : [{ columns: bodyColumns.map(column => column.key) }];
  const listValue = columns.find(column => column.key !== titleKey && !column.badge && column.key !== "actions" && (column.align === "right" || column.type === "number"));
  const listMeta = listSubtitle ?? columns.find(column => column.key !== titleKey && !column.badge && column.key !== "actions" && column !== listValue && !column.hideInCard);
  return {
    card, list, listValue, listMeta, visible, title, subtitle, badges, actions, inline, sections, highlight,
    // Tiles show the title, subtitle, badges and highlight only; they neither expand nor carry row actions.
    cardLayout, tiles,
    /** The actions column in the card's footer row (an inline one sits in the header instead). */
    footerActions: !tiles && actions && !actions.inlineInCard ? actions : undefined,
    /** One footer row holds the expand toggle and the row actions. */
    cardFooter: !tiles && (!!props.expandable || !!(actions && !actions.inlineInCard)),
    /** A section's field arrangement: rows cards put every field on a label-value line. */
    cardBody(section: TableCardSection) { return cardLayout === "rows" ? "rows" : section.layout || "grid"; },
    columnsForSection(row: Row, section: TableCardSection) {
      return bodyColumns.filter(column => section.columns.includes(column.key)
        && !(column.hideEmptyInCard && [null, undefined, ""].includes(getValue(row, column.key) as null | undefined | string)));
    },
  };
}

const warnedTiles = new Set<string>();
// Tiles drop the expand toggle and row actions; say so once instead of losing them silently.
function warnTiles<Row extends object>(props: TableProps<Row, unknown>) {
  const dropped = [props.expandable && "expandable", props.columns.some(column => column.key === "actions") && "actions",
    props.columns.some(column => column.inlineInCard) && "inlineInCard"].filter(Boolean).join(", ");
  if (!dropped || warnedTiles.has(dropped)) return;
  warnedTiles.add(dropped);
  console.warn(`KJUN Table: cardLayout="tiles"는 ${dropped}을(를) 그리지 않습니다. 상세는 onRowClick으로 여세요.`);
}

/** Narrow layouts have no header row to sort by, so the toolbar offers each sortable column in both orders. */
export function tableSortOptions<Row extends object>(props: TableProps<Row, unknown>, messages: { defaultOrder: string; ascending: string; descending: string }) {
  const columns = props.sortable === false ? [] : props.columns.filter(column => column.sortable);
  return columns.length ? [{ value: "", label: messages.defaultOrder },
    ...columns.flatMap(column => (["asc", "desc"] as const).map(order => ({ value: column.key + ":" + order, label: `${column.label} · ${order === "asc" ? messages.ascending : messages.descending}` })))] : [];
}
export const tableSortValue = (sort: TableSort) => sort.key ? sort.key + ":" + sort.order : "";
export function tableSortFromValue(value: unknown): TableSort {
  const text = typeof value === "string" ? value : "", at = text.lastIndexOf(":");
  return at > 0 ? { key: text.slice(0, at), order: text.slice(at + 1) === "desc" ? "desc" : "asc" } : { key: "", order: "asc" };
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

/** locale is the KjunProvider locale, so numbers group the way the app's language does. */
export function tableCellValue<Row extends object>(props: TableProps<Row, unknown>, column: TableColumn<Row>, row: Row, index: number, locale?: string) {
  const value = getValue(row, column.key);
  const body = props.renderCell ? props.renderCell(value, column, row, index)
    : column.render ? column.render(value, row, index)
    : columnFormat(column) ? columnFormat(column)!(value, row)
    : props.formatValue ? props.formatValue(value, column, row)
    : value == null ? "-"
    : typeof value === "number" && column.type === "number" ? new Intl.NumberFormat(locale).format(value) : String(value);
  return { value, body };
}

/** A summary cell: the app's function, or the kind computed and shown through the column's format. */
export function tableSummaryValue<Row extends object>(props: TableProps<Row, unknown>, column: TableColumn<Row>, rows: Row[], locale?: string): ReactNode {
  const spec = props.summary?.[column.key];
  if (!spec) return null;
  if (typeof spec === "function") return spec(rows, column);
  const value = summarizeColumn(rows, column.key, spec), format = columnFormat(column);
  if (props.summaryFormat) return props.summaryFormat(value, column, spec);
  return value != null && format && spec !== "count" && rows[0] ? format(value, rows[0]) : formatSummary(value, spec, locale);
}

/** Narrow layouts keep the summary as one closing block: each summarized column's label and total. */
export interface TableTotal { key: string; label: string; value: ReactNode }
export function tableTotals<Row extends object>(props: TableProps<Row, unknown>, rows: Row[], locale?: string): TableTotal[] {
  return props.summary ? props.columns.filter((column) => props.summary?.[column.key]).map((column) => ({ key: column.key, label: column.label, value: tableSummaryValue(props, column, rows, locale) })) : [];
}

/** A group's accessible name: its label when that is text, else the grouped value. */
export function tableGroupName<Row extends object>(label: unknown, group: TableRowGroup<Row>) {
  return typeof label === "string" || typeof label === "number" ? String(label) : group.value == null || group.value === "" ? "-" : String(group.value);
}

export interface TableGroupingProps<Row extends object> {
  groups: TableRowGroup<Row>[] | null;
  collapsed: string[];
  toggleGroup: (key: string) => void;
  groupLabel: (group: TableRowGroup<Row>) => ReactNode;
  summary: ((column: TableColumn<Row>, rows: Row[]) => ReactNode) | null;
}

/** Card parts: a card value starts at its label (cardValue) or ends a label-value line (cardRowValue); tiles use smaller titles and highlights. */
export type TableCellRole = "title" | "listTitle" | "listMeta" | "listValue" | "cardValue" | "cardRowValue" | "cardSubtitle" | "cardHighlight" | "tileTitle" | "tileHighlight";

export interface TableRowsProps<Row extends object> {
  initialLoading: boolean;
  skeletonRows: number;
  /** A loadingDelay is still running: the skeleton keeps its space but stays out of sight. */
  skeletonHidden?: boolean;
  state: Pick<ReturnType<typeof useTableModel<Row>>, "rows" | "rowIndex" | "key" | "expanded" | "selectedRow">;
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
  totals?: TableTotal[];
  /** groupBy groups: each one opens with a header line (label, count and, with two or more rows, its subtotals) above its cards. */
  groups?: TableRowGroup<Row>[] | null;
  groupLabel?: (group: TableRowGroup<Row>) => ReactNode;
  groupTotals?: (rows: Row[]) => TableTotal[];
  /** The cell's plain text, for a value read out with its label where the label is not drawn (tile highlight on Native). */
  cellText?: (column: TableColumn<Row>, row: Row, index: number) => string | undefined;
}
export interface TableGridProps<Row extends object, Height> extends TableRowsProps<Row>, TableGroupingProps<Row> {
  state: TableRowsProps<Row>["state"] & Pick<ReturnType<typeof useTableModel<Row>>, "all" | "some" | "toggleAll" | "sort" | "sortColumn">;
  visible: TableColumn<Row>[];
  maxHeight?: Height;
  stickyHeader: boolean;
  stickyOffset?: number;
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
  /** Narrow layouts only: the sort choices (tableSortOptions), the chosen one and the change. */
  sortOptions?: { value: string; label: string }[];
  sortValue?: string;
  sortChange?: (value: string) => void;
}
