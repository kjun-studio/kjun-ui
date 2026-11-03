import { tokens } from "@kjun-ui/tokens";
import { Fragment, type ReactNode } from "react";
import { View } from "react-native";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
import { tableGroupName, type TableCardsProps, type TableTotal } from "../../../shared/package-runtime/table-presentation";
import type { TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunButton } from "./button";

/** Like Web: each group opens with a header line (name, count and, with two or more rows, its subtotals) above its rows. */
export function useTableGroups<Row extends object>({ groupLabel, groupTotals, state, collapsed, toggleGroup }: Pick<TableCardsProps<Row>, "groupLabel" | "groupTotals" | "state" | "collapsed" | "toggleGroup">,
  paddingHorizontal: number, rows: (items: { row: Row; i: number }[]) => ReactNode) {
  const m = useKjunMessages(), { colors } = useKjunStyles();
  return (list: TableRowGroup<Row>[]) => list.map((group) => {
    const label = groupLabel?.(group), totals = group.rows.length > 1 ? groupTotals?.(group.rows) ?? [] : [];
    const open = !collapsed?.includes(group.key);
    const caption = { ...typeStyle("caption"), color: colors.textSecondary };
    return (
      <Fragment key={group.key}>
        <View role="group" accessibilityLabel={tableGroupName(label, group) + " " + m.groupCount(group.rows.length)}
          style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4, paddingTop: tokens.dimension.value8, paddingHorizontal }}>
          <KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"}
            ariaLabel={m.toggleGroup(String(group.value ?? ""), open)} accessibilityState={{ expanded: open }} onPress={() => toggleGroup?.(group.key)} />
          {content(label, { ...caption, fontWeight: typeStyle("control").fontWeight })}
          <KText style={{ ...typeStyle("caption"), color: colors.textTertiary }}>{m.groupCount(group.rows.length)}</KText>
          {totals.length > 0 && (
            <View style={{ marginLeft: "auto", flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: tokens.dimension.value4 }}>
              {totals.map((total, n) => (
                <View key={total.key} style={{ flexDirection: "row", gap: tokens.dimension.value4 }}>
                  {n > 0 && <KText style={caption}>·</KText>}
                  {totals.length > 1 && <KText style={caption}>{total.label}</KText>}
                  {content(total.value, { ...caption, fontVariant: ["tabular-nums"] })}
                </View>
              ))}
            </View>
          )}
        </View>
        {open && rows(group.rows.map((row) => ({ row, i: state.rowIndex(row) })))}
      </Fragment>
    );
  });
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
