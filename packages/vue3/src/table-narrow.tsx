import type { VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import type { TableCardSection } from "./table-types";
import type { TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { tableGroupName } from "../../../shared/package-runtime/table-presentation";
import { KjunSkeleton } from "./display";
import { tableTotals, type TableLayout, type TableRowsContext, type TableTotal } from "./table-parts";

type Row = object;
export interface TableNarrowContext extends TableRowsContext {
  layout: TableLayout;
  totals: TableTotal[];
  groups: TableRowGroup<Row>[] | null;
  groupLabel: (group: TableRowGroup<Row>) => VNodeChild;
  groupTotals: (rows: Row[]) => TableTotal[];
}

/** Like React: each group is a labelled group, a header line (name, count, subtotals with two or more rows) over its own list. */
function groupSections(c: TableNarrowContext, className: string, itemsClass: string | undefined, item: (row: Row, index: number) => VNodeChild) {
  return c.groups!.map(group => {
    const label = c.groupLabel(group), totals = group.rows.length > 1 ? c.groupTotals(group.rows) : [];
    return (
      <div key={group.key} role="group" aria-label={tableGroupName(label, group)} class={className}>
        <div class="kjun-table-card-group">
          <span>{label}</span>
          <span class="kjun-table-card-group-count">{c.messages.groupCount(group.rows.length)}</span>
          {totals.length > 0 && (
            <span class="kjun-table-card-group-total">
              {totals.map(total => <span key={total.key}>{totals.length > 1 ? [total.label, " ", total.value] : total.value}</span>)}
            </span>
          )}
        </div>
        <div class={itemsClass} role="list">{group.rows.map(row => item(row, c.state.rowIndex(row)))}</div>
      </div>
    );
  });
}

/** Like React: the loaded card's own parts, so loading neither nests a card in a card nor changes height when rows arrive. */
function cardSkeleton(layout: TableLayout, key: number) {
  const { tiles, subtitle, highlight, badges, cardLayout } = layout, rows = cardLayout === "rows";
  if (tiles) return (
    <div key={key} class="kjun-table-card">
      {badges.length > 0 && <div class="kjun-table-card-header"><KjunSkeleton type="line" role="caption" width={tokens.extensions.tableCard.badgeSkeletonWidth} /></div>}
      <div class="kjun-table-card-title"><KjunSkeleton type="line" role="control" width="70%" /></div>
      {subtitle && <div class="kjun-table-card-subtitle"><KjunSkeleton type="line" role="caption" width="45%" /></div>}
      {highlight && <div class="kjun-table-card-highlight"><KjunSkeleton type="line" role="control" width="55%" /></div>}
    </div>
  );
  return (
    <div key={key} class="kjun-table-card">
      <div class="kjun-table-card-header">
        <div class="kjun-table-card-header-left">
          <KjunSkeleton type="line" role="cardTitle" width={tokens.extensions.tableCard.titleSkeletonWidth} />
          {subtitle && <div class="kjun-table-card-subtitle"><KjunSkeleton type="line" role="caption" width="30%" /></div>}
        </div>
      </div>
      {highlight && (
        <div class="kjun-table-card-highlight">
          <KjunSkeleton type="line" role="caption" width="20%" />
          <KjunSkeleton type="line" role="sectionTitle" width="45%" />
        </div>
      )}
      <div class="kjun-table-card-section">
        <div class={"kjun-table-card-body" + (rows ? " kjun-table-card-body--rows" : "")}>
          {[0, 1, 2, 3].map(field => (
            <div key={field} class="kjun-table-card-field">
              <KjunSkeleton type="line" role="caption" width={rows ? "25%" : "50%"} />
              <KjunSkeleton type="line" role="body" width={rows ? "20%" : field % 2 ? "60%" : "75%"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function tableCards(c: TableNarrowContext) {
  const { title, subtitle, highlight, badges, inline, sections, columnsForSection, cardLayout, tiles, footerActions, cardFooter, cardBody } = c.layout;
  const { state } = c;
  const stop = (event: MouseEvent) => event.stopPropagation();
  const badgeList = (row: Row, i: number) => badges.length
    ? <div class="kjun-table-card-badges">{badges.map(col => <span key={col.key}>{c.cell(col, row, i)}</span>)}</div> : null;
  // Like React: with a row click the title is also a button for screen readers; the card keeps the keyboard stop.
  const heading = (row: Row, i: number) => (
    <span class="kjun-table-card-title">
      {c.clickable
        ? <button type="button" tabindex={-1} class="kjun-table-card-open" onClick={(event: MouseEvent) => { event.stopPropagation(); c.rowClick(row, i); }}>{title && c.cell(title, row, i)}</button>
        : title && c.cell(title, row, i)}
    </span>
  );
  // Like React: tiles keep the title, subtitle, badges and highlight; the other layouts add fields and one footer row.
  const card = (row: Row, i: number) => (
    <div key={state.key(row, i)} role="listitem" class={"kjun-table-card kjun-table-row-action " + c.customClass(row, i)} data-selectable={c.selectable || undefined}
      data-selected={(c.selectable && state.selectedRow(row)) || undefined}
      tabindex={c.clickable ? 0 : undefined} onKeydown={(event: KeyboardEvent) => c.rowKeyDown(event, row, i)} onClick={() => c.rowClick(row, i)}>
      {tiles ? [
        (c.selectable || badges.length > 0) && <div class="kjun-table-card-header">{c.selectable && c.checkbox(row, i)}{badgeList(row, i)}</div>,
        heading(row, i),
        subtitle && <div class="kjun-table-card-subtitle">{c.cell(subtitle, row, i)}</div>,
        highlight && <div class="kjun-table-card-highlight"><span class="kjun-sr-only">{highlight.label} </span><span class="kjun-table-card-value">{c.cell(highlight, row, i)}</span></div>,
      ] : [
        <div class="kjun-table-card-header">
          <div class="kjun-table-card-header-left">
            {c.selectable && c.checkbox(row, i)}
            {heading(row, i)}
            {subtitle && <div class="kjun-table-card-subtitle">{c.cell(subtitle, row, i)}</div>}
          </div>
          {badgeList(row, i)}
          {inline.length > 0 && (
            <div class="kjun-table-card-header-actions" onClick={stop}>{inline.map(col => <span key={col.key}>{c.cell(col, row, i)}</span>)}</div>
          )}
        </div>,
        highlight && (
          <div class="kjun-table-card-highlight">
            <span class="kjun-table-card-label">{highlight.label}</span>
            <span class="kjun-table-card-value">{c.cell(highlight, row, i)}</span>
          </div>
        ),
        ...sections.map((section: TableCardSection, index) => {
          const cols = columnsForSection(row, section);
          return cols.length ? (
            <div key={section.key || index} class="kjun-table-card-section" role={section.label ? "group" : undefined} aria-label={section.label || undefined}>
              <div class={"kjun-table-card-body " + (cardBody(section) === "rows" ? "kjun-table-card-body--rows" : "kjun-table-card-body--" + cardBody(section))}>
                {cols.map(col => (
                  <div key={col.key} class={"kjun-table-card-field" + (col.fullWidthInCard ? " kjun-table-card-field--full" : "") +
                    (section.labelAlign === "right" ? " kjun-table-card-field--label-right" : "")}>
                    <span class="kjun-table-card-label">{col.label}</span>
                    <span class="kjun-table-card-value">{c.cell(col, row, i)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        }),
        cardFooter && (
          <div class="kjun-table-card-footer">
            {c.expandable && <div class="kjun-table-card-expand-toggle">{c.expand(row, i)}</div>}
            {footerActions && <div class="kjun-table-card-actions" onClick={stop}>{c.cell(footerActions, row, i)}</div>}
          </div>
        ),
        c.expandable && state.expanded.includes(state.key(row, i)) && <div class="kjun-table-card-expand-content">{c.renderExpand(row, i)}</div>,
      ]}
    </div>
  );
  const grouped = !!c.groups && !c.initialLoading && state.rows.length > 0;
  return (
    <div class="kjun-table-cards" data-layout={cardLayout} data-grouped={grouped || undefined} role={grouped ? "group" : "list"} aria-label={c.ariaLabel}
      style={c.skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={c.skeletonHidden ? "true" : undefined}>
      {c.initialLoading
        ? Array.from({ length: c.skeletonRows }, (_, i) => cardSkeleton(c.layout, i))
        : grouped ? groupSections(c, "kjun-table-card-group-section", "kjun-table-card-items", card) : state.rows.map(card)}
      {!c.initialLoading && !state.rows.length && <div class="kjun-table-card-empty">{c.empty()}</div>}
      {!c.initialLoading && state.rows.length > 0 && tableTotals(c.totals, c.messages.tableTotal)}
    </div>
  );
}

/** Like React: responsive="list" rows are a title over one meta line with the value and badges at the end. */
export function tableList(c: TableNarrowContext) {
  const { title, listMeta, listValue, badges } = c.layout;
  const { state } = c;
  const item = (row: Row, i: number) => (
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
  );
  const grouped = !!c.groups && !c.initialLoading && state.rows.length > 0;
  return (
    <div class="kjun-table-list" role={grouped ? "group" : "list"} aria-label={c.ariaLabel}
      style={c.skeletonHidden ? { visibility: "hidden" } : undefined} aria-hidden={c.skeletonHidden ? "true" : undefined}>
      {c.initialLoading
        ? Array.from({ length: c.skeletonRows }, (_, i) => (
          <div key={i} class="kjun-table-list-item">
            <div class="kjun-table-list-main">
              <KjunSkeleton type="line" role="control" width={i % 2 ? "55%" : "40%"} />
              <KjunSkeleton type="line" role="caption" width="30%" />
            </div>
            <div class="kjun-table-list-side"><KjunSkeleton type="line" role="control" width={tokens.extensions.skeleton.detailWidth} /></div>
          </div>
        ))
        : grouped ? groupSections(c, "kjun-table-list-group", undefined, item) : state.rows.map(item)}
      {!c.initialLoading && !state.rows.length && <div class="kjun-table-card-empty">{c.empty()}</div>}
      {!c.initialLoading && state.rows.length > 0 && tableTotals(c.totals, c.messages.tableTotal)}
    </div>
  );
}
