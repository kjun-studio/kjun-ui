import { tokens } from "@kjun-ui/tokens";
import { Fragment, type CSSProperties, type KeyboardEvent } from "react";
import type { TableGridProps } from "../../../shared/package-runtime/table-presentation";
import { DsIcon } from "./button";
import { DsSkeleton } from "./display";
import { TableCheck } from "./table-check";
interface Props<Row extends object> extends TableGridProps<Row, CSSProperties["maxHeight"]> {
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => void;
}
export function TableGrid<Row extends object>({ initialLoading, skeletonRows, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, sortable, compact, striped, hoverable, ariaLabel, customClass, rowKeyDown }: Props<Row>) {
  return (
          <div className="kjun-table-scroll" style={{ maxHeight }}>
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
                        aria-label="전체 선택"
                        checked={state.all}
                        ref={(node) => {
                          if (node) node.indeterminate = state.some;
                        }}
                        onChange={state.toggleAll}
                      />
                    </th>
                  )}
                  {expandable && <th scope="col" className="kjun-table-action-cell" />}
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
                          {state.sort.key === col.key && (
                            <DsIcon
                              name={
                                state.sort.order === "asc"
                                  ? "sort-ascending"
                                  : "sort-descending"
                              }
                              size={tokens.table.sortIconSize}
                            />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {initialLoading ? (
                  Array.from({ length: skeletonRows }, (_, i) => (
                    <tr key={i} aria-hidden="true">
                      {selectable && (
                        <td className="kjun-table-action-cell">
                          <DsSkeleton type="block" height={tokens.table.selectionSize} width={tokens.table.selectionSize} />
                        </td>
                      )}
                      {expandable && <td className="kjun-table-action-cell" />}
                      {visible.map((col) => (
                        <td key={col.key}>
                          <DsSkeleton
                            type="block"
                            height={tokens.table.skeletonHeight}
                            width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"}
                          />
                        </td>
                      ))}
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
                  state.rows.map((row, i) => (
                    <Fragment key={state.key(row, i)}>
                      <tr
                        className={"kjun-table-row-action " + customClass(row, i)}
                        tabIndex={onRowClick ? 0 : undefined}
                        onKeyDown={event => rowKeyDown(event, row, i)}
                        data-selected={state.selectedRow(row) || undefined}
                        onClick={() => onRowClick?.(row, i)}
                      >
                        {selectable && <td className="kjun-table-action-cell">{checkbox(row, i)}</td>}
                        {expandable && <td className="kjun-table-action-cell">{expand(row, i)}</td>}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
  );
}
