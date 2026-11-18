import { useKjunMessageScope, useKjunMessages } from "./runtime/messages";
import { Text, computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch, type AllowedComponentProps, type ComponentCustomProps, type ExtractPublicPropTypes, type PropType, type VNodeChild, type VNodeProps, type SlotsType } from "vue";
import { defineComponent } from "./runtime/component";
import { isComposingKey, nextTableSort, tokens, type TableSort } from "@kjun-ui/tokens";
import { filterTableRows, getValue, sortTableRows, stickyHeaderStuck, tableGroupText, tableRowIndex, tableRowKey, tableRowLabel, tableSelection, tableTitleKey, toggleAllRows, toggleExpandedRow, toggleSelectedRow } from "../../../shared/package-runtime/table-model";
import { tableCellValue, tableOpenerRole, tablePresentation, tableSortFromValue, type TableCellRole, tableSortOptions, tableSortValue, tableSummaryValue, tableTotals as summaryTotals } from "../../../shared/package-runtime/table-presentation";
import { tableGroupExpansion, groupTableRows, type TableRowGroup, type TableSummaryKind } from "../../../shared/package-runtime/table-groups";
import { KjunButton } from "./button";
import { KjunDataState, useQueryDisplay } from "./data-state";
import { KjunInput } from "./input";
import { KjunSelect } from "./select-control";
import { KjunPagination } from "./navigation";
import { domainRef } from "./runtime/refs";
import { useLoadingReveal } from "./runtime/loading-reveal";
import { hasContent } from "./runtime/slots";
import { TableCheck, tableGrid, type TableLayout, type TableRenderState, type TableTotal } from "./table-parts";
import { tableCards, tableList } from "./table-narrow";
import type { TableCardSection, TableColumn, TablePagination } from "./table-types";
import type { TableColumnGroup } from "../../../shared/package-runtime/table-columns";
import { reorderPlaceAmong } from "../../../shared/package-runtime/reorder";
import { renderReorderControls, useReorder } from "./reorder-controls";
import { useKjunId } from "./input";
export type { TableCardSection, TableColumn, TablePagination };

