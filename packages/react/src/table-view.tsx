import { useKjunMessageScope, useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tableGroupText, tableRowLabel, tableTitleKey } from "../../../shared/package-runtime/table-model";
import { tableOpenerRole, tablePresentation, tableCellValue, tableSortFromValue, type TableCellRole, tableSortOptions, tableSortValue, tableSummaryValue, tableTotals } from "../../../shared/package-runtime/table-presentation";
import { groupTableRows, type TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { useTableGroupExpansion } from "../../../shared/package-runtime/use-table-group-expansion";
import { TableToolbar } from "./table-toolbar";
import { TableGrid } from "./table-grid";
import { TableCards } from "./table-cards";
import { TableList } from "./table-list";
import { useCallback, useId, useMemo, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { ReorderContext, ReorderControls, useReorder } from "./reorder-controls";
import { isComposingKey, tokens } from "@kjun-ui/tokens";
import { KjunButton } from "./button";
import { TableCheck } from "./table-check";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import { KjunDataState,useQueryDisplay } from "./data-state";
import { KjunPagination } from "./navigation";
import { KjunTableProps, TableColumn, useTableModel } from "./table-model";
export function KjunTable<Row extends object = Record<string, unknown>>(
  props: KjunTableProps<Row>
) {
  const m = useKjunMessages(), locale = useKjunMessageScope().intl;
  const {
    skeletonRows = 8,
    skeleton = true,
    loadingText = m.loadingEllipsis,
    loadingDelay = 0,
    emptyText = m.noData,
    hoverable = true,
    searchable = false,
    searchPlaceholder = m.search,
    stickyHeader = false,
    maxHeight,
    pagination,
    compact = false,
    striped = false,
    ariaLabel = m.dataTable,
    expandable = false,
    rowClass,
    selectable = false,
    toolbar,
    emptyContent,
    renderExpand,
    renderSelectionToolbar,
    onRowClick,
    onRetry,
  } = props;
  const state = useTableModel(props),
    query = useQueryDisplay(props),
    // Skeleton rows wait out loadingDelay here; the spinner waits inside KjunDataState.
    revealed = useLoadingReveal(query.initialLoading, skeleton ? loadingDelay : 0),
    mobile = useNarrowScreen();
  const groups = groupTableRows(state.rows, props.groupBy);
  const expansion = useTableGroupExpansion(groups, props.groupBy, props.expandedGroups, props.onExpandedGroupsChange);
  const layout = tablePresentation(props, mobile);
  const grouping = {
    groups,
    ...expansion,
    groupLabel: (group: TableRowGroup<Row>) => props.renderGroupLabel ? props.renderGroupLabel(group.value, group.rows) : tableGroupText(group.value),
    summary: props.summary ? (col: TableColumn<Row>, rows: Row[]) => tableSummaryValue(props, col, rows, locale) : null,
  };
  const { card, visible } = layout;
  const cell = (col: TableColumn<Row>, row: Row, index: number, role?: TableCellRole) => {
    const content = cellContent(col, row, index);
    // A pressable cell is a button of its own; a title that already opens the row never is.
    return col.onCellPress && !(onRowClick && tableOpenerRole(role)) ? (
      <button type="button" className="kjun-table-cell-button" aria-label={col.cellLabel?.(row, index)}
        onClick={(event) => { event.stopPropagation(); col.onCellPress!(row, index); }}>{content}</button>
    ) : content;
  };
  const cellContent = (col: TableColumn<Row>, row: Row, index: number) => {
    const { value, body } = tableCellValue(props, col, row, index, locale);
    return col.pill ? (
      <span
        className={
          "kjun-table-pill " +
          (Number(value) > 0
            ? "kjun-table-pill-up"
            : Number(value) < 0
            ? "kjun-table-pill-down"
            : "")
        }
      >
        {body}
      </span>
    ) : (
      body
    );
  };
  const customClass = (row: Row, i: number) =>
    typeof rowClass === "function" ? rowClass(row, i) : rowClass || "";
  const rowKeyDown = (event: KeyboardEvent<HTMLElement>, row: Row, index: number) => {
    if (!onRowClick || event.target !== event.currentTarget || event.defaultPrevented || isComposingKey(event)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row, index);
    }
  };
  const rowName = (row: Row, i: number) => tableRowLabel(row, tableTitleKey(props), i);
  const checkbox = (row: Row, i: number) => (
    <TableCheck
      aria-label={m.selectRow(rowName(row, i))}
      checked={state.selectedRow(row)}
      disabled={!state.selectableRow(row)}
      onClick={(e) => e.stopPropagation()}
      onChange={() => state.toggleRow(row)}
    />
  );
  // The toggle is named by what it shows (or "행 확장" when it is an icon) and by its row, so each row's toggle differs.
  const expand = (row: Row, i: number) => {
    const open = state.expanded.includes(state.key(row, i)), text = card ? open ? m.collapse : m.showDetails : undefined;
    return (
      <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"}
        ariaLabel={`${text ?? m.expandRow} ${rowName(row, i)}`} aria-expanded={open} onClick={() => state.toggleExpand(row, i)}>
        {text}
      </KjunButton>
    );
  };
  // A reorderable table: the app keeps the order and passes data in it, like a reorderable KjunListSection. Moving is off
  // while the rows are sorted by a column or grouped, since their order on screen is then not the app's.
  const [root, setRoot] = useState<HTMLDivElement | null>(null), noteId = "kjun-table-reorder-" + useId().replace(/:/g, "");
  const reorderable = !!props.reorderable, locked = !!state.sort.key || !!props.groupBy;
  const reorderOff = !!props.reorderDisabled || locked, reorderNote = reorderable && reorderOff ? props.reorderDisabledText ?? (locked ? m.tableReorderLocked : undefined) : undefined;
  // The rows on screen may be one page or a search result of the order: a move never passes a row that is not shown.
  // state.key reads rowKey, so a new rowKey rebuilds the set.
  const shown = useMemo(() => reorderable ? new Set(state.rows.map((row, i) => state.key(row, i))) : undefined, [reorderable, state.rows, props.rowKey]);
  const reorder = useReorder({ reorderable, order: props.order, shown, disabled: reorderOff, controls: "buttons", noteId: reorderNote ? noteId : undefined,
    list: root, selector: ":scope [data-reorder-index]", owner: ".kjun-table-state", onOrderChange: props.onOrderChange, onReorder: props.onReorder });
  const mover = reorderable ? (row: Row, i: number) => <ReorderControls value={state.key(row, i)} name={String(rowName(row, i))} /> : undefined;
  // One stable ref: the root for the move controls, and the domain colour check when cells paint price colours.
  const painted = !query.initialLoading && state.rows.length > 0 && props.columns.some(column => column.pill);
  const rootRef = useCallback((node: HTMLDivElement | null) => { setRoot(node); domainColorRef(painted)?.(node); }, [painted]);
  // What every layout takes; cards and the list add their layout, groups and totals.
  const rows = { initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell,
    expandable, expand, renderExpand, emptyContent, emptyText, ariaLabel, customClass, rowKeyDown, mover };
  const narrow = { ...rows, layout, groups: grouping.groups, collapsed: grouping.collapsed, toggleGroup: grouping.toggleGroup, groupLabel: grouping.groupLabel,
    groupTotals: (list: Row[]) => tableTotals(props, list, locale), totals: tableTotals(props, state.rows, locale) };
  return (
    <ReorderContext.Provider value={reorder.context}>
    <div className="kjun-table-state" aria-busy={!!props.loading}
      ref={rootRef}>
      <TableToolbar {...{ selectable, renderSelectionToolbar, searchable, searchPlaceholder, toolbar }} selected={state.selected} allSelected={state.all || !state.selectableCount}
        toggleAll={state.toggleAll} clearSelection={state.clearSelection}
        search={state.search} searchChange={state.searchChange}
        sortOptions={card || layout.list ? tableSortOptions(props, m) : undefined} sortValue={tableSortValue(state.sort)} sortChange={(value) => state.sortTo(tableSortFromValue(value))} />
      <KjunDataState
        queryKey={props.queryKey}
        resultKey={
          query.usesQueryState
            ? query.hasCurrentResult
              ? props.queryKey
              : null
            : undefined
        }
        hasLoadedOnce={props.hasLoadedOnce}
        error={props.error}
        refreshing={query.queryRefreshing}
        loadingPadding="none"
        onRetry={onRetry}
        loading={skeleton ? undefined : props.loading}
        loadingText={loadingText}
        loadingDelay={skeleton ? 0 : loadingDelay}
      >
        {card ? <TableCards {...narrow} /> : layout.list ? <TableList {...narrow} /> : (
          <TableGrid {...rows} visible={visible} columnGroups={props.columnGroups} cellSpan={props.cellSpan} maxHeight={maxHeight} stickyHeader={stickyHeader}
            compact={compact} striped={striped} hoverable={hoverable} {...grouping} edgeInset={props.edgeInset} stickyOffset={props.stickyOffset} sortable={props.sortable} />
        )}
        {pagination && (
          <KjunPagination
            currentPage={pagination.page}
            totalPages={Math.ceil(
              pagination.total / (pagination.pageSize || 20)
            )}
            totalRows={pagination.total}
            pageSize={pagination.pageSize || 20}
            showInfo
            onPageChange={props.onPageChange}
          />
        )}
      </KjunDataState>
      {reorderNote && <p id={noteId} className="kjun-table-reorder-note" data-edge-inset={props.edgeInset === "none" ? "none" : undefined}>{reorderNote}</p>}
      {/* Each move is announced: the row and its new place. */}
      {reorderable && <span className="kjun-sr-only" role="status">{reorder.said}</span>}
    </div>
    </ReorderContext.Provider>
  );
}
import { domainColorRef } from "../../../shared/package-runtime/css-contract";

// Narrow screens swap the grid for cards or rows. Read on the first client render, so a phone never draws the grid
// first; the server (and hydration) assume a wide screen.
const narrowQuery = () => `(width < ${tokens.table.mobileBreakpoint}px)`;
const subscribeNarrow = (change: () => void) => {
  const media = matchMedia(narrowQuery());
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
};
const useNarrowScreen = () => useSyncExternalStore(subscribeNarrow, () => matchMedia(narrowQuery()).matches, () => false);
