import type { VNodeChild } from "vue";

type Row = Record<string, unknown>;
export interface TableColumn<R extends object = Row> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number | string;
  align?: "left" | "center" | "right";
  type?: "number" | "date" | "datetime" | "text";
  /** The column's own sort order for two cell values (ascending); by default dates, numbers and text compare naturally. */
  compare?: (a: unknown, b: unknown) => number;
  format?: (value: unknown, row: R) => VNodeChild;
  render?: (value: unknown, row: R, index: number) => VNodeChild;
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
export interface TableCardSection { key?: string; label?: string; labelAlign?: "left" | "right"; layout?: "stack" | "grid" | "metrics"; columns: string[] }
export interface TablePagination { page: number; total: number; pageSize?: number }
