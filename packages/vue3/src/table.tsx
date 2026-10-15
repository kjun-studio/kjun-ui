import { defineComponent, onBeforeUnmount, onMounted, ref, type ExtractPublicPropTypes, type PropType, type VNodeChild, type SlotsType } from "vue";
import { isComposingKey, nextTableSort, tokens, type TableSort } from "@kjun-ui/tokens";
import { getValue, sortTableRows, tableRowKey, tableSelection, toggleAllRows, toggleExpandedRow, toggleSelectedRow } from "../../../shared/package-runtime/table-model";
import { tablePresentation } from "../../../shared/package-runtime/table-presentation";
import { KjunButton } from "./button";
import { KjunDataState, useQueryDisplay } from "./data-state";
import { KjunInput } from "./input";
import { KjunPagination } from "./navigation";
import { domainRef } from "./runtime/refs";
import { hasContent } from "./runtime/slots";
import { TableCheck, tableCards, tableGrid, type TableLayout, type TableRenderState } from "./table-parts";
import type { TableCardSection, TableColumn, TablePagination } from "./table-types";
export type { TableCardSection, TableColumn, TablePagination };

export { getValue };
export type { TableSort };
type TableCellScope = { value: unknown; column: TableColumn<any>; row: any; index: number };
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
  emptyText: { type: String, default: "데이터가 없습니다" },
  sortable: { type: Boolean, default: true },
  /** v-model:sort; leave unset for internal sorting. */
  sort: { type: Object as PropType<TableSort | null>, default: undefined },
  sortMode: { type: String as PropType<"client" | "server">, default: "client" },
  hoverable: { type: Boolean, default: true },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: "검색..." },
  stickyHeader: { type: Boolean, default: false },
  maxHeight: { type: [Number, String] as PropType<number | string>, default: undefined },
  pagination: { type: Object as PropType<TablePagination | null>, default: undefined },
  compact: { type: Boolean, default: false },
  striped: { type: Boolean, default: false },
  ariaLabel: { type: String, default: "데이터 표" },
  responsive: { type: String as PropType<"card" | "compact" | "none" | null>, default: null },
  mobileColumns: { type: Array as PropType<string[]>, default: () => [] },
  cardTitle: { type: String as PropType<string | null>, default: undefined },
  cardSubtitle: { type: String as PropType<string | null>, default: undefined },
  cardSections: { type: Array as PropType<TableCardSection[]>, default: () => [] },
  expandable: { type: Boolean, default: false },
  /** v-model:expandedRows; leave unset for internal expansion. */
  expandedRows: { type: Array as PropType<(string | number)[]>, default: undefined },
  expandSingle: { type: Boolean, default: false },
  rowClass: { type: [String, Function] as PropType<string | ((row: any, index: number) => string)>, default: undefined },
  selectable: { type: Boolean, default: false },
  /** v-model:selected. */
  selected: { type: Array as PropType<object[]>, default: () => [] },
  formatValue: { type: Function as PropType<(value: unknown, column: TableColumn<any>, row: any) => VNodeChild>, default: undefined },
  /** Declared as props: rows become keyboard targets and the retry button appears only when the app listens. */
  onRowClick: { type: Function as PropType<(row: any, index: number) => void>, default: undefined },
  onRetry: { type: Function as PropType<() => void>, default: undefined },
} as const;
export type KjunTableProps = ExtractPublicPropTypes<typeof kjunTableProps>;
/**
 * Slots: cell-<key> and cell({ value, column, row, index }), expand({ row, index }), selectionToolbar({ selected }), toolbar, empty.
 * Events: update:sort, update:selected, update:expandedRows, page-change, search.
 */
