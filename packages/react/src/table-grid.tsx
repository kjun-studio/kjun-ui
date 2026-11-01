import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { Fragment, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { TableGridProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton, KjunIcon } from "./button";
import { KjunSkeleton } from "./display";
import { TableCheck } from "./table-check";
interface Props<Row extends object> extends TableGridProps<Row, CSSProperties["maxHeight"]> {
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => void;
}
export function TableGrid<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, sortable, compact, striped, hoverable, ariaLabel, customClass, rowKeyDown, groups, collapsed, toggleGroup, groupLabel, summary }: Props<Row>) {
  const m = useKjunMessages();
  const span = visible.length + Number(selectable) + Number(expandable);
  const bodyRow = (row: Row, i: number) => (
    <Fragment key={state.key(row, i)}>
      <tr
        className={"kjun-table-row-action " + customClass(row, i)}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={event => rowKeyDown(event, row, i)}
        data-selected={state.selectedRow(row) || undefined}
        onClick={() => onRowClick?.(row, i)}
      >
        {selectable && <td className="kjun-table-action-cell">{checkbox(row, i)}</td>}
        {visible.map((col) => (
          <td
            key={col.key}
            style={{ textAlign: col.align }}
            data-numeric={col.type === "number" || col.align === "right" || undefined}
            className={
              (col.secondary ? "kjun-table-secondary " : "") +
              (col.className || "")
            }
          >
            {cell(col, row, i)}
          </td>
        ))}
        {expandable && <td className="kjun-table-action-cell">{expand(row, i)}</td>}
      </tr>
      {expandable &&
        state.expanded.includes(state.key(row, i)) && (
          <tr className="kjun-table-expanded">
            <td
              colSpan={visible.length + Number(selectable) + 1}
            >
              {renderExpand?.(row, i)}
            </td>
          </tr>
        )}
    </Fragment>
  );
  // The first column names a summary row unless it carries a value of its own.
  const summaryRow = (rows: Row[], kind: "subtotal" | "total", key: string) => summary && (
    <tr key={key} className="kjun-table-summary" data-kind={kind}>
      {selectable && <td className="kjun-table-action-cell" />}
      {visible.map((col, c) => (
        <td key={col.key} style={{ textAlign: col.align }} data-numeric={col.type === "number" || col.align === "right" || undefined}>
          {summary(col, rows) ?? (c === 0 ? (kind === "total" ? m.tableTotal : m.tableSubtotal) : null)}
        </td>
      ))}
      {expandable && <td className="kjun-table-action-cell" />}
    </tr>
  );
  const body = () => {
    const rows = groups ? groups.flatMap((group) => {
      const open = !collapsed.includes(group.key);
      return [
        <tr key={"group:" + group.key} className="kjun-table-group">
          <td colSpan={span}>
            <span className="kjun-table-group-label">
              <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} aria-expanded={open}
                ariaLabel={m.toggleGroup(String(group.value ?? ""), open)} onClick={() => toggleGroup(group.key)} />
              <span className="kjun-table-group-name">{groupLabel(group)}</span>
              <span className="kjun-table-group-count">{m.groupCount(group.rows.length)}</span>
            </span>
          </td>
        </tr>,
        ...(open ? group.rows.map((row) => bodyRow(row, state.rows.indexOf(row))) : []),
        summaryRow(group.rows, "subtotal", "subtotal:" + group.key),
      ];
    }) : state.rows.map(bodyRow);
    return [...rows, summaryRow(state.rows, "total", "total")];
  };
  // A sticky header marks itself once rows have scrolled under it.
  const [stuck, setStuck] = useState(false);
  return (
          <div className="kjun-table-scroll" style={{ maxHeight, visibility: skeletonHidden ? "hidden" : undefined }} aria-hidden={skeletonHidden || undefined}
            data-stuck={(stickyHeader && stuck) || undefined} onScroll={stickyHeader ? (event) => setStuck(event.currentTarget.scrollTop > 0) : undefined}>
            <table
              className="kjun-table"
              aria-label={ariaLabel}
              data-compact={compact}
              data-hoverable={hoverable}
              data-striped={striped}
            >
              <thead
                style={
                  stickyHeader
                    ? { position: "sticky", top: 0, zIndex: 2 }
                    : undefined
                }
              >
                <tr>
                  {selectable && (
                    <th scope="col" className="kjun-table-action-cell">
                      <TableCheck
                        aria-label={m.selectAll}
                        checked={state.all}
                        ref={(node) => {
                          if (node) node.indeterminate = state.some;
                        }}
                        onChange={state.toggleAll}
                      />
                    </th>
                  )}
                  {visible.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      style={{ width: col.width, textAlign: col.align }}
                      className={col.headerClass}
                      aria-sort={
                        col.sortable && sortable !== false
                          ? state.sort.key === col.key
                            ? state.sort.order === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                    >
                      {col.sortable && sortable !== false ? (
                        <button
                          type="button"
                          onClick={() => state.sortColumn(col)}
                        >
                          {col.label}
                          <KjunIcon
                            name={
                              state.sort.key !== col.key
                                ? "arrows-sort"
                                : state.sort.order === "asc"
                                ? "sort-ascending"
                                : "sort-descending"
                            }
                            size={tokens.table.sortIconSize}
                            className="kjun-table-sort-icon"
                          />
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                  {/* Expansion sits at the row's end, so the checkbox is the only leading utility column. */}
                  {expandable && <th scope="col" className="kjun-table-action-cell" />}
                </tr>
              </thead>
              <tbody>
                {initialLoading ? (
                  Array.from({ length: skeletonRows }, (_, i) => (
                    <tr key={i} aria-hidden="true">
                      {selectable && (
                        <td className="kjun-table-action-cell">
                          <KjunSkeleton type="block" height={tokens.table.selectionSize} width={tokens.table.selectionSize} />
                        </td>
                      )}
                      {visible.map((col) => (
                        <td key={col.key}>
                          <KjunSkeleton
                            type="block"
                            height={tokens.table.skeletonHeight}
                            width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"}
                          />
                        </td>
                      ))}
                      {expandable && <td className="kjun-table-action-cell" />}
                    </tr>
                  ))
                ) : !state.rows.length ? (
                  <tr>
                    <td
                      colSpan={
                        visible.length + Number(selectable) + Number(expandable)
                      }
                      className="kjun-table-empty"
                    >
                      {emptyContent || emptyText}
                    </td>
                  </tr>
                ) : (
                  body()
                )}
              </tbody>
            </table>
          </div>
  );
}
