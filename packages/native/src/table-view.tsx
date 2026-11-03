import { useKjunMessageScope, useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tableRowLabel } from "../../../shared/package-runtime/table-model";
import { typeStyle } from "./typography";
import { tablePresentation, tableCellValue, tableSortFromValue, tableSortOptions, tableSortValue, tableSummaryValue, tableTotals, type TableCellRole } from "../../../shared/package-runtime/table-presentation";
import { groupTableRows, type TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { useTableGroupExpansion } from "../../../shared/package-runtime/use-table-group-expansion";
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
import { TableList } from "./table-list";
import {
KjunTableProps,
TableColumn,
useTableModel
} from "./table-model";
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
  const groups = groupTableRows(state.rows, props.groupBy);
  const expansion = useTableGroupExpansion(groups, props.groupBy, props.expandedGroups, props.onExpandedGroupsChange);
  const layout = tablePresentation(props, mobile);
  // Like Web: groups keep their collapsed keys here; summaries come from the shared rules.
  const grouping = {
    groups,
    ...expansion,
    groupLabel: (group: TableRowGroup<Row>) => props.renderGroupLabel ? props.renderGroupLabel(group.value, group.rows) : group.value == null || group.value === "" ? "-" : String(group.value),
    summary: props.summary ? (col: TableColumn<Row>, rows: Row[]) => tableSummaryValue(props, col, rows, locale) : null,
  };
  const { card, visible } = layout;
  const cell = (col: TableColumn<Row>, row: Row, index: number, role?: TableCellRole) => {
    const { value, body } = tableCellValue(props, col, row, index, locale);
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
    // A card title takes the card title role, like Web's .kjun-table-card-title; list parts match .kjun-table-list-*.
    if (role === "listTitle" || role === "listValue")
      return content(body, { ...typeStyle("control"), color: colors.text, ...(role === "listValue" ? { fontVariant: ["tabular-nums"] as const } : null) });
    if (role === "listMeta") return content(body, { ...typeStyle("caption"), color: colors.textTertiary });
    if (role === "cardSubtitle") return content(body, { ...typeStyle("caption"), color: colors.textSecondary });
    if (role === "tileTitle") return content(body, { ...typeStyle("control"), color: colors.text });
    if (role === "cardHighlight" || role === "tileHighlight")
      return content(body, { ...typeStyle(role === "cardHighlight" ? "sectionTitle" : "control"), color: colors.text, fontVariant: ["tabular-nums"] as const });
    return content(body, {
      ...typeStyle(role === "title" ? "cardTitle" : col.secondary ? "caption" : "body"),
      color: col.secondary && role !== "title" ? colors.textSecondary : colors.text,
      // Card values start at their label (or end a label-value line) whatever the column's table alignment.
      textAlign: role === "cardValue" ? "left" : role === "cardRowValue" ? "right" : col.align,
    });
  };
  // Plain text of a cell, for a value read out with a label the card does not draw.
  const cellText = (col: TableColumn<Row>, row: Row, index: number) => {
    const { body } = tableCellValue(props, col, row, index, locale);
    return typeof body === "string" || typeof body === "number" ? String(body) : undefined;
  };
  const checkbox = (row: Row, i: number) => (
    <KjunCheckbox
      value={state.selectedRow(row)}
      ariaLabel={m.selectRow(tableRowLabel(row, props.cardTitle || props.columns[0]?.key, i))}
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
      ariaLabel={m.expandRow}
      accessibilityState={{ expanded: state.expanded.includes(state.key(row, i)) }}
      onPress={() => state.toggleExpand(row, i)}
    >
      {card
        ? state.expanded.includes(state.key(row, i))
          ? m.collapse
          : m.showDetails
        : undefined}
    </KjunButton>
  );
  return (
    <View
      accessibilityLabel={ariaLabel}
      accessibilityState={{ busy: !!props.loading }}
    >
      <TableToolbar {...{ selectable, selected, renderSelectionToolbar, searchable, searchPlaceholder, toolbar }} allSelected={state.all}
        toggleAll={state.toggleAll} clearSelection={() => props.onSelectionChange?.([])}
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
        {card ? (
          <TableCards {...{ initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, cellText }} groups={grouping.groups} collapsed={grouping.collapsed} toggleGroup={grouping.toggleGroup} groupLabel={grouping.groupLabel} groupTotals={(rows: Row[]) => tableTotals(props, rows, locale)} totals={tableTotals(props, state.rows, locale)} />
        ) : layout.list ? (
          <TableList {...{ initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout }} groups={grouping.groups} collapsed={grouping.collapsed} toggleGroup={grouping.toggleGroup} groupLabel={grouping.groupLabel} groupTotals={(rows: Row[]) => tableTotals(props, rows, locale)} totals={tableTotals(props, state.rows, locale)} />
        ) : (
          <TableGrid {...{ initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, compact, striped, hoverable, ...grouping }} sortable={props.sortable} />
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