export const KjunTable = defineComponent({
  name: "KjunTable",
  props: kjunTableProps,
  emits: {
    "update:sort": (_sort: TableSort) => true, "update:selected": (_rows: any[]) => true,
    "update:expandedRows": (_keys: (string | number)[]) => true, "page-change": (_page: number) => true, search: (_query: string) => true,
  },
  slots: Object as SlotsType<{
    cell?: (scope: TableCellScope) => VNodeChild;
    [key: `cell-${string}`]: ((scope: TableCellScope) => VNodeChild) | undefined;
    expand?: (scope: { row: object; index: number }) => VNodeChild;
    selectionToolbar?: (scope: { selected: object[] }) => VNodeChild;
    toolbar?: () => VNodeChild;
    empty?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const internalSort = ref<TableSort>({ key: "", order: "asc" }), internalExpanded = ref<(string | number)[]>([]), search = ref("");
    const mobile = ref(false);
    let timer: ReturnType<typeof setTimeout> | undefined, media: MediaQueryList | undefined;
    const updateMobile = () => { mobile.value = !!media?.matches; };
    onMounted(() => { media = matchMedia(`(width < ${tokens.table.mobileBreakpoint}px)`); updateMobile(); media.addEventListener("change", updateMobile); });
    onBeforeUnmount(() => { clearTimeout(timer); media?.removeEventListener("change", updateMobile); });
    const query = useQueryDisplay(() => props);

    const model = (): TableRenderState & { toggleRow: (row: object) => void; toggleExpand: (row: object, index: number) => void } => {
      const sort = props.sort === undefined ? internalSort.value : props.sort ?? { key: "", order: "asc" as const };
      const rows = sortTableRows(props.data, sort, { sortable: props.sortable, sortMode: props.sortMode }) as object[];
      const key = (row: object, index = 0) => tableRowKey(row, props.rowKey, index);
      const { isSelected, all, some } = tableSelection(rows, props.selected, props.rowKey);
      const expanded = props.expandedRows ?? internalExpanded.value;
      return {
        rows, key, sort, all, some, selectedRow: isSelected, expanded,
        sortColumn: column => {
          if (!props.sortable || !column.sortable) return;
          const next = nextTableSort(sort, column.key);
          if (props.sort === undefined) internalSort.value = next;
          emit("update:sort", next);
        },
        toggleRow: row => emit("update:selected", toggleSelectedRow(props.selected, row, props.rowKey)),
        toggleAll: () => emit("update:selected", toggleAllRows(rows, all)),
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
      const { card, visible } = layout;
      const cell = (col: TableColumn<any>, row: any, index: number): VNodeChild => {
        const value = getValue(row, col.key);
        // A column slot (cell-<key>) wins over the shared cell slot, which wins over column render functions.
        const slot = slots[`cell-${col.key}`] ?? slots.cell;
        const body = slot ? slot({ value, column: col, row, index }) : col.render ? col.render(value, row, index) : col.format ? col.format(value, row)
          : props.formatValue ? props.formatValue(value, col, row) : value == null ? "-"
          : typeof value === "number" && col.type === "number" ? new Intl.NumberFormat().format(value) : String(value);
        return col.pill
          ? <span class={"kjun-table-pill " + (Number(value) > 0 ? "kjun-table-pill-up" : Number(value) < 0 ? "kjun-table-pill-down" : "")}>{body}</span>
          : body;
      };
      const customClass = (row: object, i: number) => typeof props.rowClass === "function" ? props.rowClass(row, i) : props.rowClass || "";
      const rowKeyDown = (event: KeyboardEvent, row: object, index: number) => {
        if (!props.onRowClick || event.target !== event.currentTarget || event.defaultPrevented || isComposingKey(event)) return;
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onRowClick(row, index); }
      };
      const checkbox = (row: object, i: number) => (
        <TableCheck aria-label={`행 선택 ${i + 1}`} checked={state.selectedRow(row)} {...{ onClick: (event: MouseEvent) => event.stopPropagation() }}
          onChange={() => state.toggleRow(row)} />
      );
      const expand = (row: object, i: number) => {
        const open = state.expanded.includes(state.key(row, i));
        return (
          <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} ariaLabel="행 확장" aria-expanded={open}
            onClick={() => state.toggleExpand(row, i)}>
            {card ? open ? "접기" : "상세 보기" : undefined}
          </KjunButton>
        );
      };
      const empty = slots.empty?.();
      const context = {
        initialLoading: status.initialLoading, skeletonRows: props.skeletonRows, state, clickable: !!props.onRowClick,
        rowClick: (row: object, index: number) => props.onRowClick?.(row, index), selectable: props.selectable, expandable: props.expandable,
        checkbox, expand, cell, renderExpand: (row: object, index: number) => slots.expand?.({ row, index }),
        empty: () => hasContent(empty) ? empty : props.emptyText, ariaLabel: props.ariaLabel, customClass, rowKeyDown,
      };
      const selectionToolbar = props.selectable && props.selected.length > 0 ? slots.selectionToolbar?.({ selected: props.selected }) : undefined;
      const toolbar = slots.toolbar?.();
      const pagination = props.pagination;
      return (
        <div class="kjun-table-state" aria-busy={props.loading}
          ref={domainRef(!status.initialLoading && state.rows.length > 0 && props.columns.some(column => column.pill))}>
          {props.selectable && props.selected.length > 0 && (
            <div role="toolbar" aria-label="선택 작업" class="kjun-table-selection">
              <strong>{props.selected.length}개 선택</strong>
              <KjunButton size="xs" variant="ghost" onClick={state.toggleAll}>전체 선택</KjunButton>
              <KjunButton size="xs" variant="ghost" onClick={() => emit("update:selected", [])}>선택 해제</KjunButton>
              {selectionToolbar}
            </div>
          )}
          {(props.searchable || hasContent(toolbar)) && (
            <div class="kjun-table-toolbar">
              {props.searchable && (
                <KjunInput size="sm" style={{ width: tokens.table.searchWidth + "px", maxWidth: "100%" }} modelValue={search.value} ariaLabel="표 검색"
                  {...{ placeholder: props.searchPlaceholder }} prefixIcon="search" clearable onUpdate:modelValue={(value: string | number) => searchChange(String(value))} />
              )}{" "}
              {toolbar}
            </div>
          )}
          <KjunDataState queryKey={props.queryKey} resultKey={status.usesQueryState ? status.hasCurrentResult ? props.queryKey : null : undefined}
            hasLoadedOnce={props.hasLoadedOnce} error={props.error} refreshing={status.queryRefreshing} loadingPadding="none" onRetry={props.onRetry}>
            {card ? tableCards({ ...context, layout }) : tableGrid({ ...context, visible, maxHeight: props.maxHeight, stickyHeader: props.stickyHeader,
              sortable: props.sortable, compact: props.compact, striped: props.striped, hoverable: props.hoverable })}
            {pagination && (
              <KjunPagination currentPage={pagination.page} totalPages={Math.ceil(pagination.total / (pagination.pageSize || 20))} totalRows={pagination.total}
                pageSize={pagination.pageSize || 20} showInfo onUpdate:page={(page: number) => emit("page-change", page)} />
            )}
          </KjunDataState>
        </div>
      );
    };
  },
});
