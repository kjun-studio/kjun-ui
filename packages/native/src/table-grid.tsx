import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Fragment, useId, useState } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { TableGridProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton, KjunIcon } from "./button";
import { KjunSkeleton } from "./display";
import { ScrollView, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunCheckbox } from "./controls";
import { KText, content } from "./internal";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { useKjunStyles } from "./provider";
import type { TableColumn } from "./table-model";
export function TableGrid<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, sortable, compact, striped, hoverable, groups, collapsed, toggleGroup, groupLabel, summary }: TableGridProps<Row, number>) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const geometry = tokens.table;
  // Like Web's scroll hint: when columns overflow, the trailing edge fades until the end is reached.
  const [scroll, setScroll] = useState({ viewport: 0, x: 0 }), [stuck, setStuck] = useState(false), fadeId = "kjun-table-fade-" + useId().replace(/[^a-z0-9]/gi, "");
  const cellPadding = geometry.cellPadding[compact ? "compact" : "regular"];
  const naturalWidth = (col: TableColumn<Row>) =>
    typeof col.width === "number"
      ? col.width
      : typeof col.width === "string" && /^\d+(px)?$/.test(col.width)
      ? parseFloat(col.width)
      : geometry.columnWidth;
  const utilityWidth = (selectable ? geometry.actionColumnWidth : 0) + (expandable ? geometry.actionColumnWidth : 0);
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
  const bodyRow = (row: Row, i: number) => (
    <Fragment key={state.key(row, i)}>
      <Pressable
        accessible={false}
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
        {visible.map((col) => (
          <View
            key={col.key}
            style={{
              width: width(col),
              paddingVertical: cellPadding.y,
              paddingHorizontal: cellPadding.x,
              justifyContent: "center",
            }}
          >
            {cell(col, row, i)}
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
      </Pressable>
      {expandable &&
        state.expanded.includes(state.key(row, i)) && (
          <View
            style={{
              paddingVertical: geometry.expandedPadding.y,
              paddingHorizontal: geometry.expandedPadding.x,
              backgroundColor: colors.secondary,
            }}
          >
            {content(renderExpand?.(row, i))}
          </View>
        )}
    </Fragment>
  );
  // Like Web: subtotals read quieter than rows, and the total closes the table under a strong text-colored rule.
  const summaryRow = (rows: Row[], kind: "subtotal" | "total", key: string) => summary && (
    <View key={key} style={{ flexDirection: "row", ...(kind === "total" ? { borderTopWidth: tokens.border.controlWidth, borderTopColor: colors.text } : null) }}>
      {selectable && <View style={{ width: geometry.actionColumnWidth }} />}
      {visible.map((col, c) => (
        <View key={col.key} style={{ width: width(col), paddingVertical: cellPadding.y, paddingHorizontal: cellPadding.x, justifyContent: "center",
          alignItems: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start" }}>
          {content(summary(col, rows) ?? (c === 0 ? (kind === "total" ? m.tableTotal : m.tableSubtotal) : null),
            kind === "total" ? { ...typeStyle("control"), color: colors.text } : { ...typeStyle("caption"), color: colors.textSecondary })}
        </View>
      ))}
      {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
    </View>
  );
  const body = () => [
    ...(groups ? groups.flatMap((group) => {
      const open = !collapsed.includes(group.key);
      return [
        <View key={"group:" + group.key} role="heading" style={{ flexDirection: "row", alignItems: "center", gap: geometry.groupGap, width: totalWidth,
          paddingVertical: geometry.groupPadding.y, paddingHorizontal: geometry.groupPadding.x, backgroundColor: colors.secondary }}>
          <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"}
            ariaLabel={m.toggleGroup(String(group.value ?? ""), open)} onPress={() => toggleGroup(group.key)} />
          {content(groupLabel(group), { ...typeStyle("control"), color: colors.text })}
          <KText style={{ ...typeStyle("body"), color: colors.textTertiary }}>{m.groupCount(group.rows.length)}</KText>
        </View>,
        ...(open ? group.rows.map((row) => bodyRow(row, state.rows.indexOf(row))) : []),
        group.rows.length > 1 ? summaryRow(group.rows, "subtotal", "subtotal:" + group.key) : null,
      ];
    }) : state.rows.map(bodyRow)),
    summaryRow(state.rows, "total", "total"),
  ];
  return (
        <View style={{ position: "relative", minWidth: 0, opacity: skeletonHidden ? 0 : undefined }} aria-hidden={skeletonHidden || undefined}>
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
                  <View style={{ width: geometry.actionColumnWidth, alignItems: "center" }}>
                    <KjunCheckbox
                      size="sm"
                      value={state.all}
                      indeterminate={state.some}
                      ariaLabel={
                        state.some ? m.selectAllPartial : m.selectAll
                      }
                      onValueChange={state.toggleAll}
                    />
                  </View>
                )}
                {visible.map((col) => (
                  // Only sortable columns are buttons; other headers read as their plain label.
                  <Pressable
                    key={col.key}
                    accessible={!!col.sortable && sortable !== false}
                    accessibilityRole={col.sortable && sortable !== false ? "button" : undefined}
                    accessibilityLabel={col.sortable && sortable !== false ? col.label : undefined}
                    accessibilityHint={
                      col.sortable && sortable !== false && state.sort.key === col.key
                        ? state.sort.order === "asc"
                          ? m.ascending
                          : m.descending
                        : undefined
                    }
                    disabled={!col.sortable || sortable === false}
                    onPress={() => state.sortColumn(col)}
                    style={{
                      width: width(col),
                      minHeight: tokens.native.minimumTouchTarget,
                      paddingVertical: geometry.headerPadding.y,
                      paddingHorizontal: geometry.headerPadding.x,
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
                  </Pressable>
                ))}
                {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
              </View>
              {initialLoading ? (
                Array.from({ length: skeletonRows }, (_, i) => (
                  <View key={i} style={{ flexDirection: "row" }}>
                    {selectable && <View style={{ width: geometry.actionColumnWidth }} />}
                    {visible.map((col) => (
                      <View
                        key={col.key}
                        style={{
                          width: width(col),
                          paddingVertical: cellPadding.y,
                          paddingHorizontal: cellPadding.x,
                        }}
                      >
                        <KjunSkeleton
                          type="block"
                          height={geometry.skeletonHeight}
                          width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"}
                        />
                      </View>
                    ))}
                    {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
                  </View>
                ))
              ) : !state.rows.length ? (
                <View style={{ paddingVertical: geometry.emptyPadding.y, paddingHorizontal: geometry.emptyPadding.x, alignItems: "center" }}>
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
            <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: tokens.extensions.scrollFade.width }}>
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
