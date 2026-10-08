import { tablePresentation, tableCellValue } from "../../../shared/package-runtime/table-presentation";
import { TableToolbar } from "./table-toolbar";
import { TableGrid } from "./table-grid";
import { TableCards } from "./table-cards";
import { useEffect, useState, type KeyboardEvent } from "react";
import { isComposingKey, tokens } from "@kjun/tokens";
import { DsButton } from "./button";
import { TableCheck } from "./table-check";
import { DsDataState,useQueryDisplay } from "./data-state";
import { DsPagination } from "./navigation";
import { DsTableProps, TableColumn, useTableModel } from "./table-model";
export function DsTable<Row extends object = Record<string, unknown>>(
  props: DsTableProps<Row>
) {
  const {
    skeletonRows = 8,
    emptyText = "데이터가 없습니다",
    hoverable = true,
    searchable = false,
    searchPlaceholder = "검색...",
    stickyHeader = false,
    maxHeight,
    pagination,
    compact = false,
    striped = false,
    ariaLabel = "데이터 표",
    expandable = false,
    rowClass,
    selectable = false,
    selected = [],
    toolbar,
    emptyContent,
    renderExpand,
    renderSelectionToolbar,
    onRowClick,
    onRetry,
  } = props;
  const state = useTableModel(props),
    query = useQueryDisplay(props),
    [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = matchMedia(`(width < ${tokens.table.mobileBreakpoint}px)`);
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const layout = tablePresentation(props, mobile);
  const { card, visible } = layout;
  const cell = (col: TableColumn<Row>, row: Row, index: number) => {
    const { value, body } = tableCellValue(props, col, row, index);
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
  const checkbox = (row: Row, i: number) => (
    <TableCheck
      aria-label={`행 선택 ${i + 1}`}
      checked={state.selectedRow(row)}
      onClick={(e) => e.stopPropagation()}
      onChange={() => state.toggleRow(row)}
    />
  );
  const expand = (row: Row, i: number) => (
    <DsButton
      variant="ghost"
      size="xs"
      prefixIcon={
        state.expanded.includes(state.key(row, i))
          ? "chevron-down"
          : "chevron-right"
      }
      ariaLabel="행 확장"
      aria-expanded={state.expanded.includes(state.key(row, i))}
      onClick={() => state.toggleExpand(row, i)}
    >
      {card
        ? state.expanded.includes(state.key(row, i))
          ? "접기"
          : "상세 보기"
        : undefined}
    </DsButton>
  );
  return (
    <div className="kjun-table-state" aria-busy={!!props.loading}
      ref={domainColorRef(!query.initialLoading && state.rows.length > 0 && props.columns.some(column => column.pill))}>
      <TableToolbar {...{ selectable, selected, renderSelectionToolbar, searchable, searchPlaceholder, toolbar }}
        toggleAll={state.toggleAll} clearSelection={() => props.onSelectionChange?.([])}
        search={state.search} searchChange={state.searchChange} />
      <DsDataState
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
      >
        {card ? (
          <TableCards {...{ initialLoading: query.initialLoading, skeletonRows, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, ariaLabel, customClass, rowKeyDown }} />
        ) : (
          <TableGrid {...{ initialLoading: query.initialLoading, skeletonRows, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, compact, striped, hoverable, ariaLabel, customClass, rowKeyDown }} sortable={props.sortable} />
        )}
        {pagination && (
          <DsPagination
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
      </DsDataState>
    </div>
  );
}
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
