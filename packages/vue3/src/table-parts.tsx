import type { KjunMessages } from "../../../shared/package-runtime/messages";
import { Fragment, defineComponent, type PropType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import type { TableCardSection, TableColumn } from "./table-types";
import { KjunButton, KjunIcon } from "./button";
import type { TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { KjunSkeleton } from "./display";
import { provideFallbackIcons } from "./runtime/icons";
import { css } from "./runtime/style";

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

export interface TableLayout {
  card: boolean;
  list: boolean;
  listValue?: TableColumn<any>;
  listMeta?: TableColumn<any>;
  visible: TableColumn<any>[];
  title?: TableColumn<any>;
  subtitle?: TableColumn<any>;
  badges: TableColumn<any>[];
  actions?: TableColumn<any>;
  inline: TableColumn<any>[];
  sections: TableCardSection[];
  columnsForSection: (row: object, section: TableCardSection) => TableColumn<any>[];
}
export interface TableRenderState {
  rows: Row[];
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
  cell: (column: TableColumn<any>, row: Row, index: number) => VNodeChild;
  renderExpand: (row: Row, index: number) => VNodeChild;
  empty: () => VNodeChild;
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent, row: Row, index: number) => void;
}

export function tableGrid(c: TableRowsContext & { visible: TableColumn<any>[]; maxHeight?: number | string; stickyHeader: boolean;
  sortable?: boolean; compact: boolean; striped: boolean; hoverable: boolean; stuck: { value: boolean };
  groups: TableRowGroup<Row>[] | null; collapsed: string[]; toggleGroup: (key: string) => void;
  groupLabel: (group: TableRowGroup<Row>) => VNodeChild; summary: ((column: TableColumn<any>, rows: Row[]) => VNodeChild) | null }) {
  const { state, visible, selectable, expandable } = c, m = c.messages;
  const span = visible.length + Number(selectable) + Number(expandable);
  const bodyRow = (row: Row, i: number) => (
    <Fragment key={state.key(row, i)}>
      <tr class={"kjun-table-row-action " + c.customClass(row, i)} tabindex={c.clickable ? 0 : undefined}
        onKeydown={(event: KeyboardEvent) => c.rowKeyDown(event, row, i)} data-selected={state.selectedRow(row) || undefined}
        onClick={() => c.rowClick(row, i)}>
        {selectable && <td class="kjun-table-action-cell">{c.checkbox(row, i)}</td>}
        {visible.map(col => (
          <td key={col.key} style={{ textAlign: col.align }} data-numeric={col.type === "number" || col.align === "right" || undefined}
            class={(col.secondary ? "kjun-table-secondary " : "") + (col.className || "")}>
            {c.cell(col, row, i)}
          </td>
        ))}
        {expandable && <td class="kjun-table-action-cell">{c.expand(row, i)}</td>}
      </tr>
      {expandable && state.expanded.includes(state.key(row, i)) && (
        <tr class="kjun-table-expanded"><td colspan={visible.length + Number(selectable) + 1}>{c.renderExpand(row, i)}</td></tr>
      )}
    </Fragment>
  );
  // Like React: the first column names a summary row unless it carries a value of its own.
  const summaryRow = (rows: Row[], kind: "subtotal" | "total", key: string) => c.summary && (
    <tr key={key} class="kjun-table-summary" data-kind={kind}>
      {selectable && <td class="kjun-table-action-cell" />}
      {visible.map((col, index) => {
        const value = c.summary!(col, rows);
        return <td key={col.key} style={{ textAlign: col.align }} data-numeric={col.type === "number" || col.align === "right" || undefined}>
          {value ?? (index === 0 ? (kind === "total" ? m.tableTotal : m.tableSubtotal) : null)}
        </td>;
      })}
      {expandable && <td class="kjun-table-action-cell" />}
    </tr>
  );
  const body = () => [
    ...(c.groups ? c.groups.flatMap(group => {
      const open = !c.collapsed.includes(group.key);
      return [
        <tr key={"group:" + group.key} class="kjun-table-group">
          <td colspan={span}>
            <span class="kjun-table-group-label">
              <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} aria-expanded={open}
                ariaLabel={m.toggleGroup(String(group.value ?? ""), open)} onClick={() => c.toggleGroup(group.key)} />
              <span class="kjun-table-group-name">{c.groupLabel(group)}</span>
              <span class="kjun-table-group-count">{m.groupCount(group.rows.length)}</span>
            </span>
          </td>
        </tr>,
        ...(open ? group.rows.map(row => bodyRow(row, state.rows.indexOf(row))) : []),
        group.rows.length > 1 ? summaryRow(group.rows, "subtotal", "subtotal:" + group.key) : null,
      ];
    }) : state.rows.map(bodyRow)),
    summaryRow(state.rows, "total", "total"),
  ];
  const sorting = (col: TableColumn<any>) => col.sortable && c.sortable !== false;
  return (
    <div class="kjun-table-scroll" style={css({ maxHeight: c.maxHeight, visibility: c.skeletonHidden ? "hidden" : undefined })} aria-hidden={c.skeletonHidden ? "true" : undefined}
      data-stuck={c.stickyHeader && c.stuck.value ? "" : undefined}
      onScroll={c.stickyHeader ? (event: Event) => { c.stuck.value = (event.currentTarget as HTMLElement).scrollTop > 0; } : undefined}>
      <table class="kjun-table" aria-label={c.ariaLabel} data-compact={String(c.compact)} data-hoverable={String(c.hoverable)} data-striped={String(c.striped)}>
        <thead style={c.stickyHeader ? { position: "sticky", top: 0, zIndex: 2 } : undefined}>
          <tr>
            {selectable && (
              <th scope="col" class="kjun-table-action-cell">
                <TableCheck aria-label={c.messages.selectAll} checked={state.all} indeterminate={state.some} onChange={state.toggleAll} />
              </th>
            )}
            {visible.map(col => (
              <th key={col.key} scope="col" style={css({ width: col.width, textAlign: col.align })} class={col.headerClass}
                aria-sort={sorting(col) ? state.sort.key === col.key ? state.sort.order === "asc" ? "ascending" : "descending" : "none" : undefined}>
                {sorting(col) ? (
                  <button type="button" onClick={() => state.sortColumn(col)}>
                    {col.label}
                    <KjunIcon name={state.sort.key !== col.key ? "arrows-sort" : state.sort.order === "asc" ? "sort-ascending" : "sort-descending"} size={state.sort.key === col.key ? tokens.table.sortedIconSize : tokens.table.sortIconSize} class="kjun-table-sort-icon" />
                  </button>
                ) : col.label}
              </th>
            ))}
            {/* Expansion sits at the row's end, so the checkbox is the only leading utility column. */}
            {expandable && <th scope="col" class="kjun-table-action-cell" />}
          </tr>
        </thead>
        <tbody>
          {c.initialLoading ? Array.from({ length: c.skeletonRows }, (_, i) => (
            <tr key={i} aria-hidden="true">
              {selectable && <td class="kjun-table-action-cell"><KjunSkeleton type="block" height={tokens.table.selectionSize} width={tokens.table.selectionSize} /></td>}
              {visible.map(col => (
                <td key={col.key}><KjunSkeleton type="block" height={tokens.table.skeletonHeight} width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"} /></td>
              ))}
              {expandable && <td class="kjun-table-action-cell" />}
            </tr>
          )) : !state.rows.length ? (
            <tr><td colspan={visible.length + Number(selectable) + Number(expandable)} class="kjun-table-empty">{c.empty()}</td></tr>
          ) : body()}
        </tbody>
      </table>
    </div>
  );
}

