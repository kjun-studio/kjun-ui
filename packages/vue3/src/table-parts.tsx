import type { KjunMessages } from "../../../shared/package-runtime/messages";
import { Fragment, defineComponent, type PropType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import type { TableCardSection, TableColumn } from "./table-types";
import { KjunIcon } from "./button";
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
  sortable?: boolean; compact: boolean; striped: boolean; hoverable: boolean }) {
  const { state, visible, selectable, expandable } = c;
  const sorting = (col: TableColumn<any>) => col.sortable && c.sortable !== false;
  return (
    <div class="kjun-table-scroll" style={css({ maxHeight: c.maxHeight, visibility: c.skeletonHidden ? "hidden" : undefined })} aria-hidden={c.skeletonHidden ? "true" : undefined}>
      <table class="kjun-table" aria-label={c.ariaLabel} data-compact={String(c.compact)} data-hoverable={String(c.hoverable)} data-striped={String(c.striped)}>
        <thead style={c.stickyHeader ? { position: "sticky", top: 0, zIndex: 2 } : undefined}>
          <tr>
            {selectable && (
              <th scope="col" class="kjun-table-action-cell">
                <TableCheck aria-label={c.messages.selectAll} checked={state.all} indeterminate={state.some} onChange={state.toggleAll} />
              </th>
            )}
            {expandable && <th scope="col" class="kjun-table-action-cell" />}
            {visible.map(col => (
              <th key={col.key} scope="col" style={css({ width: col.width, textAlign: col.align })} class={col.headerClass}
                aria-sort={sorting(col) ? state.sort.key === col.key ? state.sort.order === "asc" ? "ascending" : "descending" : "none" : undefined}>
                {sorting(col) ? (
                  <button type="button" onClick={() => state.sortColumn(col)}>
                    {col.label}
                    {state.sort.key === col.key && <KjunIcon name={state.sort.order === "asc" ? "sort-ascending" : "sort-descending"} size={tokens.table.sortIconSize} />}
                  </button>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.initialLoading ? Array.from({ length: c.skeletonRows }, (_, i) => (
            <tr key={i} aria-hidden="true">
              {selectable && <td class="kjun-table-action-cell"><KjunSkeleton type="block" height={tokens.table.selectionSize} width={tokens.table.selectionSize} /></td>}
              {expandable && <td class="kjun-table-action-cell" />}
              {visible.map(col => (
                <td key={col.key}><KjunSkeleton type="block" height={tokens.table.skeletonHeight} width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"} /></td>
              ))}
            </tr>
          )) : !state.rows.length ? (
            <tr><td colspan={visible.length + Number(selectable) + Number(expandable)} class="kjun-table-empty">{c.empty()}</td></tr>
          ) : state.rows.map((row, i) => (
            <Fragment key={state.key(row, i)}>
              <tr class={"kjun-table-row-action " + c.customClass(row, i)} tabindex={c.clickable ? 0 : undefined}
                onKeydown={(event: KeyboardEvent) => c.rowKeyDown(event, row, i)} data-selected={state.selectedRow(row) || undefined}
                onClick={() => c.rowClick(row, i)}>
                {selectable && <td class="kjun-table-action-cell">{c.checkbox(row, i)}</td>}
                {expandable && <td class="kjun-table-action-cell">{c.expand(row, i)}</td>}
                {visible.map(col => (
                  <td key={col.key} style={{ textAlign: col.align }} data-numeric={col.type === "number" || col.align === "right" || undefined}
                    class={(col.secondary ? "kjun-table-secondary " : "") + (col.className || "")}>
                    {c.cell(col, row, i)}
                  </td>
                ))}
              </tr>
              {expandable && state.expanded.includes(state.key(row, i)) && (
                <tr class="kjun-table-expanded"><td colspan={visible.length + Number(selectable) + 1}>{c.renderExpand(row, i)}</td></tr>
              )}
            </Fragment>
          ))}
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
