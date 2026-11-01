import type { KeyboardEvent } from "react";
import type { TableCardsProps, TableTotal } from "../../../shared/package-runtime/table-presentation";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSkeleton } from "./display";
interface Props<Row extends object> extends TableCardsProps<Row> {
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => void;
}
/** responsive="list": no header row; each row is a title over one meta line with its value and badges at the end. */
export function TableList<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown, totals }: Props<Row>) {
  const { title, listMeta, listValue, badges } = layout;
  return (
    <div className="kjun-table-list" role="list" aria-label={ariaLabel}
      style={skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={skeletonHidden || undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => (
            <div key={i} className="kjun-table-list-item"><KjunSkeleton type="text" rows={2} /></div>
          ))
        : state.rows.map((row, i) => (
            <div key={state.key(row, i)} role="listitem">
              <div
                className={"kjun-table-list-item kjun-table-row-action " + customClass(row, i)}
                data-selected={state.selectedRow(row) || undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={event => rowKeyDown(event, row, i)}
                onClick={() => onRowClick?.(row, i)}
              >
                {selectable && checkbox(row, i)}
                <div className="kjun-table-list-main">
                  <span className="kjun-table-list-title">{title && cell(title, row, i)}</span>
                  {listMeta && <span className="kjun-table-list-meta">{cell(listMeta, row, i)}</span>}
                </div>
                {(listValue || badges.length > 0) && (
                  <div className="kjun-table-list-side">
                    {listValue && <span className="kjun-table-list-value">{cell(listValue, row, i)}</span>}
                    {badges.map((col) => <span key={col.key}>{cell(col, row, i)}</span>)}
                  </div>
                )}
                {expandable && <span onClick={(event) => event.stopPropagation()}>{expand(row, i)}</span>}
              </div>
              {expandable && state.expanded.includes(state.key(row, i)) && (
                <div className="kjun-table-list-expand">{renderExpand?.(row, i)}</div>
              )}
            </div>
          ))}
      {!initialLoading && !state.rows.length && <div className="kjun-table-card-empty">{emptyContent || emptyText}</div>}
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </div>
  );
}

/** The summary on narrow layouts: one closing block with each summarized column's total. */
export function TableTotals({ totals }: { totals?: TableTotal[] }) {
  const m = useKjunMessages();
  return totals?.length ? (
    <div className="kjun-table-totals" role="group" aria-label={m.tableTotal}>
      <span className="kjun-table-totals-title">{m.tableTotal}</span>
      {totals.map((total) => (
        <div key={total.key} className="kjun-table-totals-row">
          <span>{total.label}</span>
          <span className="kjun-table-totals-value">{total.value}</span>
        </div>
      ))}
    </div>
  ) : null;
}
