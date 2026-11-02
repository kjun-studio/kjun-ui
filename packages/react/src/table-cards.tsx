import { tokens } from "@kjun-ui/tokens";
import type { KeyboardEvent, ReactNode } from "react";
import type { TableCardSection } from "./table-model";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSkeleton } from "./display";
import { TableTotals } from "./table-list";
interface Props<Row extends object> extends TableCardsProps<Row> {
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => void;
}
export function TableCards<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown, totals, groups, groupLabel }: Props<Row>) {
  const m = useKjunMessages();
  const { title, subtitle, highlight, badges, inline, sections, actions, columnsForSection, cardLayout, tiles } = layout;
  const footerActions = !tiles && actions && !actions.inlineInCard ? actions : null;
  const badgeList = (row: Row, i: number) => badges.length ? (
    <div className="kjun-table-card-badges">{badges.map((col) => <span key={col.key}>{cell(col, row, i)}</span>)}</div>
  ) : null;
  const card = (row: Row, i: number) => {
    const open = expandable && state.expanded.includes(state.key(row, i));
    return (
      <div
        key={state.key(row, i)}
        role="listitem"
        className={"kjun-table-card kjun-table-row-action " + customClass(row, i)}
        data-selectable={selectable || undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={event => rowKeyDown(event, row, i)}
        onClick={() => onRowClick?.(row, i)}
      >
        {tiles ? (
          <>
            {(selectable || badges.length > 0) && (
              <div className="kjun-table-card-header">
                {selectable && checkbox(row, i)}
                {badgeList(row, i)}
              </div>
            )}
            <div className="kjun-table-card-title">{title && cell(title, row, i, "title")}</div>
            {subtitle && <div className="kjun-table-card-subtitle">{cell(subtitle, row, i)}</div>}
            {highlight && <div className="kjun-table-card-highlight"><span className="kjun-table-card-value">{cell(highlight, row, i)}</span></div>}
          </>
        ) : (
          <>
            <div className="kjun-table-card-header">
              <div className="kjun-table-card-header-left">
                {selectable && checkbox(row, i)}
                <span className="kjun-table-card-title">{title && cell(title, row, i, "title")}</span>
                {subtitle && <div className="kjun-table-card-subtitle">{cell(subtitle, row, i)}</div>}
              </div>
              {badgeList(row, i)}
              {inline.length > 0 && (
                <div className="kjun-table-card-header-actions" onClick={(e) => e.stopPropagation()}>
                  {inline.map((col) => <span key={col.key}>{cell(col, row, i)}</span>)}
                </div>
              )}
            </div>
            {highlight && (
              <div className="kjun-table-card-highlight">
                <span className="kjun-table-card-label">{highlight.label}</span>
                <span className="kjun-table-card-value">{cell(highlight, row, i)}</span>
              </div>
            )}
            {sections.map((section: TableCardSection, index) => {
              const cols = columnsForSection(row, section);
              return cols.length ? (
                <section key={section.key || index} className="kjun-table-card-section" aria-label={section.label || undefined}>
                  <div className={"kjun-table-card-body " + (cardLayout === "rows" ? "kjun-table-card-body--rows" : "kjun-table-card-body--" + (section.layout || "grid"))}>
                    {cols.map((col) => (
                      <div key={col.key} className={"kjun-table-card-field" + (col.fullWidthInCard ? " kjun-table-card-field--full" : "")
                        + (section.labelAlign === "right" ? " kjun-table-card-field--label-right" : "")}>
                        <span className="kjun-table-card-label">{col.label}</span>
                        <span className="kjun-table-card-value">{cell(col, row, i)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
            })}
            {(expandable || footerActions) && (
              <div className="kjun-table-card-footer">
                {expandable && <div className="kjun-table-card-expand-toggle">{expand(row, i)}</div>}
                {footerActions && (
                  <div className="kjun-table-card-actions" onClick={(e) => e.stopPropagation()}>{cell(footerActions, row, i)}</div>
                )}
              </div>
            )}
            {open && <div className="kjun-table-card-expand-content">{renderExpand?.(row, i)}</div>}
          </>
        )}
      </div>
    );
  };
  // Grouped cards: each group is a labelled list of its own under a header line, so the outer box is no list.
  const grouped = groups && !initialLoading && state.rows.length > 0;
  const groupSections = (): ReactNode => groups!.map((group) => (
    <section key={group.key} className="kjun-table-card-group-section" aria-label={String(group.value ?? "-")}>
      <div className="kjun-table-card-group"><span>{groupLabel?.(group)}</span><span className="kjun-table-card-group-count">{m.groupCount(group.rows.length)}</span></div>
      <div className="kjun-table-card-items" role="list">{group.rows.map((row) => card(row, state.rowIndex(row)))}</div>
    </section>
  ));
  return (
    <div className="kjun-table-cards" data-layout={cardLayout} data-grouped={grouped || undefined} role={grouped ? "group" : "list"} aria-label={ariaLabel}
      style={skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={skeletonHidden || undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => (
            <div key={i} className="kjun-table-card">
              {/* The card's own header and fields, so loading never nests a card inside the card. */}
              <div className="kjun-table-card-header">
                <div className="kjun-table-card-header-left"><KjunSkeleton type="line" role={tiles ? "control" : "cardTitle"} width={tokens.extensions.tableCard.titleSkeletonWidth} /></div>
              </div>
              {tiles ? (
                <div className="kjun-table-card-highlight"><KjunSkeleton type="line" role="control" width="50%" /></div>
              ) : (
                <div className="kjun-table-card-section">
                  <div className="kjun-table-card-body">
                    {[0, 1, 2, 3].map((field) => (
                      <div key={field} className="kjun-table-card-field">
                        <KjunSkeleton type="line" role="caption" width="50%" />
                        <KjunSkeleton type="line" role="body" width={field % 2 ? "60%" : "75%"} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        : grouped ? groupSections() : state.rows.map((row, i) => card(row, i))}
      {!initialLoading && !state.rows.length && (
        <div className="kjun-table-card-empty">{emptyContent || emptyText}</div>
      )}
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </div>
  );
}
