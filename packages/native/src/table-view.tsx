import { typeStyle } from "./typography";
import { tablePresentation, tableCellValue } from "../../../shared/package-runtime/table-presentation";
import { TableToolbar } from "./table-toolbar";
import { TableGrid } from "./table-grid";
import { tokens } from "@kjun-ui/tokens";
import {
View,
useWindowDimensions
} from "react-native";
import { KjunButton } from "./button";
import { KjunCheckbox } from "./controls";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import { KjunDataState,useQueryDisplay } from "./data-state";
import { content,domainColor } from "./internal";
import { KjunPagination } from "./navigation";
import { useKjunStyles } from "./provider";
import { TableCards } from "./table-cards";
import {
KjunTableProps,
TableColumn,
useTableModel
} from "./table-model";
export function KjunTable<Row extends object = Record<string, unknown>>(
  props: KjunTableProps<Row>
) {
  const {
    skeletonRows = 8,
    skeleton = true,
    loadingText = "로딩 중...",
    loadingDelay = 0,
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
    selectable = false,
    selected = [],
    toolbar,
    emptyContent,
    renderExpand,
    renderSelectionToolbar,
    onRowClick,
    onRetry,
  } = props;
  const { colors, domainColors } = useKjunStyles(),
    state = useTableModel(props),
    query = useQueryDisplay(props),
    // Skeleton rows wait out loadingDelay here; the spinner waits inside KjunDataState.
    revealed = useLoadingReveal(query.initialLoading, skeleton ? loadingDelay : 0),
    mobile = useWindowDimensions().width < tokens.table.mobileBreakpoint;
  const layout = tablePresentation(props, mobile);
  const { card, visible } = layout;
  const cell = (col: TableColumn<Row>, row: Row, index: number, role?: "title") => {
    const { value, body } = tableCellValue(props, col, row, index);
    if (col.pill) {
      const role =
        Number(value) > 0 ? "priceUp" : Number(value) < 0 ? "priceDown" : null;
      return (
        <View
          style={{
            alignSelf: "flex-start",
            paddingVertical: tokens.dimension.value2,
            paddingHorizontal: tokens.dimension.value8,
            borderRadius: tokens.radius.radius4,
            backgroundColor: role
              ? domainColor(domainColors, role + "Bg")
              : undefined,
          }}
        >
          {content(body, {
            color: role ? domainColor(domainColors, role) : colors.text,
            ...typeStyle('meta'),

          })}
        </View>
      );
    }
    // A card title takes the card title role, like Web's .kjun-table-card-title.
    return content(body, {
      ...typeStyle(role === "title" ? "cardTitle" : col.secondary ? "caption" : "body"),
      color: col.secondary && role !== "title" ? colors.textSecondary : colors.text,
      textAlign: col.align,
    });
  };
  const checkbox = (row: Row, i: number) => (
    <KjunCheckbox
      value={state.selectedRow(row)}
      ariaLabel={`행 선택 ${i + 1}`}
      size="sm"
      onValueChange={() => state.toggleRow(row)}
    />
  );
  const expand = (row: Row, i: number) => (
    <KjunButton
      variant="ghost"
      size="xs"
      prefixIcon={
        state.expanded.includes(state.key(row, i))
          ? "chevron-down"
          : "chevron-right"
      }
      ariaLabel="행 확장"
      onPress={() => state.toggleExpand(row, i)}
    >
      {card
        ? state.expanded.includes(state.key(row, i))
          ? "접기"
          : "상세 보기"
        : undefined}
    </KjunButton>
  );
  return (
    <View
      accessibilityLabel={ariaLabel}
      accessibilityState={{ busy: !!props.loading }}
    >
      <TableToolbar {...{ selectable, selected, renderSelectionToolbar, searchable, searchPlaceholder, toolbar }}
        toggleAll={state.toggleAll} clearSelection={() => props.onSelectionChange?.([])}
        search={state.search} searchChange={state.searchChange} />
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
        {card ? (
          <TableCards {...{ initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout }} />
        ) : (
          <TableGrid {...{ initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, compact, striped, hoverable }} sortable={props.sortable} />
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
    </View>
  );
}