export { getValue };
export type { TableSort };
export type TableCellScope<R extends object = Record<string, unknown>> = { value: unknown; column: TableColumn<R>; row: R; index: number };
export type KjunTableSlots<R extends object = Record<string, unknown>> = {
  cell?: (scope: TableCellScope<R>) => VNodeChild;
  [key: `cell-${string}`]: ((scope: TableCellScope<R>) => VNodeChild) | undefined;
  expand?: (scope: { row: R; index: number }) => VNodeChild;
  selectionToolbar?: (scope: { selected: R[] }) => VNodeChild;
  group?: (scope: { value: unknown; rows: R[] }) => VNodeChild;
  toolbar?: () => VNodeChild;
  empty?: () => VNodeChild;
};
const kjunTableProps = {
  columns: { type: Array as PropType<TableColumn<any>[]>, required: true },
  data: { type: Array as PropType<object[]>, default: () => [] },
  rowKey: { type: String, default: "id" },
  queryKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  resultKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  loading: { type: Boolean, default: false },
  error: { type: String as PropType<string | null>, default: null },
  hasLoadedOnce: { type: Boolean, default: undefined },
  skeletonRows: { type: Number, default: 8 },
  /** false shows the shared spinner and loadingText instead of skeleton rows. */
  skeleton: { type: Boolean, default: true },
  loadingText: { type: String, default: undefined },
  /** Milliseconds a first load must last before its loading display shows. */
  loadingDelay: { type: Number, default: 0 },
  emptyText: { type: String, default: undefined },
  sortable: { type: Boolean, default: true },
  /** v-model:sort; leave unset for internal sorting. */
  sort: { type: Object as PropType<TableSort | null>, default: undefined },
  sortMode: { type: String as PropType<"client" | "server">, default: "client" },
  hoverable: { type: Boolean, default: true },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: undefined },
  /** "client" filters data by the search box itself (searchKeys, or every column); "server" only emits search. */
  searchMode: { type: String as PropType<"client" | "server">, default: "server" },
  /** Row fields (dot paths) a client search looks in. Default: every column's key. */
  searchKeys: { type: Array as PropType<string[]>, default: undefined },
  stickyHeader: { type: Boolean, default: false },
  /** Without maxHeight a sticky header sticks under the page scroll; this is its distance from the viewport top (px). */
  stickyOffset: { type: Number, default: 0 },
  maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
  pagination: { type: Object as PropType<TablePagination | null>, default: undefined },
  compact: { type: Boolean, default: false },
  striped: { type: Boolean, default: false },
  /** "none" drops the first column's start padding and the last column's end padding in the grid, so the table lines up with text around it. For tables without row fills. */
  edgeInset: { type: String as PropType<"default" | "none">, default: "default" },
  ariaLabel: { type: String, default: undefined },
  responsive: { type: String as PropType<"card" | "list" | "compact" | "none" | null>, default: null },
  mobileColumns: { type: Array as PropType<string[]>, default: () => [] },
  cardTitle: { type: String as PropType<string | null>, default: undefined },
  cardSubtitle: { type: String as PropType<string | null>, default: undefined },
  cardSections: { type: Array as PropType<TableCardSection[]>, default: () => [] },
  /** Labels over runs of columns, by column key: the header gets a second row. Narrow cards use them as sections when cardSections is empty. */
  columnGroups: { type: Array as PropType<TableColumnGroup[]>, default: undefined },
  /** How many columns a row's cell covers, counting itself (2 merges it with the next column). The covered cells are not drawn. */
  cellSpan: { type: Function as PropType<(row: any, column: TableColumn<any>) => number | null | undefined>, default: undefined },
  /** Rows listed in `order` get up and down buttons. The app keeps the order, passes `data` in it and saves it. */
  reorderable: { type: Boolean, default: false },
  /** v-model:order. The rows' rowKey values in the order shown; a row whose key is not listed cannot move. */
  order: { type: Array as PropType<(string | number)[]>, default: undefined },
  /** Turns the move buttons off. They are also off while the table is sorted by a column or grouped. */
  reorderDisabled: { type: Boolean, default: false },
  /** Why moving is off, shown under the table and read with the buttons; a sorted or grouped table says so by default. */
  reorderDisabledText: { type: String, default: undefined },
  cardLayout: { type: String as PropType<"stacked" | "rows" | "tiles">, default: "stacked" },
  cardHighlight: { type: String as PropType<string | null>, default: undefined },
  expandable: { type: Boolean, default: false },
  /** v-model:expandedRows; leave unset for internal expansion. */
  expandedRows: { type: Array as PropType<(string | number)[]>, default: undefined },
  expandSingle: { type: Boolean, default: false },
  rowClass: { type: [String, Function] as PropType<string | ((row: any, index: number) => string)>, default: undefined },
  selectable: { type: Boolean, default: false },
  /** v-model:selected; leave unset for internal selection (update:selected still reports each change). */
  selected: { type: Array as PropType<object[]>, default: undefined },
  /** Rows that can be selected: the others keep a disabled checkbox and are skipped by select all. */
  rowSelectable: { type: Function as PropType<(row: any) => boolean>, default: undefined },
  /** Row field (dot path) whose values split the rows into collapsible groups. */
  groupBy: { type: String, default: undefined },
  /** Original groupBy values; undefined uses internal expansion, [] closes all groups. */
  expandedGroups: { type: Array as PropType<unknown[]>, default: undefined },
  /** Per column key: a subtotal under each group and a total row at the end. */
  summary: { type: Object as PropType<Partial<Record<string, TableSummaryKind | ((rows: any[], column: TableColumn<any>) => VNodeChild)>>>, default: undefined },
  /** Shows computed summaries, for columns whose cells come from a cell slot rather than a column format. */
  summaryFormat: { type: Function as PropType<(value: number | null, column: TableColumn<any>, kind: TableSummaryKind) => VNodeChild>, default: undefined },
  formatValue: { type: Function as PropType<(value: unknown, column: TableColumn<any>, row: any) => VNodeChild>, default: undefined },
  /** Declared as props: rows become keyboard targets and the retry button appears only when the app listens. */
  onRowClick: { type: Function as PropType<(row: any, index: number) => void>, default: undefined },
  onRetry: { type: Function as PropType<() => void>, default: undefined },
} as const;
export type KjunTableProps<R extends object = Record<string, unknown>> =
  Omit<ExtractPublicPropTypes<typeof kjunTableProps>, "columns" | "data" | "selected" | "rowSelectable" | "rowClass" | "formatValue" | "onRowClick" | "summary"> & {
    columns: TableColumn<R>[];
    summary?: Partial<Record<string, TableSummaryKind | ((rows: NoInfer<R>[], column: TableColumn<NoInfer<R>>) => VNodeChild)>>;
    data?: R[];
    selected?: NoInfer<R>[];
    rowSelectable?: (row: NoInfer<R>) => boolean;
    rowClass?: string | ((row: NoInfer<R>, index: number) => string);
    formatValue?: (value: unknown, column: TableColumn<NoInfer<R>>, row: NoInfer<R>) => VNodeChild;
    onRowClick?: (row: NoInfer<R>, index: number) => void;
    "onUpdate:selected"?: (rows: NoInfer<R>[]) => void;
    "onUpdate:sort"?: (sort: TableSort) => void;
    "onUpdate:expandedRows"?: (keys: (string | number)[]) => void;
    "onUpdate:expandedGroups"?: (values: unknown[]) => void;
    "onUpdate:order"?: (order: (string | number)[]) => void;
    onReorder?: (move: { value: string | number; from: number; to: number; order: (string | number)[] }) => void;
    onPageChange?: (page: number) => void;
    onSearch?: (query: string) => void;
  };
