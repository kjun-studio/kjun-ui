import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tableRowLabel } from "../../../shared/package-runtime/table-model";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Fragment, useId, useState, type ReactNode } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { tableGroupName, type TableGridProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton, KjunIcon, disclosureButton } from "./button";
import { KjunSkeleton } from "./display";
import { ScrollView, View, type TextStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunCheckbox } from "./controls";
import { KText, content } from "./internal";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { useKjunStyles } from "./provider";
import type { TableColumn } from "./table-model";
import { tableColumnWidth, tableHeaderRows, tablePercentWidth, tableSpans } from "../../../shared/package-runtime/table-columns";
export function TableGrid<Row extends object>({ columnGroups, cellSpan, mover, initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, sortable, compact, striped, hoverable, groups, collapsed, toggleGroup, groupLabel, summary, edgeInset }: TableGridProps<Row, number>) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const geometry = tokens.table;
  // Like Web's scroll hint: when columns overflow, the trailing edge fades until the end is reached.
  const [scroll, setScroll] = useState({ viewport: 0, x: 0 }), [stuck, setStuck] = useState(false), fadeId = "kjun-table-fade-" + useId().replace(/[^a-z0-9]/gi, "");
  const cellPadding = geometry.cellPadding[compact ? "compact" : "regular"];
  // edgeInset="none", like Web: the first column's start and the last column's end lose their padding in every row.
  // A leading checkbox column or a trailing expand or move column is the edge instead, so the data column keeps its inset.
  const flush = edgeInset === "none";
  const sides = (x: number, first: boolean, last: boolean) => ({ paddingLeft: flush && first ? 0 : x, paddingRight: flush && last ? 0 : x });
  const firstColumn = (index: number) => index === 0 && !selectable;
  const lastColumn = (index: number, span = 1) => index + span === visible.length && !expandable && !mover;
  // Like Web, a percent width is a share of the table's own width, so "30%" columns fit a narrow sheet instead of
  // falling back to the default width and overflowing. The table is measured first, so it stays hidden for that frame.
  const naturalWidth = (col: TableColumn<Row>) => tableColumnWidth(col.width, scroll.viewport, geometry.columnWidth);
  const unmeasured = !scroll.viewport && visible.some((col) => tablePercentWidth(col.width) != null);
  // A reorderable table ends each row with its two move buttons (sm, side by side), after the expand toggle.
  const moverWidth = mover ? 2 * tokens.button.heights.sm + tokens.extensions.list.actionsGap + 2 * geometry.cellPadding.compact.x : 0;
  const utilityWidth = (selectable ? geometry.actionColumnWidth : 0) + (expandable ? geometry.actionColumnWidth : 0) + moverWidth;
  const naturalTotal = visible.reduce((sum, col) => sum + naturalWidth(col), 0) + utilityWidth;
  // Like Web's 100% table: narrower columns share the spare width so the grid always fills its container.
  // Columns the app sized keep their width; the spare width goes to the rest (to every column when all are sized).
  const flexible = visible.filter((col) => col.width == null);
  const shared = (flexible.length ? flexible : visible).reduce((sum, col) => sum + naturalWidth(col), 0);
  const spare = Math.max(0, scroll.viewport - naturalTotal);
  const width = (col: TableColumn<Row>) => {
    const base = naturalWidth(col);
    return spare && (!flexible.length || col.width == null) ? base + spare * (base / (shared || 1)) : base;
  };
  const totalWidth = naturalTotal + spare;
  const fade = totalWidth - scroll.viewport - scroll.x > 1;
  // Like Web: stripes are a faint text tint, distinct from the header and expanded rows.
  const stripe = (typeof colors.text === "string" && tintColor(colors.text, tokens.states.opacity.stripe)) || colors.secondary;
  // A row with a pressable cell keeps its cells separate, so the cell's button stays reachable on a device.
  const cellButtons = visible.some((col) => col.onCellPress), merged = !!onRowClick && !selectable && !expandable && !cellButtons && !mover;
  const bodyRow = (row: Row, i: number) => {
    const spans = tableSpans(visible, cellSpan ? (column) => cellSpan(row, column) : null);
    return (
    <Fragment key={state.key(row, i)}>
      <Pressable
        // A pressable row with no controls of its own is one button named by its first column; with a checkbox or an
        // expand button it stays a plain row, so those controls stay reachable (a device would merge them into the row).
        accessible={merged}
        accessibilityRole={merged ? "button" : undefined}
        accessibilityLabel={merged ? String(tableRowLabel(row, visible[0]?.key, i)) : undefined}
        onPress={() => onRowClick?.(row, i)}
        style={({ pressed }) => ({
          flexDirection: "row",
          borderBottomWidth: tokens.border.defaultWidth,
          borderBottomColor: colors.divider,
          backgroundColor:
            pressed && hoverable
              ? colors.tableRowHover
              : state.selectedRow(row)
              ? colors.selectedBg
              : striped && i % 2
              ? stripe
              : undefined,
        })}
      >
        {selectable && (
          <View
            style={{
              width: geometry.actionColumnWidth,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {checkbox(row, i)}
          </View>
        )}
        {visible.map((col, c) => spans[c] > 0 && (
          <View
            key={col.key}
            style={{
              // A spanning cell is as wide as the columns it covers.
              width: visible.slice(c, c + spans[c]).reduce((sum, covered) => sum + width(covered), 0),
              paddingVertical: cellPadding.y,
              ...sides(cellPadding.x, firstColumn(c), lastColumn(c, spans[c])),
              justifyContent: "center",
            }}
          >
            {/* Like Web: a cell over two or more columns is centred and quieter. */}
            {cell(col, row, i, spans[c] > 1 ? "merged" : undefined)}
          </View>
        ))}
        {expandable && (
          <View
            style={{
              width: geometry.actionColumnWidth,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {expand(row, i)}
          </View>
        )}
        {mover && <View style={{ width: moverWidth, alignItems: "center", justifyContent: "center" }}>{mover(row, i)}</View>}
      </Pressable>
      {expandable &&
        state.expanded.includes(state.key(row, i)) && (
          <View
            style={{
              paddingVertical: geometry.expandedPadding.y,
              ...sides(geometry.expandedPadding.x, true, true),
              // Like Web: behind a selection column the panel's text starts where the row's text starts.
              ...(selectable ? { paddingLeft: geometry.actionColumnWidth + cellPadding.x } : null),
              backgroundColor: colors.secondary,
            }}
          >
            {content(renderExpand?.(row, i))}
          </View>
        )}
    </Fragment>
    );
  };
  const summaryCell = (value: ReactNode, name: string | null, style: TextStyle) => {
    const shown = value !== null && value !== undefined && value !== "" && value !== false;
    if (!name) return shown ? content(value, style) : null;
    return shown && (typeof value === "string" || typeof value === "number")
      ? content(name + " " + value, style)
      : shown ? <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4 }}>{content(name, style)}{content(value, style)}</View> : content(name, style);
  };
  // Like Web: subtotals read quieter than rows, and the total closes the table under a strong text-colored rule.
  const summaryRow = (rows: Row[], kind: "subtotal" | "total", key: string) => summary && (
    <View key={key} style={{ flexDirection: "row", ...(kind === "total" ? { borderTopWidth: tokens.border.controlWidth, borderTopColor: colors.text } : null) }}>
      {selectable && <View style={{ width: geometry.actionColumnWidth }} />}
      {visible.map((col, c) => (
        <View key={col.key} style={{ width: width(col), paddingVertical: cellPadding.y, ...sides(cellPadding.x, firstColumn(c), lastColumn(c)), justifyContent: "center",
          alignItems: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start" }}>
          {/* Like Web: the first cell always names the row, and a first column with a value of its own shows both. */}
          {summaryCell(summary(col, rows), c === 0 ? (kind === "total" ? m.tableTotal : m.tableSubtotal) : null,
            kind === "total" ? { ...typeStyle("control"), color: colors.text } : { ...typeStyle("caption"), color: colors.textSecondary })}
        </View>
      ))}
      {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
      {mover && <View style={{ width: moverWidth }} />}
    </View>
  );
  // Like Web: with column groups the header has two rows; a group's label sits over its columns, lone columns span both rows.
  const headerRows = tableHeaderRows(visible, columnGroups);
  // A lone column beside a group stretches to the header's full height, as the row stretches its children.
  // Like Web's th: every column header is read. A sortable one is a button (its order read as a hint); the others are
  // plain header cells, since a disabled button would be read as dimmed.
  const columnHeader = (col: TableColumn<Row>) => {
    const sorts = !!col.sortable && sortable !== false;
    const Header = (sorts ? Pressable : View) as typeof View;
    return (
                  <Header
                    key={col.key}
                    accessible
                    role={sorts ? "button" : "columnheader"}
                    accessibilityLabel={col.label}
                    // The order is read after the name, so the button keeps the column's name.
                    accessibilityHint={sorts && state.sort.key === col.key ? state.sort.order === "asc" ? m.ascending : m.descending : undefined}
                    {...(sorts ? { onPress: () => state.sortColumn(col) } : null)}
                    style={{
                      width: width(col),
                      minHeight: tokens.native.minimumTouchTarget,
                      paddingVertical: geometry.headerPadding.y,
                      ...sides(geometry.headerPadding.x, firstColumn(visible.indexOf(col)), lastColumn(visible.indexOf(col))),
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent:
                        col.align === "right"
                          ? "flex-end"
                          : col.align === "center"
                          ? "center"
                          : "flex-start",
                      gap: tokens.dimension.value4,
                    }}
                  >
                    <KText
                      style={{
                        ...typeStyle('controlSmall'),
                        color: col.sortable && sortable !== false && state.sort.key === col.key ? colors.text : colors.textSecondary,
                        ...(col.sortable && sortable !== false && state.sort.key === col.key ? { fontWeight: typeStyle("sectionTitle").fontWeight } : null),
                      }}
                    >
                      {col.label}
                    </KText>
                    {/* Like Web: a sortable column shows a quiet two-way arrow until it is the sorted one. */}
                    {col.sortable && sortable !== false && (
                      <KjunIcon
                        name={
                          state.sort.key !== col.key
                            ? "arrows-sort"
                            : state.sort.order === "asc"
                            ? "sort-ascending"
                            : "sort-descending"
                        }
                        size={state.sort.key === col.key ? tokens.table.sortedIconSize : tokens.table.sortIconSize}
                        color={state.sort.key === col.key ? colors.text : colors.textTertiary}
                      />
                    )}
                  </Header>
    );
  };
  const body = () => [
    ...(groups ? groups.flatMap((group) => {
      const open = !collapsed.includes(group.key), label = groupLabel(group);
      return [
        <View key={"group:" + group.key} role="heading" style={{ flexDirection: "row", alignItems: "center", gap: geometry.groupGap, width: totalWidth,
          paddingVertical: geometry.groupPadding.y, ...sides(geometry.groupPadding.x, true, true), backgroundColor: colors.secondary }}>
          <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"}
            ariaLabel={m.toggleGroup(tableGroupName(label, group), open)} accessibilityState={{ expanded: open }} {...disclosureButton} onPress={() => toggleGroup(group.key)} />
          {content(label, { ...typeStyle("control"), color: colors.text })}
          <KText style={{ ...typeStyle("body"), color: colors.textTertiary }}>{m.groupCount(group.rows.length)}</KText>
        </View>,
        ...(open ? group.rows.map((row) => bodyRow(row, state.rowIndex(row))) : []),
        group.rows.length > 1 ? summaryRow(group.rows, "subtotal", "subtotal:" + group.key) : null,
      ];
    }) : state.rows.map(bodyRow)),
    summaryRow(state.rows, "total", "total"),
  ];
  return (
        <View style={{ position: "relative", minWidth: 0, opacity: skeletonHidden || unmeasured ? 0 : undefined }} aria-hidden={skeletonHidden || undefined}>
          <ScrollView horizontal style={{ maxHeight }} scrollEventThrottle={16}
            onLayout={(event) => { const viewport = event.nativeEvent.layout.width; setScroll((previous) => ({ ...previous, viewport })); }}
            onScroll={(event) => { const x = event.nativeEvent.contentOffset.x; setScroll((previous) => ({ ...previous, x })); }}>
            <ScrollView
              stickyHeaderIndices={stickyHeader ? [0] : undefined}
              style={{ width: totalWidth, maxHeight }}
              scrollEventThrottle={16}
              onScroll={stickyHeader ? (event) => setStuck(event.nativeEvent.contentOffset.y > 0) : undefined}
            >
              {/* Like Web: once rows pass under the sticky header, its line turns strong instead of casting a shadow. */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colors.tableHeaderBg,
                  borderBottomWidth: tokens.border.defaultWidth,
                  borderBottomColor: stickyHeader && stuck ? colors.borderStrong : colors.border,
                }}
              >
                {selectable && (
                  // Placed like the rows' boxes: centred in the same column width, on the header's middle line.
                  <View style={{ width: geometry.actionColumnWidth, alignItems: "center", justifyContent: "center" }}>
                    {/* The box pins itself to its start edge, so a wrapper as wide as the box is what the column centres. */}
                    <View><KjunCheckbox
                      size="sm"
                      value={state.all}
                      indeterminate={state.some}
                      // Like Web: the checkbox's mixed state says some are selected.
                      ariaLabel={m.selectAll}
                      disabled={initialLoading || !state.selectableCount}
                      onValueChange={state.toggleAll}
                    /></View>
                  </View>
                )}
                {headerRows ? headerRows.map((cell) => cell.kind === "column" ? columnHeader(cell.column) : (
                  <View key={cell.key} accessibilityRole="header" style={{ width: cell.columns.reduce((sum, col) => sum + width(col), 0) }}>
                    <View style={{ paddingVertical: geometry.headerPadding.y, ...sides(geometry.headerPadding.x, firstColumn(visible.indexOf(cell.columns[0])), lastColumn(visible.indexOf(cell.columns[cell.columns.length - 1]))), alignItems: "center",
                      borderBottomWidth: tokens.border.defaultWidth, borderBottomColor: colors.border }}>
                      <KText style={{ ...typeStyle("controlSmall"), color: colors.textSecondary }}>{cell.label}</KText>
                    </View>
                    <View style={{ flexDirection: "row" }}>{cell.columns.map((col) => columnHeader(col))}</View>
                  </View>
                )) : visible.map((col) => columnHeader(col))}
                {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
                {mover && <View style={{ width: moverWidth }} />}
              </View>
              {initialLoading ? (
                Array.from({ length: skeletonRows }, (_, i) => (
                  <View key={i} aria-hidden style={{ flexDirection: "row" }}>
                    {/* Like Web: the selection column shows a box-sized block while rows load. */}
                    {selectable && (
                      <View style={{ width: geometry.actionColumnWidth, alignItems: "center", justifyContent: "center" }}>
                        <KjunSkeleton type="block" height={geometry.selectionSize} width={geometry.selectionSize} />
                      </View>
                    )}
                    {visible.map((col, c) => (
                      <View
                        key={col.key}
                        style={{
                          width: width(col),
                          paddingVertical: cellPadding.y,
                          ...sides(cellPadding.x, firstColumn(c), lastColumn(c)),
                        }}
                      >
                        <KjunSkeleton
                          type="line"
                          width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"}
                        />
                      </View>
                    ))}
                    {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
                    {mover && <View style={{ width: moverWidth }} />}
                  </View>
                ))
              ) : !state.rows.length ? (
                <View style={{ paddingVertical: geometry.emptyPadding.y, ...sides(geometry.emptyPadding.x, true, true), alignItems: "center" }}>
                  {content(emptyContent || emptyText, {
                    color: colors.textSecondary,
                  })}
                </View>
              ) : (
                body()
              )}
            </ScrollView>
          </ScrollView>
          {fade && (
            <View style={{ pointerEvents: "none", position: "absolute", top: 0, right: 0, bottom: 0, width: tokens.extensions.scrollFade.width }}>
              <Svg width="100%" height="100%">
                <Defs><LinearGradient id={fadeId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0" stopColor={colors.surface} stopOpacity={0} />
                  <Stop offset="1" stopColor={colors.surface} stopOpacity={1} />
                </LinearGradient></Defs>
                <Rect width="100%" height="100%" fill={`url(#${fadeId})`} />
              </Svg>
            </View>
          )}
        </View>
  );
}
