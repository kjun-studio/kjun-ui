import { fromNestedControl } from "../../../shared/package-runtime/nested-controls";
import { tokens } from "@kjun-ui/tokens";
import type { KeyboardEvent } from "react";
import type { TableCardSection } from "./table-model";
import type { TableCardsProps, TableViewParts } from "../../../shared/package-runtime/table-presentation";
import { KjunSkeleton } from "./display";
import { TableTotals } from "./table-totals";
import { useTableGroups } from "./table-groups";
export type TableNarrowProps<Row extends object> = TableCardsProps<Row> & TableViewParts<Row, KeyboardEvent<HTMLElement>>;

export function TableCards<Row extends object>(props: TableNarrowProps<Row>) {
  const { mover, initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand,
    emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown, totals, groups } = props;
  const { title, subtitle, highlight, badges, inline, sections, cardFields, cardLayout, tiles, footerActions, cardFooter, headerMover, cardBody } = layout;
  const badgeList = (row: Row, i: number) => badges.length ? (
    <div className="kjun-table-card-badges">{badges.map((col) => <span key={col.key}>{cell(col, row, i)}</span>)}</div>
  ) : null;
  // With onRowClick the title is also a button, so screen readers find a way to open the row; the card keeps the keyboard stop.
  const heading = (row: Row, i: number) => {
    const body = title && cell(title, row, i, "title");
    return (
      <span className="kjun-table-card-title">
        {onRowClick
          ? <button type="button" tabIndex={-1} className="kjun-table-card-open" onClick={(event) => { event.stopPropagation(); onRowClick(row, i); }}>{body}</button>
          : body}
      </span>
    );
  };
  const card = (row: Row, i: number) => {
    const open = expandable && state.expanded.includes(state.key(row, i));
    return (
      <div
        key={state.key(row, i)}
        role="listitem"
        className={"kjun-table-card kjun-table-row-action " + customClass(row, i)}
        data-selectable={selectable || undefined}
        data-selected={(selectable && state.selectedRow(row)) || undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={event => rowKeyDown(event, row, i)}
        onClick={event => { if (!fromNestedControl(event)) onRowClick?.(row, i); }}
      >
        {tiles ? (
          <>
            {(selectable || badges.length > 0) && (
              <div className="kjun-table-card-header">
                {selectable && checkbox(row, i)}
                {badgeList(row, i)}
              </div>
            )}
            {heading(row, i)}
            {subtitle && <div className="kjun-table-card-subtitle">{cell(subtitle, row, i)}</div>}
            {/* The tile draws no label; screen readers still hear what the value is. */}
            {highlight && <div className="kjun-table-card-highlight"><span className="kjun-sr-only">{highlight.label} </span><span className="kjun-table-card-value">{cell(highlight, row, i)}</span></div>}
          </>
        ) : (
          <>
            <div className="kjun-table-card-header">
              <div className="kjun-table-card-header-left">
                {selectable && checkbox(row, i)}
                {heading(row, i)}
                {subtitle && <div className="kjun-table-card-subtitle">{cell(subtitle, row, i)}</div>}
              </div>
              {badgeList(row, i)}
              {(inline.length > 0 || (mover && headerMover)) && (
                <div className="kjun-table-card-header-actions" onClick={(e) => e.stopPropagation()}>
                  {inline.map((col) => <span key={col.key}>{cell(col, row, i)}</span>)}
                  {mover && headerMover && mover(row, i)}
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
              const fields = cardFields(row, section);
              // A named section is a group for screen readers only; cards draw no section names.
              return fields.length ? (
                <div key={section.key || index} className="kjun-table-card-section" role={section.label ? "group" : undefined} aria-label={section.label || undefined}>
                  <div className={"kjun-table-card-body " + (cardBody(section) === "rows" ? "kjun-table-card-body--rows" : "kjun-table-card-body--" + cardBody(section))}>
                    {fields.map(({ column: col, label, full }) => (
                      <div key={col.key} className={"kjun-table-card-field" + (full ? " kjun-table-card-field--full" : "")
                        + (section.labelAlign === "right" ? " kjun-table-card-field--label-right" : "")}>
                        {label && <span className="kjun-table-card-label">{label}</span>}
                        <span className="kjun-table-card-value">{cell(col, row, i)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })}
            {cardFooter && (
              <div className="kjun-table-card-footer">
                {expandable && <div className="kjun-table-card-expand-toggle">{expand(row, i)}</div>}
                {footerActions && (
                  <div className="kjun-table-card-actions" onClick={(e) => e.stopPropagation()}>{cell(footerActions, row, i)}</div>
                )}
                {mover && !headerMover && <div className="kjun-table-card-actions" onClick={(e) => e.stopPropagation()}>{mover(row, i)}</div>}
              </div>
            )}
            {open && <div className="kjun-table-card-expand-content">{renderExpand?.(row, i)}</div>}
          </>
        )}
      </div>
    );
  };
  const groupSections = useTableGroups(props, "kjun-table-card-group-section", "kjun-table-card-items", card);
  const grouped = !!groups && !initialLoading && state.rows.length > 0, listed = !initialLoading && !grouped && state.rows.length > 0;
  // A list holds only its cards: loading, the empty message and groups make it a labelled group, and the totals follow it.
  return (
    <>
      <div className="kjun-table-cards" data-layout={cardLayout} data-grouped={grouped || undefined} role={listed ? "list" : "group"} aria-label={ariaLabel}
        style={skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={skeletonHidden || undefined}>
        {initialLoading
          ? Array.from({ length: skeletonRows }, (_, i) => <CardSkeleton key={i} layout={layout} />)
          : grouped ? groupSections(groups!) : state.rows.map((row, i) => card(row, i))}
        {!initialLoading && !state.rows.length && (
          <div className="kjun-table-card-empty">{emptyContent || emptyText}</div>
        )}
      </div>
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </>
  );
}

/** The loaded card's own parts, so loading neither nests a card in a card nor changes height when rows arrive. */
function CardSkeleton<Row extends object>({ layout }: { layout: TableCardsProps<Row>["layout"] }) {
  const { tiles, subtitle, highlight, badges, cardLayout } = layout;
  const rows = cardLayout === "rows";
  if (tiles) return (
    <div className="kjun-table-card" aria-hidden="true">
      {badges.length > 0 && <div className="kjun-table-card-header"><KjunSkeleton type="line" role="caption" width={tokens.extensions.tableCard.badgeSkeletonWidth} /></div>}
      <div className="kjun-table-card-title"><KjunSkeleton type="line" role="control" width="70%" /></div>
      {subtitle && <div className="kjun-table-card-subtitle"><KjunSkeleton type="line" role="caption" width="45%" /></div>}
      {highlight && <div className="kjun-table-card-highlight"><KjunSkeleton type="line" role="control" width="55%" /></div>}
    </div>
  );
  return (
    <div className="kjun-table-card" aria-hidden="true">
      <div className="kjun-table-card-header">
        <div className="kjun-table-card-header-left">
          <KjunSkeleton type="line" role="cardTitle" width={tokens.extensions.tableCard.titleSkeletonWidth} />
          {subtitle && <div className="kjun-table-card-subtitle"><KjunSkeleton type="line" role="caption" width="30%" /></div>}
        </div>
      </div>
      {highlight && (
        <div className="kjun-table-card-highlight">
          <KjunSkeleton type="line" role="caption" width="20%" />
          <KjunSkeleton type="line" role="numberLg" width="45%" />
        </div>
      )}
      <div className="kjun-table-card-section">
        <div className={"kjun-table-card-body" + (rows ? " kjun-table-card-body--rows" : "")}>
          {[0, 1, 2, 3].map((field) => (
            <div key={field} className="kjun-table-card-field">
              <KjunSkeleton type="line" role="caption" width={rows ? "25%" : "50%"} />
              <KjunSkeleton type="line" role="body" width={rows ? "20%" : field % 2 ? "60%" : "75%"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
