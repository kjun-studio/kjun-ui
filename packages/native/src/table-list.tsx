import { tokens } from "@kjun-ui/tokens";
import { tableRowLabel } from "../../../shared/package-runtime/table-model";
import { View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunSkeleton } from "./display";
import { content } from "./internal";
import { useKjunStyles } from "./provider";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";
import { TableTotals, useTableGroups } from "./table-narrow-parts";
/** Like Web responsive="list": a title over one meta line with the value and badges at the end, no header row. */
export function TableList<Row extends object>(props: TableCardsProps<Row>) {
  const { initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, expandable, expand, renderExpand,
    emptyContent, emptyText, layout, totals, groups } = props;
  const { colors } = useKjunStyles();
  const geometry = tokens.table.list;
  const { title, listMeta, listValue, badges } = layout;
  const item = (row: Row, i: number) => (
    <View key={state.key(row, i)} role="listitem">
      <Pressable
        // A pressable list row is one button named by its title, as on the web.
        accessible={!!onRowClick}
        accessibilityRole={onRowClick ? "button" : undefined}
        accessibilityLabel={onRowClick ? String(tableRowLabel(row, title?.key, i)) : undefined}
        onPress={() => onRowClick?.(row, i)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: geometry.gap,
          paddingVertical: geometry.paddingY,
          paddingHorizontal: geometry.paddingX,
          borderRadius: geometry.radius,
          backgroundColor: state.selectedRow(row) ? colors.selectedBg : pressed && onRowClick ? colors.hover : undefined,
        })}
      >
        {selectable && checkbox(row, i)}
        <View style={{ flex: 1, minWidth: 0, gap: geometry.metaGap }}>
          {title ? cell(title, row, i, "listTitle") : null}
          {listMeta ? cell(listMeta, row, i, "listMeta") : null}
        </View>
        {(listValue || badges.length > 0) && (
          <View style={{ alignItems: "flex-end", gap: geometry.metaGap, flexShrink: 0 }}>
            {listValue ? cell(listValue, row, i, "listValue") : null}
            {badges.map((col) => <View key={col.key}>{content(cell(col, row, i))}</View>)}
          </View>
        )}
        {expandable && expand(row, i)}
      </Pressable>
      {expandable && state.expanded.includes(state.key(row, i)) && (
        <View style={{ paddingVertical: tokens.table.expandedPadding.y, paddingHorizontal: tokens.table.expandedPadding.x, borderRadius: geometry.radius, backgroundColor: colors.secondary }}>
          {content(renderExpand?.(row, i))}
        </View>
      )}
    </View>
  );
  const groupSections = useTableGroups(props, geometry.paddingX, (items) => <View role="list">{items.map(({ row, i }) => item(row, i))}</View>);
  const grouped = !!groups && !initialLoading && state.rows.length > 0;
  return (
    <View role={grouped ? undefined : "list"} style={{ opacity: skeletonHidden ? 0 : undefined }} aria-hidden={skeletonHidden || undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => (
            // Like Web: a title over one meta line with a value at the end, like the loaded row.
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: geometry.gap, paddingVertical: geometry.paddingY, paddingHorizontal: geometry.paddingX }}>
              <View style={{ flex: 1, minWidth: 0, gap: geometry.metaGap }}>
                <KjunSkeleton type="line" role="control" width={i % 2 ? "55%" : "40%"} />
                <KjunSkeleton type="line" role="caption" width="30%" />
              </View>
              <KjunSkeleton type="line" role="control" width={tokens.extensions.skeleton.detailWidth} />
            </View>
          ))
        : grouped ? groupSections(groups!) : state.rows.map((row, i) => item(row, i))}
      {!initialLoading && !state.rows.length && (
        <View style={{ padding: tokens.extensions.tableCard.emptyPadding, alignItems: "center" }}>
          {content(emptyContent || emptyText, { color: colors.textSecondary })}
        </View>
      )}
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </View>
  );
}
