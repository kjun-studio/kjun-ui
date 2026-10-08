import { tokens } from "@kjun/tokens";
import { typeStyle } from "./typography";
import { useMarketLayout, marketGeometry, marketHeaderStyle, marketRowStyle } from "./market-layout";
import { useId, useState } from "react";
import { ScrollView,View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { MarketQuoteTypeContext } from "./number-display";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsIconToggle } from "./actions";
import { DsIcon } from "./button";
import { DsDataState } from "./data-state";
import { DsEmpty,DsSkeleton } from "./display";
import {
DsCollectionMark,
DsFreshness,
DsPriceCell,
DsSignedValue,
DsSparkline,
finiteNumber,
} from "./financial";
import { KText,content,domainColor } from "./internal";
import {
DsMarketTableProps,
MarketColumn
} from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { useKjunStyles } from "./provider";
import { DsMarketTableSkeleton } from "./skeletons";
import { getValue } from "./table";
export function DsMarketTable<Row extends object = Record<string, unknown>>(
  props: DsMarketTableProps<Row>
) {
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
      emptyMessage = "항목이 없습니다",
      emptySubMessage = "",
      formatMetric,
      renderCell,
    } = props,
    { colors, domainColors } = useKjunStyles();
  const render = (row: Row, col: MarketColumn) => {
    const value = getValue(row, col.key),
      stale = !!getValue(row, "stale");
    if (cellLoading(row, col))
      return <DsSkeleton type="block" height={tokens.extensions.marketTable.valueSkeletonHeight} width={tokens.extensions.marketTable.valueSkeletonWidth} />;
    if (renderCell) return content(renderCell(row, col));
    if (["stock_name", "name", "symbol"].includes(col.key))
      return <MarketIdentity row={row} props={props} table />;
    if (col.type === "sparkline")
      return (
        <DsSparkline
          data={Array.isArray(value) ? (value as number[]) : []}
          width={tokens.extensions.marketTable.sparklineWidth}
          height={tokens.extensions.marketTable.sparklineHeight}
        />
      );
    if (col.type === "price")
      return (
        <DsPriceCell
          value={finiteNumber(value)}
          formatter={priceFormatter}
          stale={stale}
          showFreshness={false}
        />
      );
    if (col.type === "percent")
      return value == null ? (
        <KText>-</KText>
      ) : (
        <DsSignedValue
          value={finiteNumber(value)}
          format="percent"
          isRaw
          stale={stale}
          showFreshness={false}
          formatter={
            formatMetric
              ? (number) =>
                  formatMetric(number, col.type!, {
                    currency,
                    row,
                    column: col,
                  })
              : undefined
          }
        />
      );
    const text = formatMetric
      ? formatMetric(value, col.type || "text", { currency, row, column: col })
      : value == null
      ? "-"
      : String(value);
    return ["investor", "net_amount", "net_volume"].includes(col.type || "") ? (
      <DsSignedValue
        value={finiteNumber(value)}
        formatter={() => text}
        stale={stale}
        showFreshness={false}
      />
    ) : (
      <KText
        style={{
          textAlign: col.align,
          fontWeight: col.weight === "bold" ? typeStyle('control').fontWeight : undefined,
        }}
      >
        {text}
      </KText>
    );
  };
  const layout = useMarketLayout(columns, showActions);
  // Like Web's market table scroll hint: when columns overflow, the trailing edge fades until the end is reached.
  const [scroll, setScroll] = useState({ viewport: 0, x: 0 }), fadeId = "kjun-market-fade-" + useId().replace(/[^a-z0-9]/gi, "");
  // Table cells read change at the body weight like Web td text, and prices drop the flash pill inset
  // so every numeric value ends on its header's right edge.
  const tableQuote = { price: {}, change: { fontWeight: typeStyle("body").fontWeight } };
  return (
    <View
      onLayout={layout.onLayout}
      style={{
        backgroundColor: embedded ? undefined : colors.surface,
        borderRadius: embedded ? 0 : tokens.radius.radius12,
      }}
    >
      <DsDataState
        {...props}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={
          <DsMarketTableSkeleton columns={columns} showActions={showActions} />
        }
        emptyContent={
          <DsEmpty text={emptyMessage} description={emptySubMessage} />
        }
      >
        <MarketQuoteTypeContext.Provider value={tableQuote}>
        <View style={{ position: "relative", minWidth: 0 }}>
        <ScrollView horizontal scrollEventThrottle={16}
          onLayout={(event) => { const viewport = event.nativeEvent.layout.width; setScroll((previous) => ({ ...previous, viewport })); }}
          onScroll={(event) => { const x = event.nativeEvent.contentOffset.x; setScroll((previous) => ({ ...previous, x })); }}>
          <View style={{ width: layout.width }}>
            <View
              style={{
                ...marketHeaderStyle,
                borderBottomColor: colors.border,
              }}
            >
              {showActions && (
                <View
                  style={{
                    width: marketGeometry.actionsWidth,
                    paddingVertical: tokens.dimension.value12,
                    paddingHorizontal: tokens.dimension.value4,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Header marks share the row toggles' column so both icons line up. */}
                  {(["interest", "favorite"] as const).map(kind => (
                    <View key={kind} style={{ width: Math.max(tokens.native.minimumTouchTarget, tokens.extensions.iconToggle.sizes.xs), alignItems: "center" }}>
                      <DsCollectionMark kind={kind} size="md" />
                    </View>
                  ))}
                </View>
              )}
              {columns.map((col, columnIndex) => (
                <Pressable
                  key={col.key}
                  disabled={!col.sortable}
                  accessibilityRole="button"
                  accessibilityLabel={col.label}
                  onPress={() => props.onSort?.(col.key)}
                  style={{
                    width: layout.widths[columnIndex],
                    padding: tokens.dimension.value12,
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
                      ...typeStyle('meta'),


                      color: colors.textTertiary,
                    }}
                  >
                    {col.label}
                  </KText>
                  {col.sortable && (
                    <DsIcon
                      name={
                        sortKey === col.key
                          ? sortOrder === "asc"
                            ? "sort-ascending"
                            : "sort-descending"
                          : "arrows-sort"
                      }
                      size={tokens.extensions.marketTable.sortIconSize}
                      color={
                        sortKey === col.key ? colors.brand : colors.textTertiary
                      }
                    />
                  )}
                </Pressable>
              ))}
            </View>
            {rows.map((row, i) => {
              const id = getValue(row, rowKey),
                priceCol = columns.find(
                  (c) =>
                    c.type === "price" &&
                    !cellLoading(row, c) &&
                    getValue(row, c.key) != null
                );
              return (
                <Pressable
                  key={String(id ?? i)}
                  accessible={false}
                  onPress={() => props.onRowClick?.(row)}
                  style={({ pressed }) => ({
                    ...marketRowStyle,
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.hover : undefined,
                  })}
                >
                  {showActions && (
                    <View
                      style={{
                        width: marketGeometry.actionsWidth,
                        paddingVertical: tokens.dimension.value12,
                        paddingHorizontal: tokens.dimension.value4,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DsIconToggle
                        size="xs"
                        active={props.interestKeys?.has(id)}
                        activeIcon="heart"
                        activeColor={domainColor(domainColors, "interest")}
                        ariaLabel={[
                          props.primaryLabel?.(row) || String(getValue(row, "name") || ""),
                          "관심", props.interestKeys?.has(id) ? "해제" : "등록",
                        ].filter(Boolean).join(" ")}
                        loading={togglingInterest === id}
                        onToggle={() => props.onToggleInterest?.(row)}
                      />
                      <DsIconToggle
                        size="xs"
                        active={props.favoriteKeys?.has(id)}
                        activeIcon="star"
                        activeColor={domainColor(domainColors, "favorite")}
                        ariaLabel={[
                          props.primaryLabel?.(row) || String(getValue(row, "name") || ""),
                          "즐겨찾기", props.favoriteKeys?.has(id) ? "해제" : "등록",
                        ].filter(Boolean).join(" ")}
                        loading={togglingFavorite === id}
                        onToggle={() => props.onToggleFavorite?.(row)}
                      />
                    </View>
                  )}
                  {columns.map((col, columnIndex) => (
                    <View
                      key={col.key}
                      style={{
                        width: layout.widths[columnIndex],
                        paddingVertical: tokens.dimension.value14,
                        paddingHorizontal: tokens.dimension.value12,
                        justifyContent: "center",
                        alignItems:
                          col.align === "right"
                            ? "flex-end"
                            : col.align === "center"
                            ? "center"
                            : undefined,
                      }}
                    >
                      {/* The wrapper takes the column alignment; content-hugging values (DsSignedValue) would
                          otherwise pull themselves to the start of a right-aligned cell. */}
                      <View style={{ alignSelf: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : undefined }}>
                        {render(row, col)}
                      </View>
                      {col.key === priceCol?.key && (
                        <DsFreshness
                          stale={!!getValue(row, "stale")}
                          source={String(getValue(row, "source") || "")}
                          fetchedAt={String(getValue(row, "fetched_at") || "")}
                        />
                      )}
                    </View>
                  ))}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        {layout.width - scroll.viewport - scroll.x > 1 && (
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
        </MarketQuoteTypeContext.Provider>
      </DsDataState>
      <MarketFooter props={props} />
    </View>
  );
}
