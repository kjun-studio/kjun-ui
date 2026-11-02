import { tokens } from "@kjun-ui/tokens";
import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { typeStyle } from "./typography";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunSkeleton } from "./display";
import { TableTotals, useTableGroups } from "./table-narrow-parts";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { tableRowLabel } from "../../../shared/package-runtime/table-model";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";

const card = tokens.extensions.tableCard;
const titleLine = tokens.typography.cardTitle.lineHeightPx;
/** Like Web: "stacked" field grid, "rows" label-value lines, "tiles" small cards (two a row, more where each keeps tileMinWidth). */
export function TableCards<Row extends object>(props: TableCardsProps<Row>) {
  const { initialLoading, skeletonRows, skeletonHidden, state, onRowClick, selectable, checkbox, cell, cellText, expandable, expand, renderExpand,
    emptyContent, emptyText, layout, totals, groups } = props;
  const { colors } = useKjunStyles();
  const { title, subtitle, highlight, badges, inline, sections, columnsForSection, tiles, footerActions, cardFooter, cardBody } = layout;
  // Like Web's auto-fill grid: as many tiles a row as keep tileMinWidth, never fewer than two.
  const [width, setWidth] = useState(0);
  const perRow = Math.max(2, Math.floor((width - card.listPadding * 2 + card.cardGap) / (card.tileMinWidth + card.cardGap)) || 2);
  const frame = { padding: tiles ? card.tilePadding : card.padding, borderWidth: tokens.border.defaultWidth, borderColor: colors.border, borderRadius: card.radius };
  const badgeList = (row: Row, i: number) => badges.length ? (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: card.fieldGap }}>
      {badges.map((col) => <View key={col.key}>{cell(col, row, i)}</View>)}
    </View>
  ) : null;
  const label = (text: ReactNode) => <KText style={{ ...typeStyle("meta"), color: colors.textTertiary }}>{text}</KText>;
  // The card holds checkboxes and buttons, so it cannot be one accessible button; with onRowClick its title is that button.
  const heading = (row: Row, i: number, role: "title" | "tileTitle") => !title ? null : onRowClick ? (
    <Pressable accessibilityRole="button" accessibilityLabel={String(tableRowLabel(row, title.key, i))} onPress={() => onRowClick(row, i)}>
      {cell(title, row, i, role)}
    </Pressable>
  ) : cell(title, row, i, role);
  const tile = (row: Row, i: number) => {
    // The tile draws no label for its highlight; screen readers hear the label with the value.
    const text = highlight ? cellText?.(highlight, row, i) : undefined;
    return (
      <>
        {selectable || badges.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: card.gap, marginBottom: card.gap }}>
            {selectable ? checkbox(row, i) : null}
            {badgeList(row, i)}
          </View>
        ) : null}
        {heading(row, i, "tileTitle")}
        {subtitle ? <View style={{ marginTop: card.valueGap }}>{cell(subtitle, row, i, "cardSubtitle")}</View> : null}
        {highlight ? (
          <View style={{ marginTop: card.sectionGap }} accessible={text != null} accessibilityLabel={text != null ? highlight.label + " " + text : undefined}>
            {cell(highlight, row, i, "tileHighlight")}
          </View>
        ) : null}
      </>
    );
  };
  const stacked = (row: Row, i: number) => (
    <>
      {/* The selection box sits on the title line and the subtitle starts under the title, not under the box. */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: card.gap }}>
        {selectable ? <View style={{ minHeight: titleLine, justifyContent: "center" }}>{checkbox(row, i)}</View> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {heading(row, i, "title")}
          {subtitle ? <View style={{ marginTop: card.valueGap }}>{cell(subtitle, row, i, "cardSubtitle")}</View> : null}
        </View>
        {badges.length > 0 ? <View style={{ minHeight: titleLine, justifyContent: "center" }}>{badgeList(row, i)}</View> : null}
        {inline.length > 0 ? (
          <View style={{ flexDirection: "row", gap: card.fieldGap }}>
            {inline.map((col) => <View key={col.key}>{cell(col, row, i)}</View>)}
          </View>
        ) : null}
      </View>
      {highlight ? (
        <View style={{ marginTop: card.sectionGap, gap: card.valueGap }}>
          {label(highlight.label)}
          {cell(highlight, row, i, "cardHighlight")}
        </View>
      ) : null}
      {/* Sections carry no label or rule in a card; a gap separates them. */}
      {sections.map((section, index) => {
        const cols = columnsForSection(row, section);
        const body = cardBody(section), rows = body === "rows";
        return cols.length ? (
          <View key={section.key || index}
            style={{ marginTop: card.sectionGap, flexDirection: rows ? "column" : "row", flexWrap: rows ? "nowrap" : "wrap", gap: rows ? card.metricGap : card.sectionGap }}>
            {cols.map((col) => rows ? (
              <View key={col.key} style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: card.gap }}>
                {label(col.label)}
                <View style={{ flexShrink: 1, minWidth: 0 }}>{cell(col, row, i, "cardRowValue")}</View>
              </View>
            ) : (
              <View key={col.key} style={{
                flexBasis: col.fullWidthInCard || body === "stack" ? "100%" : body === "metrics" ? "30%" : "45%",
                flexGrow: 1, minWidth: 0, gap: card.valueGap }}>
                <KText style={{ ...typeStyle("meta"), color: colors.textTertiary, textAlign: section.labelAlign }}>{col.label}</KText>
                {cell(col, row, i, "cardValue")}
              </View>
            ))}
          </View>
        ) : null;
      })}
      {cardFooter ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: card.gap,
          marginTop: card.footerGap, paddingTop: card.footerGap, borderTopWidth: tokens.border.defaultWidth, borderTopColor: colors.divider }}>
          {expandable ? expand(row, i) : <View />}
          {/* The wrapper holds the end edge; a KjunButton's own flex-start would otherwise pull it left. */}
          {footerActions ? <View style={{ alignSelf: "center" }}>{cell(footerActions, row, i)}</View> : null}
        </View>
      ) : null}
      {expandable && state.expanded.includes(state.key(row, i)) ? (
        <View style={{ marginTop: card.sectionGap, paddingVertical: tokens.table.expandedPadding.y, paddingHorizontal: tokens.table.expandedPadding.x,
          borderRadius: tokens.radius.radius12, backgroundColor: colors.secondary }}>
          {content(renderExpand?.(row, i))}
        </View>
      ) : null}
    </>
  );
  const item = (row: Row, i: number) => {
    const selected = selectable && state.selectedRow(row);
    return (
      <Pressable
        key={state.key(row, i)}
        accessible={false}
        // No disabled here: on RN Web it would also disable the checkbox and buttons inside the card.
        onPress={onRowClick ? () => onRowClick(row, i) : undefined}
        style={({ pressed }) => ({ ...frame, backgroundColor: selected ? colors.selectedBg : pressed && onRowClick ? colors.hover : colors.surface,
          ...(tiles ? { flex: 1, minWidth: 0 } : null) })}
      >
        {tiles ? tile(row, i) : stacked(row, i)}
      </Pressable>
    );
  };
  // Tiles go perRow to a row; a short last row keeps each tile's width beside empty slots.
  const list = (rows: { row: Row; i: number }[]) => tiles
    ? <>{Array.from({ length: Math.ceil(rows.length / perRow) }, (_, n) => {
        const slice = rows.slice(n * perRow, n * perRow + perRow);
        return (
          <View key={n} style={{ flexDirection: "row", gap: card.cardGap }}>
            {slice.map(({ row, i }) => item(row, i))}
            {Array.from({ length: perRow - slice.length }, (_, k) => <View key={"empty" + k} style={{ flex: 1 }} />)}
          </View>
        );
      })}</>
    : <>{rows.map(({ row, i }) => item(row, i))}</>;
  const groupSections = useTableGroups(props, tokens.dimension.value4, list);
  const grouped = !!groups && !initialLoading && state.rows.length > 0;
  return (
    <View style={{ gap: card.cardGap, padding: card.listPadding, opacity: skeletonHidden ? 0 : undefined }}
      aria-hidden={skeletonHidden || undefined} onLayout={tiles ? (event) => setWidth(event.nativeEvent.layout.width) : undefined}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => <CardSkeleton key={i} layout={layout} />)
        : grouped ? groupSections(groups!) : list(state.rows.map((row, i) => ({ row, i })))}
      {!initialLoading && !state.rows.length ? (
        <View style={{ padding: card.emptyPadding, alignItems: "center" }}>
          {content(emptyContent || emptyText, { color: colors.textTertiary })}
        </View>
      ) : null}
      {!initialLoading && state.rows.length > 0 ? <TableTotals totals={totals} /> : null}
    </View>
  );
}