/**
 * Slots: cell-<key> and cell({ value, column, row, index }), expand({ row, index }), selectionToolbar({ selected }), group({ value, rows }), toolbar, empty.
 * Events: update:sort, update:selected, update:expandedRows, update:expandedGroups, page-change, search.
 */
const KjunTableComponent = defineComponent({
  name: "KjunTable",
  props: kjunTableProps,
  emits: {
    "update:sort": (_sort: TableSort) => true, "update:selected": (_rows: any[]) => true,
    "update:expandedRows": (_keys: (string | number)[]) => true, "page-change": (_page: number) => true, search: (_query: string) => true,
    "update:expandedGroups": (_values: unknown[]) => true,
    "update:order": (_order: (string | number)[]) => true,
    reorder: (_move: { value: string | number; from: number; to: number; order: (string | number)[] }) => true,
  },
  slots: Object as SlotsType<KjunTableSlots<any>>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages(), scope = useKjunMessageScope();
    const internalSort = ref<TableSort>({ key: "", order: "asc" }), internalExpanded = ref<(string | number)[]>([]), search = ref("");
    // Like React: read the screen at once on the client, so a phone never draws the grid first.
    const narrowQuery = `(width < ${tokens.table.mobileBreakpoint}px)`;
    const mobile = ref(typeof matchMedia === "function" && matchMedia(narrowQuery).matches), stuck = ref(false), collapsed = ref<string[]>([]);
    const internalSelected = ref<object[]>([]);
    watch(() => props.groupBy, () => { collapsed.value = []; }, { flush: "sync" });
    // Like React: the app keeps the order and passes data in it; moving is off while sorted by a column or grouped.
    const root = ref<HTMLElement | null>(null), reorderNoteId = useKjunId("kjun-table-reorder-");
    const locked = () => !!(props.sort === undefined ? internalSort.value : props.sort)?.key || !!props.groupBy;
    const reorderOff = () => props.reorderDisabled || locked();
    const reorderNote = () => props.reorderable && reorderOff() ? props.reorderDisabledText ?? (locked() ? m.value.tableReorderLocked : undefined) : undefined;
    const reorder = useReorder({ reorderable: () => props.reorderable, order: () => props.order, disabled: reorderOff, controls: () => "buttons",
      noteId: () => reorderNote() ? reorderNoteId : undefined, list: () => root.value, selector: ":scope [data-reorder-index]", owner: ".kjun-table-state",
      onOrderChange: order => emit("update:order", order), onReorder: move => emit("reorder", move) });
    let timer: ReturnType<typeof setTimeout> | undefined, media: MediaQueryList | undefined;
    const updateMobile = () => { mobile.value = !!media?.matches; };
    onMounted(() => { media = matchMedia(narrowQuery); updateMobile(); media.addEventListener("change", updateMobile); });
    // Like React: under the page's own scroll, the sticky header marks itself once the table passes under it.
    const instance = getCurrentInstance();
    const updateStuck = () => {
      if (!props.stickyHeader || props.maxHeight != null) return;
      // Measured against the scroller the page actually scrolls in (an app shell), not only the viewport.
      stuck.value = stickyHeaderStuck((instance?.proxy?.$el as HTMLElement | undefined)?.querySelector?.(".kjun-table") ?? null, props.stickyOffset);
    };
    // Like React, a table that mounts already scrolled under its header marks itself at once.
    onMounted(() => { addEventListener("scroll", updateStuck, { passive: true, capture: true }); updateStuck(); });
    // Like React: a new offset, or turning the sticky header on, measures again without waiting for a scroll.
    watch(() => [props.stickyOffset, props.stickyHeader, props.maxHeight], () => updateStuck(), { flush: "post" });
    onBeforeUnmount(() => { clearTimeout(timer); media?.removeEventListener("change", updateMobile); removeEventListener("scroll", updateStuck, { capture: true }); });
    const query = useQueryDisplay(() => props);
    // Skeleton rows wait out loadingDelay here; the spinner waits inside KjunDataState.
    const revealed = useLoadingReveal(() => query().initialLoading, () => props.skeleton ? props.loadingDelay : 0);

    // Like React: sorting runs when the data or the sort changes, not on every keystroke in the search box.
    const currentSort = computed(() => props.sort === undefined ? internalSort.value : props.sort ?? { key: "", order: "asc" as const });
    const sorted = computed(() => {
      const sort = currentSort.value, compare = props.columns.find(column => column.key === sort.key)?.compare;
      return sortTableRows(props.data, sort, { sortable: props.sortable, sortMode: props.sortMode, compare, locale: scope.value.intl }) as object[];
    });
    const shownRows = computed(() => props.searchMode === "client"
      ? filterTableRows(sorted.value, search.value, props.searchKeys ?? props.columns.map(column => column.key), scope.value.intl) as object[] : sorted.value);
    const rowIndex = computed(() => tableRowIndex(shownRows.value));
    const selected = () => props.selected ?? internalSelected.value;
    const select = (next: object[]) => {
      if (props.selected === undefined) internalSelected.value = next;
      emit("update:selected", next);
    };
    const model = (): TableRenderState & { toggleRow: (row: object) => void; toggleExpand: (row: object, index: number) => void } => {
      const sort = currentSort.value, rows = shownRows.value;
      const key = (row: object, index = 0) => tableRowKey(row, props.rowKey, index);
      const { isSelected, isSelectable, all, some, selectableCount } = tableSelection(rows, selected(), props.rowKey, props.rowSelectable);
      const expanded = props.expandedRows ?? internalExpanded.value;
      return {
        rows, rowIndex: rowIndex.value, key, sort, all, some, selectableCount, selectedRow: isSelected, selectableRow: isSelectable, expanded,
        sortColumn: column => {
          if (!props.sortable || !column.sortable) return;
          const next = nextTableSort(sort, column.key);
          if (props.sort === undefined) internalSort.value = next;
          emit("update:sort", next);
        },
        toggleRow: row => { if (isSelectable(row)) select(toggleSelectedRow(selected(), row, props.rowKey)); },
        toggleAll: () => select(toggleAllRows(rows, selected(), props.rowKey, all, props.rowSelectable)),
        toggleExpand: (row, index) => {
          const next = toggleExpandedRow(expanded, key(row, index), props.expandSingle);
          internalExpanded.value = next;
          emit("update:expandedRows", next);
        },
      };
    };
    const searchChange = (value: string) => {
      search.value = value;
      clearTimeout(timer);
      timer = setTimeout(() => emit("search", value), 300);
    };

    return () => {
      const state = model(), status = query();
      const layout = tablePresentation(props as never, mobile.value) as unknown as TableLayout;
      // Like React: the rows on screen may be one page or a search result of the order; a move never passes a hidden row.
      const shown = props.reorderable ? new Set(state.rows.map((row, index) => state.key(row, index))) : undefined;
      const { card, visible } = layout;
      // Like React: a pressable cell is a button of its own; a title that already opens the row never is.
      const cell = (col: TableColumn<any>, row: any, index: number, role?: TableCellRole): VNodeChild => {
        const content = cellContent(col, row, index);
        return col.onCellPress && !(props.onRowClick && tableOpenerRole(role)) ? (
          <button type="button" class="kjun-table-cell-button" aria-label={col.cellLabel?.(row, index)}
            onClick={(event: MouseEvent) => { event.stopPropagation(); col.onCellPress!(row, index); }}>{content}</button>
        ) : content;
      };
      // Like React's renderCell: a column slot (cell-<key>) wins over the shared cell slot, which wins over column render functions.
      const cellProps = {
        formatValue: props.formatValue,
        renderCell: (value: unknown, column: TableColumn<any>, row: object, index: number) => (slots[`cell-${column.key}`] ?? slots.cell)!({ value, column, row, index }),
      };
      const cellContent = (col: TableColumn<any>, row: any, index: number): VNodeChild => {
        const slotted = !!(slots[`cell-${col.key}`] ?? slots.cell);
        const { value, body } = tableCellValue((slotted ? cellProps : { formatValue: props.formatValue }) as never, col as never, row, index, scope.value.intl);
        return col.pill
          ? <span class={"kjun-table-pill " + (Number(value) > 0 ? "kjun-table-pill-up" : Number(value) < 0 ? "kjun-table-pill-down" : "")}>{body as VNodeChild}</span>
          : body as VNodeChild;
      };
      const customClass = (row: object, i: number) => typeof props.rowClass === "function" ? props.rowClass(row, i) : props.rowClass || "";
      const rowKeyDown = (event: KeyboardEvent, row: object, index: number) => {
        if (!props.onRowClick || event.target !== event.currentTarget || event.defaultPrevented || isComposingKey(event)) return;
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onRowClick(row, index); }
      };
      const rowName = (row: object, i: number) => tableRowLabel(row, tableTitleKey(props), i);
      const checkbox = (row: object, i: number) => (
        <TableCheck aria-label={m.value.selectRow(rowName(row, i))} checked={state.selectedRow(row)} disabled={!state.selectableRow(row)} {...{ onClick: (event: MouseEvent) => event.stopPropagation() }}
          onChange={() => state.toggleRow(row)} />
      );
      // Like React: named by what it shows (or "행 확장" as an icon) and by its row.
      const expand = (row: object, i: number) => {
        const open = state.expanded.includes(state.key(row, i)), text = card ? open ? m.value.collapse : m.value.showDetails : undefined;
        return (
          <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} ariaLabel={`${text ?? m.value.expandRow} ${rowName(row, i)}`} aria-expanded={open}
            onClick={() => state.toggleExpand(row, i)}>
            {text}
          </KjunButton>
        );
      };
      // Like React: the shared summary rules (the app's function, or the kind shown through the column's format).
      const summaryValue = (col: TableColumn<any>, rows: object[]) => tableSummaryValue(props as never, col as never, rows, scope.value.intl) as VNodeChild;
      const groups = groupTableRows(state.rows, props.groupBy);
      const expansion = tableGroupExpansion(groups, props.expandedGroups, collapsed.value);
      const groupExpansion = {
        collapsed: expansion.collapsed,
        toggleGroup: (key: string) => {
          const next = expansion.toggle(key);
          if (!next) return;
          if (props.expandedGroups === undefined) collapsed.value = next.collapsed;
          emit("update:expandedGroups", next.expanded);
        },
      };
      // A group slot that gives only text stays text, so the toggle is named by it as on React ("상태: 진행 중 묶음 접기").
      const groupLabel = (group: TableRowGroup<object>) => slots.group ? plainText(slots.group({ value: group.value, rows: group.rows })) : tableGroupText(group.value);
      const groupTotals = (rows: object[]) => summaryTotals(props as never, rows, scope.value.intl) as TableTotal[];
      const totals = groupTotals(state.rows);
      // Narrow layouts have no header row to sort by; the toolbar offers each sortable column in both orders.
      const sortOptions = card || layout.list ? tableSortOptions(props as never, m.value) : [];
      const sortTo = (value: unknown) => {
        if (!props.sortable) return;
        const next = tableSortFromValue(value);
        if (props.sort === undefined) internalSort.value = next;
        emit("update:sort", next);
      };
      const empty = slots.empty?.();
      const context = {
        messages: m.value,
        initialLoading: status.initialLoading, skeletonRows: props.skeletonRows, skeletonHidden: status.initialLoading && !revealed(), state, clickable: !!props.onRowClick,
        rowClick: (row: object, index: number) => props.onRowClick?.(row, index), selectable: props.selectable, expandable: props.expandable,
        checkbox, expand, cell, renderExpand: (row: object, index: number) => slots.expand?.({ row, index }),
        empty: () => hasContent(empty) ? empty : (props.emptyText ?? m.value.noData), ariaLabel: (props.ariaLabel ?? m.value.dataTable), customClass, rowKeyDown,
        mover: reorder.context.value ? (row: object, index: number) => {
          const moves = reorder.context.value!, key = state.key(row, index), place = reorderPlaceAmong(moves.order, key, shown);
          return place ? renderReorderControls(moves, place, key, String(rowName(row, index)), m.value) : null;
        } : undefined,
      };
      const chosen = selected();
      const selectionToolbar = props.selectable && chosen.length > 0 ? slots.selectionToolbar?.({ selected: chosen }) : undefined;
      const toolbar = slots.toolbar?.();
      const pagination = props.pagination;
      const paint = domainRef(!status.initialLoading && state.rows.length > 0 && props.columns.some(column => column.pill)), note = reorderNote();
      return (
        <div class="kjun-table-state" aria-busy={props.loading}
          ref={(el: unknown) => { root.value = el instanceof HTMLElement ? el : null; paint?.(el); }}>
          {/* The selection bar takes the toolbar's place at the same height, so selecting never moves the table. */}
          {props.selectable && chosen.length > 0 ? (
            <div role="group" aria-label={m.value.selectionActions} class="kjun-table-selection">
              <KjunButton size="sm" variant="ghost" prefixIcon="x" ariaLabel={m.value.deselectAll} onClick={() => select([])} />
              <strong>{m.value.selectedItems(chosen.length)}</strong>
              {!state.all && state.selectableCount > 0 && <KjunButton size="sm" variant="ghost" onClick={state.toggleAll}>{m.value.selectAll}</KjunButton>}
              {selectionToolbar}
            </div>
          ) : (props.searchable || sortOptions.length > 0 || hasContent(toolbar)) && (
            <div class="kjun-table-toolbar">
              {props.searchable && (
                <KjunInput size="sm" style={{ width: tokens.table.searchWidth + "px", maxWidth: "100%" }} modelValue={search.value} ariaLabel={m.value.searchTable}
                  {...{ placeholder: (props.searchPlaceholder ?? m.value.search) }} prefixIcon="search" clearable onUpdate:modelValue={(value: string | number) => searchChange(String(value))} />
              )}{" "}
              {sortOptions.length > 0 && (
                <div class="kjun-table-sort">
                  <KjunSelect size="sm" ariaLabel={m.value.sortBy} options={sortOptions} modelValue={tableSortValue(state.sort)} onUpdate:modelValue={sortTo} />
                </div>
              )}
              {toolbar}
            </div>
          )}
          <KjunDataState queryKey={props.queryKey} resultKey={status.usesQueryState ? status.hasCurrentResult ? props.queryKey : null : undefined}
            hasLoadedOnce={props.hasLoadedOnce} error={props.error} refreshing={status.queryRefreshing} loadingPadding="none" onRetry={props.onRetry}
            loading={props.skeleton ? undefined : props.loading} loadingText={(props.loadingText ?? m.value.loadingEllipsis)} loadingDelay={props.skeleton ? 0 : props.loadingDelay}>
            {card ? tableCards({ ...context, layout, totals, groups, groupLabel, groupTotals, ...groupExpansion }) : layout.list ? tableList({ ...context, layout, totals, groups, groupLabel, groupTotals, ...groupExpansion }) : tableGrid({ ...context, visible, columnGroups: props.columnGroups, cellSpan: props.cellSpan, maxHeight: props.maxHeight, stickyHeader: props.stickyHeader,
              sortable: props.sortable, compact: props.compact, striped: props.striped, hoverable: props.hoverable, edgeInset: props.edgeInset, stuck, stickyOffset: props.stickyOffset,
              groups, ...groupExpansion,
              groupLabel, summary: props.summary ? summaryValue : null })}
            {pagination && (
              <KjunPagination currentPage={pagination.page} totalPages={Math.ceil(pagination.total / (pagination.pageSize || 20))} totalRows={pagination.total}
                pageSize={pagination.pageSize || 20} showInfo onUpdate:page={(page: number) => emit("page-change", page)} />
            )}
          </KjunDataState>
          {note && <p id={reorderNoteId} class="kjun-table-reorder-note" data-edge-inset={props.edgeInset === "none" ? "none" : undefined}>{note}</p>}
          {/* Each move is announced: the row and its new place. */}
          {props.reorderable && <span class="kjun-sr-only" role="status">{reorder.said.value}</span>}
        </div>
      );
    };
  },
});

