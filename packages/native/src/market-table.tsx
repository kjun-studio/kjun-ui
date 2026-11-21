import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { sparklineCell } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { useMarketLayout, marketGeometry, marketHeaderStyle, marketRowStyle } from "./market-layout";
import { Fragment, useId, useRef, useState } from "react";
import { Animated, Platform, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ScrollFadeEdge } from "./scroll-fade-edge";
import { isMarketIdentity, marketCellKind, marketColumnFlash, marketPinnedIdentity, marketRowLabel, marketSortIcon, marketSortState, marketStatusColumn } from "../../../shared/package-runtime/market-table";
import { MarketQuoteTypeContext, PriceStatus } from "./number-display";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIconToggle } from "./actions";
import { KjunIcon } from "./button";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunCollectionMark,
KjunPriceCell,
KjunSignedValue,
KjunSparkline,
finiteNumber,
} from "./financial";
import { KText,content,domainColor } from "./internal";
import {
KjunMarketTableProps,
MarketColumn
} from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { useKjunStyles } from "./provider";
import { KjunMarketTableSkeleton } from "./skeletons";
import { getValue } from "./table";
export function KjunMarketTable<Row extends object = Record<string, unknown>>(
  props: KjunMarketTableProps<Row>
) {
  const m = useKjunMessages();
  const {
      rows = [],
      columns,
      rowKey = "id",
      cellLoading = () => false,
      showActions = true,
      togglingInterest,
      togglingFavorite,
      sortKey,
      sortOrder = "desc",
      priceFormatter,
      currency = "krw",
      embedded = false,
      stickyIdentity = true,
      divider = true,
      activeKey,
      emptyMessage = m.noItems,
      emptySubMessage = "",
      formatMetric,
      renderCell,
      renderStatus,
      onRowClick,
    } = props,
    { colors, domainColors } = useKjunStyles();
  const label = (row: Row) => marketRowLabel(row, props.primaryLabel, getValue);
  const render = (row: Row, col: MarketColumn) => {
    const value = getValue(row, col.key),
      stale = !!getValue(row, "stale");
    if (cellLoading(row, col))
      return <KjunSkeleton type="line" role="numberSm" width={tokens.extensions.marketTable.valueSkeletonWidth} />;
    if (renderCell) return content(renderCell(row, col));
    if (col.render) return content(col.render(row, col));
    const kind = marketCellKind(col), context = { currency, row, column: col };
    if (kind === "identity") return <MarketIdentity row={row} props={props} table />;
    if (kind === "sparkline")
      return (
        <KjunSparkline
          {...sparklineCell(rows, row, col, getValue)}
          width={tokens.extensions.marketTable.sparklineWidth}
          height={tokens.extensions.marketTable.sparklineHeight}
        />
      );
    if (kind === "price")
      return <KjunPriceCell value={finiteNumber(value)} formatter={priceFormatter} stale={stale} flash={marketColumnFlash(col)} />;
    if (kind === "percent")
      return value == null ? <KText>-</KText> : (
        <KjunSignedValue value={finiteNumber(value)} format="percent" stale={stale}
          formatter={formatMetric ? (number) => formatMetric(number, col.type!, context) : undefined} />
      );
    const text = formatMetric ? formatMetric(value, col.type || "text", context) : value == null ? "-" : String(value);
    return kind === "signed" ? <KjunSignedValue value={finiteNumber(value)} formatter={() => text} stale={stale} /> : (
      <KText style={{ textAlign: col.align, fontWeight: col.weight === "bold" ? typeStyle("control").fontWeight : undefined }}>
        {text}
      </KText>
    );
  };
  const layout = useMarketLayout(columns, showActions);
  // Like Web's market table scroll hint: when columns overflow, the trailing edge fades until the end is reached.
  const [scroll, setScroll] = useState({ viewport: 0, x: 0 }), edgeId = "kjun-market-edge-" + useId().replace(/[^a-z0-9]/gi, "");
  // Like Web's sticky cells: the toggle and identity columns move with the scroll offset, so they stay in view.
  const scrollX = useRef(new Animated.Value(0)).current;
  const pinned = marketPinnedIdentity(columns, stickyIdentity), base = props.fadeColor ?? colors.surface;
  const pin = (background: unknown, edge = false) => pinned ? {
    transform: [{ translateX: scrollX }], zIndex: edge ? 2 : 1, backgroundColor: background as string,
  } : {};
  // Once scrolled, the last pinned column casts a soft edge over the columns passing under it, like Web's box-shadow.
  const pinEdge = pinned && scroll.x > 0 ? (
    <View style={{ pointerEvents: "none", position: "absolute", top: 0, bottom: 0, right: -tokens.dimension.value8, width: tokens.dimension.value8 }}>
      <Svg width="100%" height="100%">
        <Defs><LinearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0" stopColor={colors.shadow} stopOpacity={1} />
          <Stop offset="1" stopColor={colors.shadow} stopOpacity={0} />
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={`url(#${edgeId})`} />
      </Svg>
    </View>
  ) : null;
  // A row with toggles cannot be one accessible button (a device would merge them in), so like KjunTable's cards its
  // identity cell is the button that opens it; a row without toggles is the button itself.
  const merged = !!onRowClick && !showActions, opener = onRowClick && showActions ? (columns.find(c => isMarketIdentity(c.key)) ?? columns[0])?.key : undefined;
  // Table cells read change at the body weight like Web td text, and prices drop the flash pill inset
  // so every numeric value ends on its header's right edge.
  const tableQuote = { price: {}, change: { fontWeight: typeStyle("body").fontWeight } };
  const actionsCell = { width: layout.actionsWidth, paddingVertical: tokens.dimension.value12, paddingHorizontal: tokens.dimension.value4,
    flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const };
  const justify = (align?: string) => align === "right" ? "flex-end" as const : align === "center" ? "center" as const : "flex-start" as const;
  return (
    <View
      onLayout={layout.onLayout}
      style={{
        backgroundColor: embedded ? undefined : colors.surface,
        borderRadius: embedded ? 0 : tokens.radius.radius12,
      }}
    >
      <KjunDataState
        {...props}
        {...marketQueryState(props)}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={props.skeleton === false ? undefined : (
          <KjunMarketTableSkeleton columns={columns} showActions={showActions} />
        )}
        emptyContent={
          <KjunEmpty size="sm" text={emptyMessage} description={emptySubMessage} />
        }
      >
        <MarketQuoteTypeContext.Provider value={tableQuote}>
        <View style={{ position: "relative", minWidth: 0 }}>
        <Animated.ScrollView horizontal scrollEventThrottle={16}
          onLayout={(event) => { const viewport = event.nativeEvent.layout.width; setScroll((previous) => ({ ...previous, viewport })); }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: Platform.OS !== "web",
            listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
              const x = event.nativeEvent.contentOffset.x; setScroll((previous) => ({ ...previous, x }));
            },
          })}>
          <View style={{ width: layout.width }}>
            <View
              style={{
                ...marketHeaderStyle,
                borderBottomColor: colors.border,
              }}
            >
              {showActions && (
                <Animated.View
                  // Like Web's header cell: the marks are drawings, so the column carries its own name.
                  accessible
                  accessibilityLabel={m.collectionMarks}
                  style={{ ...actionsCell, ...pin(base) }}
                >
                  {/* Header marks take the row toggles' squares, so both icons line up as on Web. */}
                  {(["interest", "favorite"] as const).map(kind => (
                    <View key={kind} style={{ width: tokens.extensions.iconToggle.sizes.xs, alignItems: "center" }}>
                      <KjunCollectionMark kind={kind} size="md" />
                    </View>
                  ))}
                </Animated.View>
              )}
              {columns.map((col, columnIndex) => {
                const sort = marketSortState(col, sortKey, sortOrder), sorted = sort === "ascending" || sort === "descending";
                const cell = (grow = false) => (
                  // Like KjunTable: only a sortable column is a button, and its hint says the current order.
                  <Pressable
                    disabled={!sort}
                    accessible={!!sort}
                    accessibilityRole={sort ? "button" : undefined}
                    accessibilityLabel={sort ? col.label : undefined}
                    accessibilityHint={sorted ? (sort === "ascending" ? m.ascending : m.descending) : undefined}
                    onPress={() => props.onSort?.(col.key)}
                    style={{
                      width: layout.widths[columnIndex],
                      flexGrow: grow ? 1 : undefined,
                      // Like Web: a pinned label stops at its column's edge instead of running over the cells passing under it.
                      overflow: grow ? "hidden" : undefined,
                      paddingVertical: tokens.dimension.value12,
                      paddingHorizontal: layout.compact ? tokens.dimension.value4 : tokens.dimension.value12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: justify(col.align),
                      gap: tokens.dimension.value4,
                    }}
                  >
                    <KText style={{ ...typeStyle("meta"), color: sorted ? colors.text : colors.textTertiary,
                      fontWeight: sorted ? typeStyle("sectionTitle").fontWeight : typeStyle("meta").fontWeight }}>
                      {col.label}
                    </KText>
                    {sort && (
                      <KjunIcon name={marketSortIcon(sort)} size={tokens.extensions.marketTable.sortIconSize}
                        color={sorted ? colors.text : colors.textTertiary} />
                    )}
                  </Pressable>
                );
                // A pinned cell sits in a moving wrapper and grows to the header's height inside it.
                return col.key === pinned
                  ? <Animated.View key={col.key} style={pin(base, true)}>{cell(true)}{pinEdge}</Animated.View>
                  : <Fragment key={col.key}>{cell()}</Fragment>;
              })}
            </View>
            {rows.map((row, i) => {
              const id = getValue(row, rowKey),
                statusKey = marketStatusColumn(columns, row, cellLoading, getValue),
                active = activeKey != null && id === activeKey,
                interest = !!props.interestKeys?.has(id), favorite = !!props.favoriteKeys?.has(id);
              // Web exposes the open row as aria-current; devices hear it as selected.
              const current = active ? (Platform.OS === "web" ? { "aria-current": "true" } : { accessibilityState: { selected: true } }) : {};
              return (
                <Pressable
                  key={String(id ?? i)}
                  accessible={merged}
                  accessibilityRole={merged ? "button" : undefined}
                  accessibilityLabel={merged ? label(row) : undefined}
                  focusRingInset
                  {...(merged ? current : {})}
                  onPress={onRowClick ? () => onRowClick(row) : undefined}
                  style={({ pressed }) => ({
                    ...marketRowStyle,
                    // Like KjunTable: rows part with the lighter divider and the header keeps the border line.
                    borderBottomColor: divider ? colors.divider : "transparent",
                    backgroundColor: active ? colors.selectedBg : pressed && onRowClick ? colors.hover : undefined,
                  })}
                >
                  {({ pressed }) => {
                    const rowBackground = active ? colors.selectedBg : pressed && onRowClick ? colors.hover : base;
                    return (
                      <>
                        {showActions && (
                          <Animated.View style={{ ...actionsCell, ...pin(rowBackground) }}>
                            {/* The toggles align themselves to the top, so a row of their own takes the cell's vertical centre. */}
                            <View style={{ flexDirection: "row" }}>
                            <KjunIconToggle
                              size="xs"
                              active={interest}
                              activeIcon="heart"
                              activeColor={domainColor(domainColors, "interest")}
                              ariaLabel={m.watchToggle(label(row), interest)}
                              loading={togglingInterest === id}
                              onToggle={() => props.onToggleInterest?.(row)}
                            />
                            <KjunIconToggle
                              size="xs"
                              active={favorite}
                              activeIcon="star"
                              activeColor={domainColor(domainColors, "favorite")}
                              ariaLabel={m.favoriteToggle(label(row), favorite)}
                              loading={togglingFavorite === id}
                              onToggle={() => props.onToggleFavorite?.(row)}
                            />
                            </View>
                          </Animated.View>
                        )}
                        {columns.map((col, columnIndex) => {
                          const isPinned = col.key === pinned, cellStyle = {
                            width: layout.widths[columnIndex],
                            flexGrow: isPinned ? 1 : undefined,
                            overflow: isPinned ? "hidden" as const : undefined,
                            paddingVertical: tokens.dimension.value14,
                            paddingHorizontal: layout.compact ? tokens.dimension.value4 : tokens.dimension.value12,
                            justifyContent: "center" as const,
                            alignItems: col.align === "right" || col.align === "center" ? justify(col.align) : undefined,
                          };
                          // The wrapper takes the column alignment; content-hugging values (KjunSignedValue) would
                          // otherwise pull themselves to the start of a right-aligned cell.
                          // Like Web, the price column's status sits after the value on the same line, or under it on a phone.
                          // The identity keeps to its column, so a long name ends in an ellipsis instead of running over the price.
                          const fitted = marketCellKind(col) === "identity" && !renderCell && !col.render;
                          const value = (
                            <View style={fitted ? { flexDirection: "row", alignItems: "center", minWidth: 0 } : {
                              alignSelf: col.align === "right" || col.align === "center" ? justify(col.align) : undefined,
                              flexDirection: layout.compact ? "column" : "row",
                              alignItems: layout.compact ? justify(col.align) : "center",
                              gap: layout.compact ? tokens.dimension.value2 : tokens.extensions.financial.statusGap }}>
                              {render(row, col)}
                              {col.key === statusKey && <PriceStatus status={renderStatus?.(row)} />}
                            </View>
                          );
                          const inner = col.key === opener ? (
                            <Pressable accessibilityRole="button" accessibilityLabel={label(row)} focusRingInset {...current}
                              onPress={() => onRowClick?.(row)} style={cellStyle}>{value}</Pressable>
                          ) : <View style={cellStyle}>{value}</View>;
                          return isPinned
                            ? <Animated.View key={col.key} style={pin(rowBackground, true)}>{inner}{pinEdge}</Animated.View>
                            : <Fragment key={col.key}>{inner}</Fragment>;
                        })}
                      </>
                    );
                  }}
                </Pressable>
              );
            })}
          </View>
        </Animated.ScrollView>
        {layout.width - scroll.viewport - scroll.x > 1 && <ScrollFadeEdge edge="end" horizontal color={base} />}
        </View>
        </MarketQuoteTypeContext.Provider>
      </KjunDataState>
      <MarketFooter props={props} />
    </View>
  );
}
