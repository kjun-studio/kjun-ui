import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { sparklineCell } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { ScrollView,View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunSignedValue,
KjunSparkline,
finiteNumber
} from "./financial";
import { KText } from "./internal";
import {
KjunMarketCardsProps,
useMarketCards
} from "./market-model";
import { MarketFooter,MarketIdentity,MarketRow } from "./market-parts";
import { ScrollFadeEdge } from "./scroll-fade-edge";
import { useFilterRow } from "./use-filter-row";
import { useKjunStyles } from "./provider";
import { KjunListSkeleton } from "./skeletons";
import { getValue } from "./table";
const metricLabelStyle = typeStyle("label");
const selectedMetricLabelStyle = { ...metricLabelStyle, fontWeight: typeStyle("numberLg").fontWeight };
export function KjunMarketCards<Row extends object = Record<string, unknown>>(
  props: KjunMarketCardsProps<Row>
) {
  const m = useKjunMessages();
  const {
      rows = [],
      rowKey = "id",
      sortKey,
      sortOrder = "desc",
      emitSortOnMount = true,
      currency = "krw",
      changeMetricKey = "change_rate",
      priceMetricKeys = ["current_price", "close_price"],
      metricLoading = () => false,
      emptyMessage = m.noItems,
      emptySubMessage = "",
    } = props,
    { colors } = useKjunStyles();
  const state = useMarketCards(props),
    // Like a scrolling FilterGroup: the clipped edges fade and the selected pill stays in view.
    pillRow = useFilterRow(true, false, state.key),
    isPrice = priceMetricKeys.includes(state.key),
    isChange = state.key === changeMetricKey;
  const sortShown = (pill: { key: string; sortKey?: string | null }) =>
    state.key === pill.key && (emitSortOnMount || pill.sortKey === sortKey);
  const display = (row: Row) => {
    const value = getValue(row, state.key);
    return state.pill?.formatter
      ? state.pill.formatter(value)
      : props.formatMetric
      ? props.formatMetric(value, state.pill?.format || "text", {
          currency,
          row,
          column: props.columns.find((c) => c.key === state.key),
        })
      : value == null
      ? "-"
      : String(value);
  };
  return (
    <View>
      <View role="group" accessibilityLabel={m.metrics}>
      <ScrollView
        ref={pillRow.scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={event => pillRow.update({ clientWidth: event.nativeEvent.layout.width })}
        onContentSizeChange={scrollWidth => pillRow.update({ scrollWidth })}
        onScroll={event => pillRow.update({ scrollLeft: event.nativeEvent.contentOffset.x }, true)}
        contentContainerStyle={{
          flexDirection: "row",
          gap: tokens.dimension.value8,
          paddingVertical: tokens.dimension.value10,
          paddingHorizontal: tokens.dimension.value16,
        }}
      >
        {state.pills.map((pill) => (
          <Pressable
            key={pill.key}
            onLayout={event => pillRow.measure(pill.key, event)}
            accessibilityRole="button"
            // The arrow is drawn; the order is read as a word, like Web.
            accessibilityLabel={pill.sortKey && sortShown(pill) ? `${pill.label}, ${sortOrder === "desc" ? m.descending : m.ascending}` : pill.label}
            accessibilityState={{ selected: state.key === pill.key }}
            onPress={() => state.select(pill.key)}
            // Like Web: a 36px pill; the hit slop keeps the 44px Native touch target.
            hitSlop={{ top: (tokens.native.minimumTouchTarget - typeStyle("label").lineHeight - 2 * tokens.dimension.value8) / 2, bottom: (tokens.native.minimumTouchTarget - typeStyle("label").lineHeight - 2 * tokens.dimension.value8) / 2 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.dimension.value4,
              paddingVertical: tokens.dimension.value8,
              paddingHorizontal: tokens.dimension.value16,
              borderRadius: tokens.radius.radius9999,
              backgroundColor:
                state.key === pill.key ? colors.brand : colors.secondary,
            }}
          >
            {/* Like Web: label type, the selected pill at the strong number weight, and a caption-sized arrow. */}
            <View style={{ alignItems: 'center' }}>
              <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                style={{ ...selectedMetricLabelStyle, color: state.key === pill.key ? colors.onBrand : colors.textSecondary, opacity: 0 }}>{pill.label}</KText>
              <View style={{ height: 0, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <KText accessible={false} style={{ ...metricLabelStyle, color: state.key === pill.key ? colors.onBrand : colors.textSecondary, opacity: 0 }}>{pill.label}</KText>
              </View>
              <KText numberOfLines={1} style={{ position: 'absolute', top: 0,
                ...(state.key === pill.key ? selectedMetricLabelStyle : metricLabelStyle),
                color: state.key === pill.key ? colors.onBrand : colors.textSecondary,
              }}>{pill.label}</KText>
            </View>
            {/* Keep the sortable pill's arrow slot even when its arrow is not shown. */}
            {!!pill.sortKey && (
              <KText numberOfLines={1} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                style={{ ...typeStyle("caption"), color: colors.onBrand,
                  opacity: sortShown(pill) ? 1 : 0 }}>
                {sortOrder === "desc" ? "↓" : "↑"}
              </KText>
            )}
          </Pressable>
        ))}
      </ScrollView>
      {pillRow.edges.start ? <ScrollFadeEdge edge="start" horizontal color={colors.surface} /> : null}
      {pillRow.edges.end ? <ScrollFadeEdge edge="end" horizontal color={colors.surface} /> : null}
      </View>
      {props.renderList ? (
        props.renderList({
          selectedKey: state.key,
          selectedPill: state.pill,
          metricDisplay: display,
        })
      ) : (
        <>
          <KjunDataState
            {...props}
            {...marketQueryState(props)}
            loadingPadding="none"
            empty={!rows.length}
            loadingContent={props.skeleton === false ? undefined : <KjunListSkeleton variant="compact" />}
            emptyContent={
              <KjunEmpty size="sm" text={emptyMessage} description={emptySubMessage} />
            }
          >
            <View style={{ gap: tokens.dimension.value2 }}>
              {rows.map((row, i) => (
                <MarketRow
                  key={String(getValue(row, rowKey) ?? i)}
                  row={row}
                  props={props}
                  selectedKey={props.activeKey}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: tokens.dimension.value10,
                    paddingHorizontal: tokens.dimension.value8,
                  }}
                >
                  <MarketIdentity row={row} props={props} compact />
                  <View style={{ marginLeft: tokens.dimension.value12, alignItems: "flex-end" }}>
                    {state.pill?.format === "sparkline" ? (
                      <KjunSparkline
                        {...sparklineCell(rows, row, props.columns.find((c) => c.key === state.key) ?? { key: state.key }, getValue)}
                        width={tokens.extensions.marketTable.sparklineWidth}
                        height={tokens.extensions.marketTable.sparklineHeight}
                      />
                    ) : state.pill ? (
                      <>
                        {metricLoading(row, state.key) ? (
                          <KjunSkeleton type="line" role="numberSm" width={tokens.extensions.marketTable.valueSkeletonWidth} />
                        ) : isChange && getValue(row, state.key) != null ? (
                          <KjunSignedValue
                            value={finiteNumber(getValue(row, state.key))}
                            formatter={() => display(row)}
                            stale={!!getValue(row, "stale")}
                            tone="pill"
                          />
                        ) : isPrice && getValue(row, state.key) == null ? (
                          <KjunSkeleton type="line" role="numberSm" width={tokens.extensions.financial.priceSkeletonWidth} />
                        ) : (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: tokens.dimension.value4,
                            }}
                          >
                            {props.renderMetricPrefix?.(
                              row,
                              state.key,
                              isPrice
                            )}
                            <KText
                              style={{
                                fontWeight: typeStyle('control').fontWeight,
                                fontVariant: ["tabular-nums"],
                                color:
                                  isPrice && getValue(row, "stale")
                                    ? colors.textTertiary
                                    : colors.text,
                              }}
                            >
                              {display(row)}
                            </KText>
                          </View>
                        )}

                      </>
                    ) : null}
                  </View>
                </MarketRow>
              ))}
            </View>
          </KjunDataState>
          <MarketFooter props={props} />
        </>
      )}
    </View>
  );
}