/** Slot output made only of text nodes, as one string; anything else is returned as it is. */
function plainText(nodes: VNodeChild): VNodeChild {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const texts = list.map(node => typeof node === "string" || typeof node === "number" ? String(node)
    : node && typeof node === "object" && !Array.isArray(node) && node.type === Text && typeof node.children === "string" ? node.children : null);
  return texts.every(text => text != null) ? texts.join("") : nodes;
}

/** Keep the row type through Vue templates, TSX, template refs, slots and update:selected. */
export const KjunTable = KjunTableComponent as Omit<typeof KjunTableComponent, never> & {
  new <R extends object = Record<string, unknown>>(props: KjunTableProps<R>):
    Omit<InstanceType<typeof KjunTableComponent>, "$props" | "$slots" | "$emit"> & {
      $props: KjunTableProps<R> & VNodeProps & AllowedComponentProps & ComponentCustomProps;
      $slots: KjunTableSlots<R>;
      $emit: {
        (event: "update:selected", rows: R[]): void;
        (event: "update:sort", sort: TableSort): void;
        (event: "update:expandedRows", keys: (string | number)[]): void;
        (event: "update:expandedGroups", values: unknown[]): void;
        (event: "update:order", order: (string | number)[]): void;
        (event: "reorder", move: { value: string | number; from: number; to: number; order: (string | number)[] }): void;
        (event: "page-change", page: number): void;
        (event: "search", query: string): void;
      };
    };
};
