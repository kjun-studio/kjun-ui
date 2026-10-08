import type { ReactNode } from "react";
import { getValue, type TableColumn, type TableCardSection, type TableProps, type useTableModel } from "./table";

export function tablePresentation<Row extends object>(props: TableProps<Row, unknown>, mobile: boolean) {
  const { columns, responsive = null, mobileColumns = [], cardTitle, cardSubtitle, cardSections = [] } = props;
  const card = mobile && (responsive === "card" || (!responsive && columns.length >= 4));
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
  return {
    card, visible, title, subtitle, badges, actions, inline, sections,
    columnsForSection(row: Row, section: TableCardSection) {
      return bodyColumns.filter(column => section.columns.includes(column.key)
        && !(column.hideEmptyInCard && [null, undefined, ""].includes(getValue(row, column.key) as null | undefined | string)));
    },
  };
}

export function tableCellValue<Row extends object>(props: TableProps<Row, unknown>, column: TableColumn<Row>, row: Row, index: number) {
  const value = getValue(row, column.key);
  const body = props.renderCell ? props.renderCell(value, column, row, index)
    : column.render ? column.render(value, row, index)
    : column.format ? column.format(value, row)
    : props.formatValue ? props.formatValue(value, column, row)
    : value == null ? "-"
    : typeof value === "number" && column.type === "number" ? new Intl.NumberFormat().format(value) : String(value);
  return { value, body };
}

export interface TableRowsProps<Row extends object> {
  initialLoading: boolean;
  skeletonRows: number;
  state: Pick<ReturnType<typeof useTableModel<Row>>, "rows" | "key" | "expanded" | "selectedRow">;
  onRowClick: TableProps<Row>["onRowClick"];
  selectable: boolean;
  expandable: boolean;
  checkbox: (row: Row, index: number) => ReactNode;
  expand: (row: Row, index: number) => ReactNode;
  // "title" asks for the card title type role where text styles do not inherit (Native).
  cell: (column: TableColumn<Row>, row: Row, index: number, role?: "title") => ReactNode;
  renderExpand: TableProps<Row>["renderExpand"];
  emptyContent: ReactNode;
  emptyText: string;
}
export interface TableCardsProps<Row extends object> extends TableRowsProps<Row> {
  layout: ReturnType<typeof tablePresentation<Row>>;
}
export interface TableGridProps<Row extends object, Height> extends TableRowsProps<Row> {
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
  toggleAll: () => void;
  clearSelection: () => void;
  renderSelectionToolbar: TableProps<Row>["renderSelectionToolbar"];
  searchable: boolean;
  search: string;
  searchChange: (value: string) => void;
  searchPlaceholder: string;
  toolbar: ReactNode;
}
