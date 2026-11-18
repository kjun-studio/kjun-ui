import { useMemo } from "react";
import { useKjunMessageScope, useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tableGroupText, tableRowLabel, tableTitleKey } from "../../../shared/package-runtime/table-model";
import { typeStyle } from "./typography";
import { tableOpenerRole, tablePresentation, tableCellValue, tableSortFromValue, tableSortOptions, tableSortValue, tableSummaryValue, tableTotals, type TableCellRole } from "../../../shared/package-runtime/table-presentation";
import { groupTableRows, type TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { useTableGroupExpansion } from "../../../shared/package-runtime/use-table-group-expansion";
import { TableToolbar } from "./table-toolbar";
import { TableGrid } from "./table-grid";
import { tokens } from "@kjun-ui/tokens";
import {
View,
useWindowDimensions
} from "react-native";
import { KjunButton, disclosureButton } from "./button";
import { KjunCheckbox } from "./controls";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import { KjunDataState,useQueryDisplay } from "./data-state";
import { content,domainColor } from "./internal";
import { AccessiblePressable } from "./a11y";
import { ReorderContext, ReorderControls, useReorder } from "./reorder-controls";
import { KText } from "./internal";
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
    groupLabel: (group: TableRowGroup<Row>) => props.renderGroupLabel ? props.renderGroupLabel(group.value, group.rows) : tableGroupText(group.value),
    summary: props.summary ? (col: TableColumn<Row>, rows: Row[]) => tableSummaryValue(props, col, rows, locale) : null,
  };
  const { card, visible } = layout;
  // Like Web: a pressable cell is a button of its own; a title that already opens the row never is.
  const cell = (col: TableColumn<Row>, row: Row, index: number, role?: TableCellRole) => {
    const body = cellContent(col, row, index, role);
    return col.onCellPress && !(onRowClick && tableOpenerRole(role)) ? (
      <AccessiblePressable accessibilityRole="button" accessibilityLabel={col.cellLabel?.(row, index)} onPress={() => col.onCellPress!(row, index)}
        style={({ pressed }) => ({ opacity: pressed ? tokens.states.opacity.pressed : 1 })}>{body}</AccessiblePressable>
    ) : body;
  };
  const cellContent = (col: TableColumn<Row>, row: Row, index: number, role?: TableCellRole) => {
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
      color: (col.secondary && role !== "title") || role === "merged" ? colors.textSecondary : colors.text,
      // Card values start at their label (or end a label-value line) whatever the column's table alignment.
      textAlign: role === "cardValue" ? "left" : role === "cardRowValue" ? "right" : role === "merged" ? "center" : col.align,
    });
  };
  // Plain text of a cell, for a value read out with a label the card does not draw.
  const cellText = (col: TableColumn<Row>, row: Row, index: number) => {
    const { body } = tableCellValue(props, col, row, index, locale);
    return typeof body === "string" || typeof body === "number" ? String(body) : undefined;
  };
  const rowName = (row: Row, i: number) => tableRowLabel(row, tableTitleKey(props), i);
  // Like Web's table box: a row that cannot be selected keeps its box, faded to the disabled opacity.
  const checkbox = (row: Row, i: number) => {
    const locked = !state.selectableRow(row);
    return (
      <View style={locked ? { opacity: tokens.states.opacity.disabled } : undefined}>
        <KjunCheckbox value={state.selectedRow(row)} ariaLabel={m.selectRow(rowName(row, i))} size="sm" disabled={locked} onValueChange={() => state.toggleRow(row)} />
      </View>
    );
  };
  // Like Web: named by what it shows (or "행 확장" as an icon) and by its row.
  const expand = (row: Row, i: number) => {
    const open = state.expanded.includes(state.key(row, i)), text = card ? open ? m.collapse : m.showDetails : undefined;
    return (
      <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} ariaLabel={`${text ?? m.expandRow} ${rowName(row, i)}`}
        // A show/hide toggle, not a menu: it reports expanded without the open-menu fill, as on the web.
        accessibilityState={{ expanded: open }} {...disclosureButton} onPress={() => state.toggleExpand(row, i)}>
        {text}
      </KjunButton>
    );
  };
  // Like Web: the app keeps the order and passes data in it; moving is off while sorted by a column or grouped.
  const reorderable = !!props.reorderable, locked = !!state.sort.key || !!props.groupBy, reorderOff = !!props.reorderDisabled || locked;
  const reorderNote = reorderable && reorderOff ? props.reorderDisabledText ?? (locked ? m.tableReorderLocked : undefined) : undefined;
  // state.key reads rowKey, so a new rowKey rebuilds the set.
  const shown = useMemo(() => reorderable ? new Set(state.rows.map((row, i) => state.key(row, i))) : undefined, [reorderable, state.rows, props.rowKey]);
  const reorder = useReorder({ reorderable, order: props.order, shown, disabled: reorderOff, onOrderChange: props.onOrderChange, onReorder: props.onReorder });
  const mover = reorderable ? (row: Row, i: number) => <ReorderControls value={state.key(row, i)} name={String(rowName(row, i))} /> : undefined;
  // Like Web: what every layout takes; cards and the list add their layout, name, groups and totals.
  const rows = { initialLoading: query.initialLoading, skeletonRows, skeletonHidden: query.initialLoading && !revealed, state, onRowClick, selectable, checkbox, cell,
    expandable, expand, renderExpand, emptyContent, emptyText, mover };
  const narrow = { ...rows, layout, ariaLabel, groups: grouping.groups, collapsed: grouping.collapsed, toggleGroup: grouping.toggleGroup, groupLabel: grouping.groupLabel,
    groupTotals: (list: Row[]) => tableTotals(props, list, locale), totals: tableTotals(props, state.rows, locale) };
  return (
    <ReorderContext.Provider value={reorder.context}>
    <View
      accessibilityLabel={ariaLabel}
      accessibilityState={{ busy: !!props.loading }}
    >
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
        {card ? <TableCards {...narrow} cellText={cellText} /> : layout.list ? <TableList {...narrow} /> : (
          <TableGrid {...rows} visible={visible} columnGroups={props.columnGroups} cellSpan={props.cellSpan} maxHeight={maxHeight} stickyHeader={stickyHeader}
            compact={compact} striped={striped} hoverable={hoverable} edgeInset={props.edgeInset} {...grouping} sortable={props.sortable} />
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
      {reorderNote ? <KText style={{ ...typeStyle("caption"), color: colors.textTertiary, marginTop: tokens.dimension.value8, paddingHorizontal: tokens.table.cellPadding.regular.x }}>{reorderNote}</KText> : null}
      {reorder.status}
    </View>
    </ReorderContext.Provider>
  );
}
