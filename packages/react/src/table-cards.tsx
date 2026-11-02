import { tokens } from "@kjun-ui/tokens";
import type { KeyboardEvent, ReactNode } from "react";
import type { TableCardSection } from "./table-model";
import { tableGroupName, type TableCardsProps, type TableTotal } from "../../../shared/package-runtime/table-presentation";
import type { TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSkeleton } from "./display";
import { TableTotals } from "./table-totals";
interface Props<Row extends object> extends TableCardsProps<Row> {
  ariaLabel: string;
  customClass: (row: Row, index: number) => string;
  rowKeyDown: (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => void;
}

/** A group's header line: its name, row count and, with two or more rows, its subtotals. Cards and list rows share it. */
function TableGroupHeader({ label, count, totals }: { label: ReactNode; count: string; totals: TableTotal[] }) {
  return (
    <div className="kjun-table-card-group">
      <span>{label}</span>
      <span className="kjun-table-card-group-count">{count}</span>
      {totals.length > 0 && (
        <span className="kjun-table-card-group-total">
          {totals.map((total) => <span key={total.key}>{totals.length > 1 ? <>{total.label} {total.value}</> : total.value}</span>)}
        </span>
      )}
    </div>
  );
}

/** Groups as labelled groups, each a header line over its own list; ungrouped rows stay one list. */
export function useTableGroups<Row extends object>({ groupLabel, groupTotals, state }: Pick<TableCardsProps<Row>, "groupLabel" | "groupTotals" | "state">,
  className: string, itemsClass: string | undefined, item: (row: Row, index: number) => ReactNode) {
  const m = useKjunMessages();
  return (list: TableRowGroup<Row>[]) => list.map((group) => {
    const label = groupLabel?.(group);
    return (
      <div key={group.key} role="group" aria-label={tableGroupName(label, group)} className={className}>
        <TableGroupHeader label={label} count={m.groupCount(group.rows.length)} totals={group.rows.length > 1 ? groupTotals?.(group.rows) ?? [] : []} />
        <div className={itemsClass} role="list">{group.rows.map((row) => item(row, state.rowIndex(row)))}</div>
      </div>
    );
  });
}

export function TableCards<Row extends object>(props: Props<Row>) {
  const { initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand,
    emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown, totals, groups } = props;
  const { title, subtitle, highlight, badges, inline, sections, columnsForSection, cardLayout, tiles, footerActions, cardFooter, cardBody } = layout;
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
              // A named section is a group for screen readers only; cards draw no section names.
              return cols.length ? (
                <div key={section.key || index} className="kjun-table-card-section" role={section.label ? "group" : undefined} aria-label={section.label || undefined}>
                  <div className={"kjun-table-card-body " + (cardBody(section) === "rows" ? "kjun-table-card-body--rows" : "kjun-table-card-body--" + cardBody(section))}>
                    {cols.map((col) => (
                      <div key={col.key} className={"kjun-table-card-field" + (col.fullWidthInCard ? " kjun-table-card-field--full" : "")
                        + (section.labelAlign === "right" ? " kjun-table-card-field--label-right" : "")}>
                        <span className="kjun-table-card-label">{col.label}</span>
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
              </div>
            )}
            {open && <div className="kjun-table-card-expand-content">{renderExpand?.(row, i)}</div>}
          </>
        )}
      </div>
    );
  };
  const groupSections = useTableGroups(props, "kjun-table-card-group-section", "kjun-table-card-items", card);
  const grouped = !!groups && !initialLoading && state.rows.length > 0;
  return (
    <div className="kjun-table-cards" data-layout={cardLayout} data-grouped={grouped || undefined} role={grouped ? "group" : "list"} aria-label={ariaLabel}
      style={skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={skeletonHidden || undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => <CardSkeleton key={i} layout={layout} />)
        : grouped ? groupSections(groups!) : state.rows.map((row, i) => card(row, i))}
      {!initialLoading && !state.rows.length && (
        <div className="kjun-table-card-empty">{emptyContent || emptyText}</div>
      )}
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </div>
  );
}

/** The loaded card's own parts, so loading neither nests a card in a card nor changes height when rows arrive. */
function CardSkeleton<Row extends object>({ layout }: { layout: TableCardsProps<Row>["layout"] }) {
  const { tiles, subtitle, highlight, badges, cardLayout } = layout;
  const rows = cardLayout === "rows";
  if (tiles) return (
    <div className="kjun-table-card">
      {badges.length > 0 && <div className="kjun-table-card-header"><KjunSkeleton type="line" role="caption" width={tokens.extensions.tableCard.badgeSkeletonWidth} /></div>}
      <div className="kjun-table-card-title"><KjunSkeleton type="line" role="control" width="70%" /></div>
      {subtitle && <div className="kjun-table-card-subtitle"><KjunSkeleton type="line" role="caption" width="45%" /></div>}
      {highlight && <div className="kjun-table-card-highlight"><KjunSkeleton type="line" role="control" width="55%" /></div>}
    </div>
  );
  return (
    <div className="kjun-table-card">
      <div className="kjun-table-card-header">
        <div className="kjun-table-card-header-left">
          <KjunSkeleton type="line" role="cardTitle" width={tokens.extensions.tableCard.titleSkeletonWidth} />
          {subtitle && <div className="kjun-table-card-subtitle"><KjunSkeleton type="line" role="caption" width="30%" /></div>}
        </div>
      </div>
      {highlight && (
        <div className="kjun-table-card-highlight">
          <KjunSkeleton type="line" role="caption" width="20%" />
          <KjunSkeleton type="line" role="sectionTitle" width="45%" />
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
