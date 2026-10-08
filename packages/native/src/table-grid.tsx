import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Fragment, useId, useState } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { TableGridProps } from "../../../shared/package-runtime/table-presentation";
import { DsIcon } from "./button";
import { DsSkeleton } from "./display";
import { ScrollView, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsCheckbox } from "./controls";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import type { TableColumn } from "./table-model";
export function TableGrid<Row extends object>({ initialLoading, skeletonRows, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, visible, maxHeight, stickyHeader, sortable, compact, striped, hoverable }: TableGridProps<Row, number>) {
  const { colors } = useKjunStyles();
  const geometry = tokens.table;
  // Like Web's scroll hint: when columns overflow, the trailing edge fades until the end is reached.
  const [scroll, setScroll] = useState({ viewport: 0, x: 0 }), fadeId = "kjun-table-fade-" + useId().replace(/[^a-z0-9]/gi, "");
  const cellPadding = geometry.cellPadding[compact ? "compact" : "regular"];
  const width = (col: TableColumn<Row>) =>
    typeof col.width === "number"
      ? col.width
      : typeof col.width === "string" && /^\d+(px)?$/.test(col.width)
      ? parseFloat(col.width)
      : geometry.columnWidth;
  const totalWidth =
    visible.reduce((sum, col) => sum + width(col), 0) +
    (selectable ? geometry.actionColumnWidth : 0) +
    (expandable ? geometry.actionColumnWidth : 0);
  const fade = totalWidth - scroll.viewport - scroll.x > 1;
  return (
        <View style={{ position: "relative", minWidth: 0 }}>
          <ScrollView horizontal style={{ maxHeight }} scrollEventThrottle={16}
            onLayout={(event) => { const viewport = event.nativeEvent.layout.width; setScroll((previous) => ({ ...previous, viewport })); }}
            onScroll={(event) => { const x = event.nativeEvent.contentOffset.x; setScroll((previous) => ({ ...previous, x })); }}>
            <ScrollView
              stickyHeaderIndices={stickyHeader ? [0] : undefined}
              style={{ width: totalWidth, maxHeight }}
            >
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colors.tableHeaderBg,
                  borderBottomWidth: tokens.border.defaultWidth,
                  borderBottomColor: colors.border,
                }}
              >
                {selectable && (
                  <View style={{ width: geometry.actionColumnWidth, alignItems: "center" }}>
                    <DsCheckbox
                      size="sm"
                      value={state.all}
                      ariaLabel={
                        state.some ? "전체 선택 (일부 선택됨)" : "전체 선택"
                      }
                      onValueChange={state.toggleAll}
                    />
                  </View>
                )}
                {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
                {visible.map((col) => (
                  <Pressable
                    key={col.key}
                    accessibilityRole="button"
                    accessibilityLabel={col.label}
                    accessibilityHint={
                      col.sortable && sortable !== false && state.sort.key === col.key
                        ? state.sort.order === "asc"
                          ? "오름차순"
                          : "내림차순"
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
                        color: colors.textSecondary,
                      }}
                    >
                      {col.label}
                    </KText>
                    {sortable !== false && state.sort.key === col.key && (
                      <DsIcon
                        name={
                          state.sort.order === "asc"
                            ? "sort-ascending"
                            : "sort-descending"
                        }
                        size={tokens.table.sortIconSize}
                        color={colors.text}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
              {initialLoading ? (
                Array.from({ length: skeletonRows }, (_, i) => (
                  <View key={i} style={{ flexDirection: "row" }}>
                    {selectable && <View style={{ width: geometry.actionColumnWidth }} />}
                    {expandable && <View style={{ width: geometry.actionColumnWidth }} />}
                    {visible.map((col) => (
                      <View
                        key={col.key}
                        style={{
                          width: width(col),
                          paddingVertical: cellPadding.y,
                          paddingHorizontal: cellPadding.x,
                        }}
                      >
                        <DsSkeleton
                          type="block"
                          height={geometry.skeletonHeight}
                          width={col.key === "actions" ? tokens.table.actionColumnWidth : "75%"}
                        />
                      </View>
                    ))}
                  </View>
                ))
              ) : !state.rows.length ? (
                <View style={{ paddingVertical: geometry.emptyPadding.y, paddingHorizontal: geometry.emptyPadding.x, alignItems: "center" }}>
                  {content(emptyContent || emptyText, {
                    color: colors.textSecondary,
                  })}
                </View>
              ) : (
                state.rows.map((row, i) => (
                  <Fragment key={state.key(row, i)}>
                    <Pressable
                      accessible={false}
                      onPress={() => onRowClick?.(row, i)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        borderBottomWidth: tokens.border.defaultWidth,
                        borderBottomColor: colors.border,
                        backgroundColor:
                          pressed && hoverable
                            ? colors.tableRowHover
                            : striped && i % 2
                            ? colors.secondary
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
                ))
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
