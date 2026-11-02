import { tokens } from "@kjun-ui/tokens";
import { tableRowLabel } from "../../../shared/package-runtime/table-model";
import { View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunSkeleton } from "./display";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import type { TableCardsProps, TableTotal } from "../../../shared/package-runtime/table-presentation";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
/** Like Web responsive="list": a title over one meta line with the value and badges at the end, no header row. */
export function TableList<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, totals }: TableCardsProps<Row>) {
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
          ))}
      {!initialLoading && !state.rows.length && (
        <View style={{ padding: tokens.extensions.tableCard.emptyPadding, alignItems: "center" }}>
          {content(emptyContent || emptyText, { color: colors.textSecondary })}
        </View>
      )}
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </View>
  );
}

/** Like Web: the summary on narrow layouts as one closing block under a strong text-colored rule. */
export function TableTotals({ totals }: { totals?: TableTotal[] }) {
  const m = useKjunMessages(), { colors } = useKjunStyles(), geometry = tokens.table.list;
  return totals?.length ? (
    <View role="group" accessibilityLabel={m.tableTotal} style={{ gap: geometry.metaGap, marginTop: geometry.metaGap, paddingVertical: geometry.paddingY,
      paddingHorizontal: geometry.paddingX, borderTopWidth: tokens.border.controlWidth, borderTopColor: colors.text }}>
      <KText style={{ ...typeStyle("control"), color: colors.text }}>{m.tableTotal}</KText>
      {totals.map((total) => (
        <View key={total.key} style={{ flexDirection: "row", justifyContent: "space-between", gap: geometry.gap }}>
          <KText style={{ ...typeStyle("body"), color: colors.textSecondary }}>{total.label}</KText>
          {content(total.value, { ...typeStyle("control"), color: colors.text, fontVariant: ["tabular-nums"] })}
        </View>
      ))}
    </View>
  ) : null;
}
