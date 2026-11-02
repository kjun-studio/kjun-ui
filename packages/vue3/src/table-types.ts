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
}
export interface TableCardSection { key?: string; label?: string; labelAlign?: "left" | "right"; layout?: "stack" | "grid" | "metrics"; columns: string[] }
export interface TablePagination { page: number; total: number; pageSize?: number }
