import { tokens } from "@kjun-ui/tokens";

export interface LayoutColumn {
  key?: string;
  label?: string;
  width?: number | string;
  align?: "left" | "right" | "center";
}
export const marketGeometry = tokens.extensions.marketTable;
export const isMarketIdentity = (key?: string) => ["stock_name", "name", "symbol"].includes(key || "");
export const normalizeMarketColumns = (columns: (LayoutColumn | string)[]) =>
  columns.map(column => typeof column === "string" ? { key: column, label: column } : column);
const defaultWidth = (column: LayoutColumn) => isMarketIdentity(column.key)
  ? marketGeometry.identityWidth : marketGeometry.columnWidth;
const growIndex = (columns: LayoutColumn[], explicit: boolean[]) => {
  const identity = columns.findIndex((column, index) => isMarketIdentity(column.key) && !explicit[index]);
  return identity < 0 ? explicit.indexOf(false) : identity;
};

/** Preserve CSS widths and Vue's historical class-based width overrides. */
export const isCssMarketWidth = (width: unknown): width is string => typeof width === "string" &&
  /^(?:-?\d*\.?\d+(?:px|rem|em|%|vw|vh|ch|ex|cm|mm|in|pt|pc)?$|(?:calc|min|max|clamp|var)\(|auto$|fit-content$|max-content$|min-content$)/.test(width.trim());
export const legacyMarketWidthClass = (column: LayoutColumn) =>
  typeof column.width === "string" && !isCssMarketWidth(column.width) ? column.width : "";

export function webMarketLayout(columns: LayoutColumn[], showActions: boolean, widthClass?: (column: LayoutColumn) => string) {
  const classes = columns.map(column => widthClass?.(column) || legacyMarketWidthClass(column));
  const explicit = columns.map((column, index) => column.width != null || !!classes[index]);
  const grow = growIndex(columns, explicit);
  const widths = columns.map((column, index) => classes[index] ? undefined :
    typeof column.width === "number" ? `${column.width}px` : column.width || `${defaultWidth(column)}px`);
  // Class overrides are resolved by the browser on the same colgroup in both states.
  const parts = widths.map((width, index) => width || `${defaultWidth(columns[index])}px`).filter(width => !/^(auto|fit-content|max-content|min-content)$/.test(width));
  if (showActions) parts.push(`${marketGeometry.actionsWidth}px`);
  const minimum = parts.length ? `calc(${parts.join(" + ")})` : "0px";
  return {
    tableStyle: { width: grow >= 0 || classes.some(Boolean) ? `max(100%, ${minimum})` : minimum },
    columns: columns.map((_, index) => ({ className: classes[index], style: { width: index === grow ? undefined : widths[index] } })),
  };
}

export function nativeMarketLayout(columns: LayoutColumn[], showActions: boolean, containerWidth: number) {
  // Native keeps its existing numeric-width contract; CSS strings remain web overrides.
  const explicit = columns.map(column => typeof column.width === "number");
  const grow = growIndex(columns, explicit);
  const widths = columns.map(column => typeof column.width === "number" ? column.width : defaultWidth(column));
  const minimum = widths.reduce((sum, width) => sum + width, showActions ? marketGeometry.actionsWidth : 0);
  if (grow >= 0) widths[grow] += Math.max(0, containerWidth - minimum);
  return { widths, width: widths.reduce((sum, width) => sum + width, showActions ? marketGeometry.actionsWidth : 0) };
}
