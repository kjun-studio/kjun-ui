import { fromNestedControl } from "../../../shared/package-runtime/nested-controls";
import { tokens } from "@kjun-ui/tokens";
import { KjunSkeleton } from "./display";
import type { TableNarrowProps } from "./table-cards";
import { useTableGroups } from "./table-groups";
import { TableTotals } from "./table-totals";
/** responsive="list": no header row; each row is a title over one meta line with its value and badges at the end. */
export function TableList<Row extends object>(props: TableNarrowProps<Row>) {
  const { mover, initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand,
    emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown, totals, groups } = props;
  const { title, listMeta, listValue, badges } = layout;
  const item = (row: Row, i: number) => (
    <div key={state.key(row, i)} role="listitem">
      <div
        className={"kjun-table-list-item kjun-table-row-action " + customClass(row, i)}
        data-selected={state.selectedRow(row) || undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={event => rowKeyDown(event, row, i)}
        onClick={event => { if (!fromNestedControl(event)) onRowClick?.(row, i); }}
      >
        {selectable && checkbox(row, i)}
        <div className="kjun-table-list-main">
          <span className="kjun-table-list-title">{title && cell(title, row, i, "listTitle")}</span>
          {listMeta && <span className="kjun-table-list-meta">{cell(listMeta, row, i)}</span>}
        </div>
        {(listValue || badges.length > 0) && (
          <div className="kjun-table-list-side">
            {listValue && <span className="kjun-table-list-value">{cell(listValue, row, i)}</span>}
            {badges.map((col) => <span key={col.key}>{cell(col, row, i)}</span>)}
          </div>
        )}
        {expandable && <span onClick={(event) => event.stopPropagation()}>{expand(row, i)}</span>}
        {mover && <span onClick={(event) => event.stopPropagation()}>{mover(row, i)}</span>}
      </div>
      {expandable && state.expanded.includes(state.key(row, i)) && (
        <div className="kjun-table-list-expand">{renderExpand?.(row, i)}</div>
      )}
    </div>
  );
  const groupSections = useTableGroups(props, "kjun-table-list-group", undefined, item);
  const grouped = !!groups && !initialLoading && state.rows.length > 0, listed = !initialLoading && !grouped && state.rows.length > 0;
  // Like cards: only loaded rows make a list; the totals follow it.
  return (
    <>
      <div className="kjun-table-list" role={listed ? "list" : "group"} aria-label={ariaLabel}
        style={skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={skeletonHidden || undefined}>
        {initialLoading
          ? Array.from({ length: skeletonRows }, (_, i) => (
              // A title over one meta line with a value at the end, like the loaded row.
              <div key={i} className="kjun-table-list-item" aria-hidden="true">
                <div className="kjun-table-list-main">
                  <KjunSkeleton type="line" role="control" width={i % 2 ? "55%" : "40%"} />
                  <KjunSkeleton type="line" role="caption" width="30%" />
                </div>
                <div className="kjun-table-list-side"><KjunSkeleton type="line" role="control" width={tokens.extensions.skeleton.detailWidth} /></div>
              </div>
            ))
          : grouped ? groupSections(groups!) : state.rows.map((row, i) => item(row, i))}
        {!initialLoading && !state.rows.length && <div className="kjun-table-card-empty">{emptyContent || emptyText}</div>}
      </div>
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </>
  );
}
