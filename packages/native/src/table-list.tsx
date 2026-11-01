import { tokens } from "@kjun-ui/tokens";
import { View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunSkeleton } from "./display";
import { content } from "./internal";
import { useKjunStyles } from "./provider";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";
/** Like Web responsive="list": a title over one meta line with the value and badges at the end, no header row. */
export function TableList<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout }: TableCardsProps<Row>) {
  const { colors } = useKjunStyles();
  const geometry = tokens.table.list;
  const { title, listMeta, listValue, badges } = layout;
  return (
    <View role="list" style={{ opacity: skeletonHidden ? 0 : undefined }} aria-hidden={skeletonHidden || undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => (
            <View key={i} style={{ paddingVertical: geometry.paddingY, paddingHorizontal: geometry.paddingX }}><KjunSkeleton type="text" rows={2} /></View>
          ))
        : state.rows.map((row, i) => (
            <View key={state.key(row, i)}>
              <Pressable
                accessible={false}
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
          ))}
      {!initialLoading && !state.rows.length && (
        <View style={{ padding: tokens.extensions.tableCard.emptyPadding, alignItems: "center" }}>
          {content(emptyContent || emptyText, { color: colors.textSecondary })}
        </View>
      )}
    </View>
  );
}
