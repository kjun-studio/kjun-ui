import type { KjunMessages } from "../../../shared/package-runtime/messages";
import { Fragment, type PropType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import type { TableCardSection, TableColumn } from "./table-types";
import { KjunButton, KjunIcon } from "./button";
import type { TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { KjunSkeleton } from "./display";
import { provideFallbackIcons } from "./runtime/icons";
import { css } from "./runtime/style";
import { tableHeaderRows, tableSpans, type TableColumnGroup } from "../../../shared/package-runtime/table-columns";

type Row = object;
/** A native checkbox (role, indeterminate, row click isolation) drawn like KjunCheckbox sm. */
export const TableCheck = defineComponent({
  name: "KjunTableCheck",
  inheritAttrs: false,
  props: { checked: { type: Boolean, default: false }, indeterminate: { type: Boolean, default: false } },
  emits: { change: () => true },
  setup(props, { attrs, emit }) {
    provideFallbackIcons(componentIcons);
    return () => {
      const size = tokens.extensions.checkbox.iconSizes.sm;
      return (
        <span class="kjun-table-check">
          <input {...attrs} type="checkbox" checked={props.checked} indeterminate={props.indeterminate} onChange={() => emit("change")} />
          <KjunIcon name="check" size={size} class="kjun-table-check-mark" />
          <KjunIcon name="minus" size={size} class="kjun-table-check-dash" />
        </span>
      );
    };
  },
});

export interface TableTotal { key: string; label: string; value: VNodeChild }
/** Like React: the summary on narrow layouts as one closing block. */
export const tableTotals = (totals: TableTotal[], title: string) => totals.length ? (
  <div class="kjun-table-totals" role="group" aria-label={title}>
    <span class="kjun-table-totals-title">{title}</span>
    {totals.map(total => <div key={total.key} class="kjun-table-totals-row"><span>{total.label}</span><span class="kjun-table-totals-value">{total.value}</span></div>)}
  </div>
) : null;

export interface TableLayout {
  card: boolean;
  list: boolean;
  listValue?: TableColumn<any>;
  listMeta?: TableColumn<any>;
  visible: TableColumn<any>[];
  title?: TableColumn<any>;
  subtitle?: TableColumn<any>;
  highlight?: TableColumn<any>;
  cardLayout: "stacked" | "rows" | "tiles";
  tiles: boolean;
  badges: TableColumn<any>[];
  actions?: TableColumn<any>;
  inline: TableColumn<any>[];
  sections: TableCardSection[];
  footerActions?: TableColumn<any>;
  cardFooter: boolean;
  cardBody: (section: TableCardSection) => string;
  columnsForSection: (row: object, section: TableCardSection) => TableColumn<any>[];
}
export interface TableRenderState {
  rows: Row[];
  /** Each row's position in rows, without searching for it. */
  rowIndex: (row: Row) => number;
  key: (row: Row, index?: number) => string | number;
  expanded: (string | number)[];
  selectedRow: (row: Row) => boolean;
  all: boolean;
  some: boolean;
  toggleAll: () => void;
  sort: { key: string; order: "asc" | "desc" };
  sortColumn: (column: TableColumn<any>) => void;
}
export interface TableRowsContext {
  messages: KjunMessages;
  initialLoading: boolean;
  skeletonRows: number;
  /** A loadingDelay is still running: the skeleton keeps its space but stays out of sight. */
  skeletonHidden?: boolean;
  state: TableRenderState;
  clickable: boolean;
  rowClick: (row: Row, index: number) => void;
  selectable: boolean;
  expandable: boolean;
  checkbox: (row: Row, index: number) => VNodeChild;
  expand: (row: Row, index: number) => VNodeChild;
  cell: (column: TableColumn<any>, row: Row, index: number, role?: "title" | "listTitle") => VNodeChild;
  renderExpand: (row: Row, index: number) => VNodeChild;
  empty: () => VNodeChild;
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent, row: Row, index: number) => void;
  /** Like React: a reorderable table's move buttons for a row. */
  mover?: (row: Row, index: number) => VNodeChild;
}

export function tableGrid(c: TableRowsContext & { visible: TableColumn<any>[]; columnGroups?: TableColumnGroup[]; cellSpan?: (row: any, column: TableColumn<any>) => number | null | undefined; maxHeight?: number | string; stickyHeader: boolean;
  sortable?: boolean; compact: boolean; striped: boolean; hoverable: boolean; stuck: { value: boolean }; stickyOffset: number;
  groups: TableRowGroup<Row>[] | null; collapsed: string[]; toggleGroup: (key: string) => void;
  groupLabel: (group: TableRowGroup<Row>) => VNodeChild; summary: ((column: TableColumn<any>, rows: Row[]) => VNodeChild) | null }) {
  const { state, visible, selectable, expandable } = c, m = c.messages;
  // Like React: a reorderable table ends each row with its move buttons, after the expand toggle.
  const mover = c.mover, span = visible.length + Number(selectable) + Number(expandable) + Number(!!mover);
  // Like React: with column groups the header has two rows, groups and lone columns on top.
  const headerRows = tableHeaderRows(visible, c.columnGroups), lone = headerRows ? 2 : undefined;
  const bodyRow = (row: Row, i: number) => {
    const spans = tableSpans(visible, c.cellSpan ? column => c.cellSpan!(row, column) : null);
    return (
    <Fragment key={state.key(row, i)}>
      <tr class={"kjun-table-row-action " + c.customClass(row, i)} tabindex={c.clickable ? 0 : undefined}
        onKeydown={(event: KeyboardEvent) => c.rowKeyDown(event, row, i)} data-selected={state.selectedRow(row) || undefined}
        // Stripes follow the data rows only, so expanded rows and group headers do not flip them.
        data-stripe={i % 2 === 1 || undefined}
        onClick={() => c.rowClick(row, i)}>
        {selectable && <td class="kjun-table-action-cell">{c.checkbox(row, i)}</td>}
        {visible.map((col, index) => {
          if (!spans[index]) return null;
          // Like React: the app's class and style join KJUN's rather than replacing them.
          const { key: _key, class: appClass, style: appStyle, ...attributes } = (col.cellProps?.(row as never, i) ?? {}) as Record<string, any>;
          return (
          <td {...attributes} key={col.key} colspan={spans[index] > 1 ? spans[index] : undefined} style={[appStyle, { textAlign: col.align }]} data-numeric={col.type === "number" || col.align === "right" || undefined} data-date={col.type === "date" || col.type === "datetime" || undefined}
            class={[(col.secondary ? "kjun-table-secondary " : "") + (col.className || ""), appClass]}>
            {c.cell(col, row, i)}
          </td>
          );
        })}
        {expandable && <td class="kjun-table-action-cell">{c.expand(row, i)}</td>}
        {mover && <td class="kjun-table-action-cell kjun-table-reorder-cell" onClick={(event: MouseEvent) => event.stopPropagation()}>{mover(row, i)}</td>}
      </tr>
      {expandable && state.expanded.includes(state.key(row, i)) && (
        <tr class="kjun-table-expanded"><td colspan={span - 1}>{c.renderExpand(row, i)}</td></tr>
      )}
    </Fragment>
    );
  };
  // Like React: the first cell always names a summary row; a first column with a value of its own shows both.
  const summaryRow = (rows: Row[], kind: "subtotal" | "total", key: string) => c.summary && (
    <tr key={key} class="kjun-table-summary" data-kind={kind}>
      {selectable && <td class="kjun-table-action-cell" />}
      {visible.map((col, index) => {
        const value = c.summary!(col, rows), shown = value !== null && value !== undefined && value !== "" && value !== false;
        return <td key={col.key} style={{ textAlign: col.align }} data-numeric={col.type === "number" || col.align === "right" || undefined} data-date={col.type === "date" || col.type === "datetime" || undefined}>
          {index === 0 ? <><span class="kjun-table-summary-label">{kind === "total" ? m.tableTotal : m.tableSubtotal}</span>{shown && <> {value}</>}</> : shown ? value : null}
        </td>;
      })}
      {expandable && <td class="kjun-table-action-cell" />}
      {mover && <td class="kjun-table-action-cell" />}
    </tr>
  );
  // Like React: each group is its own row group with a rowgroup header, its rows and (two or more rows) a subtotal.
  const groupBodies = () => c.groups!.map(group => {
    const open = !c.collapsed.includes(group.key);
    return (
      <tbody key={"group:" + group.key}>
        <tr class="kjun-table-group">
          <th scope="rowgroup" colspan={span}>
            <span class="kjun-table-group-label">
              <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} aria-expanded={open}
                ariaLabel={m.toggleGroup(String(group.value ?? ""), open)} onClick={() => c.toggleGroup(group.key)} />
              <span class="kjun-table-group-name">{c.groupLabel(group)}</span>
              <span class="kjun-table-group-count">{m.groupCount(group.rows.length)}</span>
            </span>
          </th>
        </tr>
        {open && group.rows.map(row => bodyRow(row, state.rowIndex(row)))}
        {group.rows.length > 1 && summaryRow(group.rows, "subtotal", "subtotal")}
      </tbody>
    );
  });
  const pageSticky = c.stickyHeader && c.maxHeight == null;
  const sorting = (col: TableColumn<any>) => col.sortable && c.sortable !== false;
  const columnHeader = (col: TableColumn<any>, rowspan?: number) => (
    <th key={col.key} scope="col" rowspan={rowspan} style={css({ width: col.width, textAlign: col.align })} class={col.headerClass}
      aria-sort={sorting(col) ? state.sort.key === col.key ? state.sort.order === "asc" ? "ascending" : "descending" : "none" : undefined}>
      {sorting(col) ? (
        <button type="button" onClick={() => state.sortColumn(col)}>
          {col.label}
          <KjunIcon name={state.sort.key !== col.key ? "arrows-sort" : state.sort.order === "asc" ? "sort-ascending" : "sort-descending"} size={state.sort.key === col.key ? tokens.table.sortedIconSize : tokens.table.sortIconSize} class="kjun-table-sort-icon" />
        </button>
      ) : col.label}
    </th>
  );
  return (
    <div class="kjun-table-scroll" style={css({ maxHeight: c.maxHeight, visibility: c.skeletonHidden ? "hidden" : undefined })} aria-hidden={c.skeletonHidden ? "true" : undefined}
      data-stuck={c.stickyHeader && c.stuck.value ? "" : undefined} data-page-sticky={pageSticky ? "" : undefined}
      onScroll={c.stickyHeader && !pageSticky ? (event: Event) => { c.stuck.value = (event.currentTarget as HTMLElement).scrollTop > 0; } : undefined}>
      <table class="kjun-table" aria-label={c.ariaLabel} data-compact={String(c.compact)} data-hoverable={String(c.hoverable)} data-striped={String(c.striped)}>
        <thead style={c.stickyHeader ? { position: "sticky", top: (pageSticky ? c.stickyOffset : 0) + "px", zIndex: 2 } : undefined}>
          <tr>
            {selectable && (
              <th scope="col" class="kjun-table-action-cell" rowspan={lone}>
                <TableCheck aria-label={c.messages.selectAll} checked={state.all} indeterminate={state.some} onChange={state.toggleAll} />
              </th>
            )}
            {headerRows ? headerRows.map(cell => cell.kind === "column" ? columnHeader(cell.column, lone)
              : <th key={cell.key} scope="colgroup" colspan={cell.span} class="kjun-table-column-group">{cell.label}</th>)
              : visible.map(col => columnHeader(col))}
            {/* Expansion sits at the row's end, so the checkbox is the only leading utility column. */}
            {expandable && <th scope="col" class="kjun-table-action-cell" rowspan={lone} />}
            {mover && <th scope="col" class="kjun-table-action-cell kjun-table-reorder-cell" rowspan={lone} />}
          </tr>
          {headerRows && <tr>{headerRows.flatMap(cell => cell.kind === "group" ? cell.columns.map(col => columnHeader(col)) : [])}</tr>}
        </thead>
        {c.groups && !c.initialLoading && state.rows.length ? groupBodies() : <tbody>
          {c.initialLoading ? Array.from({ length: c.skeletonRows }, (_, i) => (
            <tr key={i} aria-hidden="true">
              {selectable && <td class="kjun-table-action-cell"><KjunSkeleton type="block" height={tokens.table.selectionSize} width={tokens.table.selectionSize} /></td>}
              {visible.map(col => (
                <td key={col.key}><KjunSkeleton type="line" width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"} /></td>
              ))}
              {expandable && <td class="kjun-table-action-cell" />}
              {mover && <td class="kjun-table-action-cell" />}
            </tr>
          )) : !state.rows.length ? (
            <tr><td colspan={span} class="kjun-table-empty">{c.empty()}</td></tr>
          ) : state.rows.map(bodyRow)}
        </tbody>}
        {c.summary && !c.initialLoading && state.rows.length > 0 && <tfoot>{summaryRow(state.rows, "total", "total")}</tfoot>}
      </table>
    </div>
  );
}