export function tableCards(c: TableRowsContext & { layout: TableLayout }) {
  const { title, subtitle, badges, inline, sections, actions, columnsForSection } = c.layout;
  const { state } = c;
  const stop = (event: MouseEvent) => event.stopPropagation();
  return (
    <div class="kjun-table-cards" role="list" aria-label={c.ariaLabel}
      style={c.skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={c.skeletonHidden ? "true" : undefined}>
      {c.initialLoading
        ? Array.from({ length: c.skeletonRows }, (_, i) => <div key={i} class="kjun-table-card"><KjunSkeleton type="card" /></div>)
        : state.rows.map((row, i) => (
          <div key={state.key(row, i)} role="listitem" class={"kjun-table-card kjun-table-row-action " + c.customClass(row, i)}
            tabindex={c.clickable ? 0 : undefined} onKeydown={(event: KeyboardEvent) => c.rowKeyDown(event, row, i)} onClick={() => c.rowClick(row, i)}>
            <div class="kjun-table-card-header">
              <div class="kjun-table-card-header-left">
                {c.selectable && c.checkbox(row, i)}
                <span class="kjun-table-card-title">{title && c.cell(title, row, i)}</span>
              </div>
              {badges.length ? (
                <div class="kjun-table-card-badges">{badges.map(col => <span key={col.key}>{c.cell(col, row, i)}</span>)}</div>
              ) : subtitle ? <span class="kjun-table-card-subtitle">{c.cell(subtitle, row, i)}</span> : null}
              {inline.length > 0 && (
                <div class="kjun-table-card-header-actions" onClick={stop}>{inline.map(col => <span key={col.key}>{c.cell(col, row, i)}</span>)}</div>
              )}
            </div>
            {sections.map((section: TableCardSection, index) => {
              const cols = columnsForSection(row, section);
              return cols.length ? (
                <section key={section.key || index} class="kjun-table-card-section">
                  {section.label && <div class="kjun-table-card-section-label">{section.label}</div>}
                  <div class={"kjun-table-card-body kjun-table-card-body--" + (section.layout || "grid")}>
                    {cols.map(col => (
                      <div key={col.key} class={"kjun-table-card-field" + (col.fullWidthInCard ? " kjun-table-card-field--full" : "") +
                        (section.labelAlign === "right" ? " kjun-table-card-field--label-right" : "")}>
                        <span class="kjun-table-card-label">{col.label}</span>
                        <span class="kjun-table-card-value">{c.cell(col, row, i)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
            })}
            {c.expandable && <div class="kjun-table-card-expand-toggle">{c.expand(row, i)}</div>}
            {c.expandable && state.expanded.includes(state.key(row, i)) && <div class="kjun-table-card-expand-content">{c.renderExpand(row, i)}</div>}
            {actions && !actions.inlineInCard && <div class="kjun-table-card-actions" onClick={stop}>{c.cell(actions, row, i)}</div>}
          </div>
        ))}
      {!c.initialLoading && !state.rows.length && <div class="kjun-table-card-empty">{c.empty()}</div>}
    </div>
  );
}

/** Like React: responsive="list" rows are a title over one meta line with the value and badges at the end. */
export function tableList(c: TableRowsContext & { layout: TableLayout }) {
  const { title, listMeta, listValue, badges } = c.layout;
  const { state } = c;
  return (
    <div class="kjun-table-list" role="list" aria-label={c.ariaLabel}
      style={c.skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={c.skeletonHidden ? "true" : undefined}>
      {c.initialLoading
        ? Array.from({ length: c.skeletonRows }, (_, i) => <div key={i} class="kjun-table-list-item"><KjunSkeleton type="text" rows={2} /></div>)
        : state.rows.map((row, i) => (
          <div key={state.key(row, i)} role="listitem">
            <div class={"kjun-table-list-item kjun-table-row-action " + c.customClass(row, i)} data-selected={state.selectedRow(row) || undefined}
              tabindex={c.clickable ? 0 : undefined} onKeydown={(event: KeyboardEvent) => c.rowKeyDown(event, row, i)} onClick={() => c.rowClick(row, i)}>
              {c.selectable && c.checkbox(row, i)}
              <div class="kjun-table-list-main">
                <span class="kjun-table-list-title">{title && c.cell(title, row, i)}</span>
                {listMeta && <span class="kjun-table-list-meta">{c.cell(listMeta, row, i)}</span>}
              </div>
              {(listValue || badges.length > 0) && (
                <div class="kjun-table-list-side">
                  {listValue && <span class="kjun-table-list-value">{c.cell(listValue, row, i)}</span>}
                  {badges.map(col => <span key={col.key}>{c.cell(col, row, i)}</span>)}
                </div>
              )}
              {c.expandable && <span onClick={(event: MouseEvent) => event.stopPropagation()}>{c.expand(row, i)}</span>}
            </div>
            {c.expandable && state.expanded.includes(state.key(row, i)) && <div class="kjun-table-list-expand">{c.renderExpand(row, i)}</div>}
          </div>
        ))}
      {!c.initialLoading && !state.rows.length && <div class="kjun-table-card-empty">{c.empty()}</div>}
    </div>
  );
}
