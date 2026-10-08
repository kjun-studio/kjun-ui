import type { KeyboardEvent } from "react";
import type { TableCardSection } from "./table-model";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";
import { DsSkeleton } from "./display";
interface Props<Row extends object> extends TableCardsProps<Row> {
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => void;
}
export function TableCards<Row extends object>({ initialLoading, skeletonRows, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown }: Props<Row>) {
  const { title, subtitle, badges, inline, sections, actions, columnsForSection } = layout;
  return (
          <div className="kjun-table-cards" role="list" aria-label={ariaLabel}>
            {initialLoading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <div key={i} className="kjun-table-card">
                    <DsSkeleton type="card" />
                  </div>
                ))
              : state.rows.map((row, i) => (
                  <div
                    key={state.key(row, i)}
                    role="listitem"
                    className={"kjun-table-card kjun-table-row-action " + customClass(row, i)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={event => rowKeyDown(event, row, i)}
                    onClick={() => onRowClick?.(row, i)}
                  >
                    <div className="kjun-table-card-header">
                      <div className="kjun-table-card-header-left">
                        {selectable && checkbox(row, i)}
                        <span className="kjun-table-card-title">
                          {title && cell(title, row, i)}
                        </span>
                      </div>
                      {badges.length ? (
                        <div className="kjun-table-card-badges">
                          {badges.map((col) => (
                            <span key={col.key}>{cell(col, row, i)}</span>
                          ))}
                        </div>
                      ) : subtitle ? (
                        <span className="kjun-table-card-subtitle">
                          {cell(subtitle, row, i)}
                        </span>
                      ) : null}
                      {inline.length > 0 && (
                        <div
                          className="kjun-table-card-header-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inline.map((col) => (
                            <span key={col.key}>{cell(col, row, i)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {sections.map((section: TableCardSection, index) => {
                      const cols = columnsForSection(row, section);
                      return cols.length ? (
                        <section
                          key={section.key || index}
                          className="kjun-table-card-section"
                        >
                          {section.label && (
                            <div className="kjun-table-card-section-label">
                              {section.label}
                            </div>
                          )}
                          <div
                            className={
                              "kjun-table-card-body kjun-table-card-body--" +
                              (section.layout || "grid")
                            }
                          >
                            {cols.map((col) => (
                              <div
                                key={col.key}
                                className={
                                  "kjun-table-card-field" +
                                  (col.fullWidthInCard
                                    ? " kjun-table-card-field--full"
                                    : "") +
                                  (section.labelAlign === "right"
                                    ? " kjun-table-card-field--label-right"
                                    : "")
                                }
                              >
                                <span className="kjun-table-card-label">
                                  {col.label}
                                </span>
                                <span className="kjun-table-card-value">
                                  {cell(col, row, i)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null;
                    })}
                    {expandable && (
                      <div className="kjun-table-card-expand-toggle">
                        {expand(row, i)}
                      </div>
                    )}
                    {expandable &&
                      state.expanded.includes(state.key(row, i)) && (
                        <div className="kjun-table-card-expand-content">
                          {renderExpand?.(row, i)}
                        </div>
                      )}
                    {actions && !actions.inlineInCard && (
                      <div
                        className="kjun-table-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cell(actions, row, i)}
                      </div>
                    )}
                  </div>
                ))}
            {!initialLoading && !state.rows.length && (
              <div className="kjun-table-card-empty">
                {emptyContent || emptyText}
              </div>
            )}
          </div>
  );
}
