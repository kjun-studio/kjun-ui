// Framework-free Table structure rules shared by React, Vue and Native: column groups over the header, and cells
// that span the columns after them. Both act on the columns as shown, after hiding; neither reorders a column.

export interface TableColumnGroup {
  /** The label over the group's columns. */
  label: string;
  /** Keys of the columns it spans; they are drawn where `columns` puts them. */
  columns: string[];
}
export type TableHeaderCell<Column> =
  | { kind: "group"; key: string; label: string; span: number; columns: Column[] }
  | { kind: "column"; column: Column };

/**
 * The header's top row when groups apply: a group over each run of its shown columns, and the other columns standing
 * alone across both rows. null when no group holds a shown column, so the header stays one row.
 */
export function tableHeaderRows<Column extends { key: string }>(visible: readonly Column[], groups?: readonly TableColumnGroup[] | null): TableHeaderCell<Column>[] | null {
  if (!groups?.length) return null;
  // A column listed by two groups belongs to the first.
  const owner = new Map<string, number>();
  groups.forEach((group, index) => group.columns.forEach(key => { if (!owner.has(key)) owner.set(key, index); }));
  if (!visible.some(column => owner.has(column.key))) return null;
  const cells: TableHeaderCell<Column>[] = [];
  visible.forEach(column => {
    const index = owner.get(column.key), last = cells[cells.length - 1];
    if (index === undefined) return void cells.push({ kind: "column", column });
    if (last?.kind === "group" && owner.get(last.columns[0].key) === index) {
      last.columns.push(column);
      last.span++;
    } else cells.push({ kind: "group", key: "group:" + index + ":" + column.key, label: groups[index].label, span: 1, columns: [column] });
  });
  return cells;
}

/**
 * Each shown column's span in one row: a number above zero draws the cell over that many columns (never past the
 * row's end), 0 marks a column a previous cell covers. A span that is not a whole number above one counts as 1.
 */
export function tableSpans<Column>(columns: readonly Column[], span?: ((column: Column) => number | null | undefined) | null): number[] {
  const spans = columns.map(() => 1);
  if (!span) return spans;
  for (let i = 0; i < columns.length; i++) {
    const wanted = span(columns[i]);
    if (!Number.isInteger(wanted) || (wanted as number) < 2) continue;
    const size = Math.min(wanted as number, columns.length - i);
    spans[i] = size;
    for (let j = 1; j < size; j++) spans[i + j] = 0;
    i += size - 1;
  }
  return spans;
}

/** A column width given as a share of the table ("30%"), as a fraction; null for any other width. */
export function tablePercentWidth(width: number | string | null | undefined): number | null {
  if (typeof width !== "string") return null;
  const match = /^\s*(\d+(?:\.\d+)?)%\s*$/.exec(width);
  return match ? Number(match[1]) / 100 : null;
}

/**
 * A column's width in px where the platform lays columns out itself (Native): a number or "120px" as given, a
 * percent as that share of the table's own width, like a 100%-wide table on Web, and the fallback for anything else.
 * Until the table has been measured (`viewport` 0) a percent column takes the fallback too.
 */
export function tableColumnWidth(width: number | string | null | undefined, viewport: number, fallback: number): number {
  if (typeof width === "number") return width;
  if (typeof width === "string" && /^\d+(px)?$/.test(width)) return parseFloat(width);
  const share = tablePercentWidth(width);
  return share != null && viewport > 0 ? share * viewport : fallback;
}