/** Like Web: the loaded card's own parts, so loading neither nests a card in a card nor changes height when rows arrive. */
function CardSkeleton<Row extends object>({ layout }: { layout: TableCardsProps<Row>["layout"] }) {
  const { colors } = useKjunStyles();
  const { tiles, subtitle, highlight, badges, cardLayout } = layout;
  const rows = cardLayout === "rows";
  const frame = { padding: tiles ? card.tilePadding : card.padding, borderWidth: tokens.border.defaultWidth, borderColor: colors.border,
    borderRadius: card.radius, backgroundColor: colors.surface };
  if (tiles) return (
    <View style={frame}>
      {badges.length > 0 ? <View style={{ marginBottom: card.gap }}><KjunSkeleton type="line" role="caption" width={card.badgeSkeletonWidth} /></View> : null}
      <KjunSkeleton type="line" role="control" width="70%" />
      {subtitle ? <View style={{ marginTop: card.valueGap }}><KjunSkeleton type="line" role="caption" width="45%" /></View> : null}
      {highlight ? <View style={{ marginTop: card.sectionGap }}><KjunSkeleton type="line" role="control" width="55%" /></View> : null}
    </View>
  );
  return (
    <View style={frame}>
      <KjunSkeleton type="line" role="cardTitle" width={card.titleSkeletonWidth} />
      {subtitle ? <View style={{ marginTop: card.valueGap }}><KjunSkeleton type="line" role="caption" width="30%" /></View> : null}
      {highlight ? (
        <View style={{ marginTop: card.sectionGap, gap: card.valueGap }}>
          <KjunSkeleton type="line" role="meta" width="20%" />
          <KjunSkeleton type="line" role="sectionTitle" width="45%" />
        </View>
      ) : null}
      <View style={{ marginTop: card.sectionGap, flexDirection: rows ? "column" : "row", flexWrap: rows ? "nowrap" : "wrap", gap: rows ? card.metricGap : card.sectionGap }}>
        {[0, 1, 2, 3].map((field) => rows ? (
          <View key={field} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <KjunSkeleton type="line" role="meta" width="25%" />
            <KjunSkeleton type="line" role="body" width="20%" />
          </View>
        ) : (
          <View key={field} style={{ flexBasis: "45%", flexGrow: 1, gap: card.valueGap }}>
            <KjunSkeleton type="line" role="meta" width="50%" />
            <KjunSkeleton type="line" role="body" width={field % 2 ? "60%" : "75%"} />
          </View>
        ))}
      </View>
    </View>
  );
}
