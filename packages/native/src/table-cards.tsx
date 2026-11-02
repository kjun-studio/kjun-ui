import { tokens } from "@kjun-ui/tokens";
import { Fragment, type ReactNode } from "react";
import { View } from "react-native";
import { typeStyle } from "./typography";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunSkeleton } from "./display";
import { TableTotals } from "./table-list";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";

const card = tokens.extensions.tableCard;
const titleLine = tokens.typography.cardTitle.lineHeightPx;
/** Like Web: "stacked" field grid, "rows" label-value lines, "tiles" two small cards a row; groups open with a header line. */
export function TableCards<Row extends object>({ initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout, totals, groups, groupLabel }: TableCardsProps<Row>) {
  const { colors } = useKjunStyles();
  const m = useKjunMessages();
  const { title, subtitle, highlight, badges, inline, sections, actions, columnsForSection, cardLayout, tiles } = layout;
  const footerActions = !tiles && actions && !actions.inlineInCard ? actions : null;
  const frame = { padding: tiles ? card.tilePadding : card.padding, borderWidth: tokens.border.defaultWidth, borderColor: colors.border, borderRadius: card.radius };
  const badgeList = (row: Row, i: number) => badges.length ? (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: card.fieldGap }}>
      {badges.map((col) => <View key={col.key}>{cell(col, row, i)}</View>)}
    </View>
  ) : null;
  const label = (text: ReactNode) => <KText style={{ ...typeStyle("meta"), color: colors.textTertiary }}>{text}</KText>;
  const tile = (row: Row, i: number) => (
    <>
      {(selectable || badges.length > 0) && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: card.gap, marginBottom: card.gap }}>
          {selectable && checkbox(row, i)}
          {badgeList(row, i)}
        </View>
      )}
      {!!title && cell(title, row, i, "tileTitle")}
      {!!subtitle && <View style={{ marginTop: card.valueGap }}>{cell(subtitle, row, i, "cardSubtitle")}</View>}
      {!!highlight && <View style={{ marginTop: card.sectionGap }}>{cell(highlight, row, i, "tileHighlight")}</View>}
    </>
  );
  const stacked = (row: Row, i: number) => (
    <>
      {/* The selection box sits on the title line and the subtitle starts under the title, not under the box. */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: card.gap }}>
        {selectable && <View style={{ minHeight: titleLine, justifyContent: "center" }}>{checkbox(row, i)}</View>}
        <View style={{ flex: 1, minWidth: 0 }}>
          {!!title && cell(title, row, i, "title")}
          {!!subtitle && <View style={{ marginTop: card.valueGap }}>{cell(subtitle, row, i, "cardSubtitle")}</View>}
        </View>
        {badges.length > 0 && <View style={{ minHeight: titleLine, justifyContent: "center" }}>{badgeList(row, i)}</View>}
        {inline.length > 0 && (
          <View style={{ flexDirection: "row", gap: card.fieldGap }}>
            {inline.map((col) => <View key={col.key}>{cell(col, row, i)}</View>)}
          </View>
        )}
      </View>
      {!!highlight && (
        <View style={{ marginTop: card.sectionGap, gap: card.valueGap }}>
          {label(highlight.label)}
          {cell(highlight, row, i, "cardHighlight")}
        </View>
      )}
      {/* Sections carry no label or rule in a card; a gap separates them. */}
      {sections.map((section, index) => {
        const cols = columnsForSection(row, section);
        const rows = cardLayout === "rows";
        return cols.length ? (
          <View key={section.key || index} accessibilityLabel={section.label || undefined}
            style={{ marginTop: card.sectionGap, flexDirection: rows ? "column" : "row", flexWrap: rows ? "nowrap" : "wrap", gap: rows ? card.metricGap : card.sectionGap }}>
            {cols.map((col) => rows ? (
              <View key={col.key} style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: card.gap }}>
                {label(col.label)}
                <View style={{ flexShrink: 1, minWidth: 0 }}>{cell(col, row, i, "cardRowValue")}</View>
              </View>
            ) : (
              <View key={col.key} style={{
                flexBasis: col.fullWidthInCard || section.layout === "stack" ? "100%" : section.layout === "metrics" ? "30%" : "45%",
                flexGrow: 1, minWidth: 0, gap: card.valueGap }}>
                <KText style={{ ...typeStyle("meta"), color: colors.textTertiary, textAlign: section.labelAlign }}>{col.label}</KText>
                {cell(col, row, i, "cardValue")}
              </View>
            ))}
          </View>
        ) : null;
      })}
      {expandable || footerActions ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: card.gap,
          marginTop: card.footerGap, paddingTop: card.footerGap, borderTopWidth: tokens.border.defaultWidth, borderTopColor: colors.divider }}>
          {expandable ? expand(row, i) : <View />}
          {/* The wrapper holds the end edge; a KjunButton's own flex-start would otherwise pull it left. */}
          {footerActions ? <View style={{ alignSelf: "center" }}>{cell(footerActions, row, i)}</View> : null}
        </View>
      ) : null}
      {expandable && state.expanded.includes(state.key(row, i)) && (
        <View style={{ marginTop: card.sectionGap, paddingVertical: tokens.table.expandedPadding.y, paddingHorizontal: tokens.table.expandedPadding.x,
          borderRadius: tokens.radius.radius12, backgroundColor: colors.secondary }}>
          {content(renderExpand?.(row, i))}
        </View>
      )}
    </>
  );
  const item = (row: Row, i: number) => (
    <Pressable
      key={state.key(row, i)}
      accessible={false}
      onPress={() => onRowClick?.(row, i)}
      style={({ pressed }) => ({ ...frame, backgroundColor: pressed ? colors.hover : colors.surface, ...(tiles ? { flex: 1, minWidth: 0 } : null) })}
    >
      {tiles ? tile(row, i) : stacked(row, i)}
    </Pressable>
  );
  // Tiles go two to a row; an odd last tile keeps its half beside an empty slot.
  const list = (rows: { row: Row; i: number }[]) => tiles
    ? <>{rows.filter((_, n) => n % 2 === 0).map((_, n) => (
        <View key={n} style={{ flexDirection: "row", gap: card.cardGap }}>
          {rows.slice(n * 2, n * 2 + 2).map(({ row, i }) => item(row, i))}
          {rows.length === n * 2 + 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}</>
    : <>{rows.map(({ row, i }) => item(row, i))}</>;
  const grouped = !!groups && !initialLoading && state.rows.length > 0;
  return (
    <View style={{ gap: card.cardGap, padding: card.listPadding, opacity: skeletonHidden ? 0 : undefined }}
      aria-hidden={skeletonHidden || undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => (
            // Like Web: the card's own frame, header and fields, so loading never nests a card inside the card.
            <View key={i} style={{ ...frame, backgroundColor: colors.surface, gap: card.sectionGap }}>
              <KjunSkeleton type="line" role={tiles ? "control" : "cardTitle"} width={card.titleSkeletonWidth} />
              {tiles ? <KjunSkeleton type="line" role="control" width="50%" /> : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: card.sectionGap }}>
                  {[0, 1, 2, 3].map((field) => (
                    <View key={field} style={{ width: "50%", gap: card.valueGap }}>
                      <KjunSkeleton type="line" role="caption" width="50%" />
                      <KjunSkeleton type="line" role="body" width={field % 2 ? "60%" : "75%"} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        : grouped ? groups!.map((group) => (
            <Fragment key={group.key}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: tokens.dimension.value4,
                paddingTop: tokens.dimension.value8, paddingHorizontal: tokens.dimension.value4 }} accessibilityRole="header">
                {content(groupLabel?.(group), { ...typeStyle("caption"), fontWeight: typeStyle("control").fontWeight, color: colors.textSecondary })}
                <KText style={{ ...typeStyle("caption"), color: colors.textTertiary }}>{m.groupCount(group.rows.length)}</KText>
              </View>
              {list(group.rows.map((row) => ({ row, i: state.rowIndex(row) })))}
            </Fragment>
          ))
        : list(state.rows.map((row, i) => ({ row, i })))}
      {!initialLoading && !state.rows.length && (
        <View style={{ padding: card.emptyPadding, alignItems: "center" }}>
          {content(emptyContent || emptyText, { color: colors.textTertiary })}
        </View>
      )}
      {!initialLoading && state.rows.length > 0 && <TableTotals totals={totals} />}
    </View>
  );
}
