import { tokens } from "@kjun/tokens";
import { typeStyle } from "./typography";
import { ScrollView,View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsDataState } from "./data-state";
import { DsEmpty,DsSkeleton } from "./display";
import {
DsSignedValue,
DsSparkline,
finiteNumber
} from "./financial";
import { KText } from "./internal";
import {
DsMarketCardsProps,
useMarketCards
} from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { useKjunStyles } from "./provider";
import { DsListSkeleton } from "./skeletons";
import { getValue } from "./table";
export function DsMarketCards<Row extends object = Record<string, unknown>>(
  props: DsMarketCardsProps<Row>
) {
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
      emptyMessage = "항목이 없습니다",
      emptySubMessage = "",
    } = props,
    { colors } = useKjunStyles();
  const state = useMarketCards(props),
    isPrice = priceMetricKeys.includes(state.key),
    isChange = state.key === changeMetricKey;
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
            accessibilityRole="button"
            accessibilityLabel={pill.label}
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
            <KText
              style={{
                ...typeStyle("label"),
                fontWeight: state.key === pill.key ? typeStyle("numberLg").fontWeight : typeStyle("label").fontWeight,
                color:
                  state.key === pill.key
                    ? colors.onBrand
                    : colors.textSecondary,
              }}
            >
              {pill.label}
            </KText>
            {state.key === pill.key && pill.sortKey && (emitSortOnMount || pill.sortKey === sortKey) && (
              <KText style={{ ...typeStyle("caption"), color: colors.onBrand }}>
                {sortOrder === "desc" ? "↓" : "↑"}
              </KText>
            )}
          </Pressable>
        ))}
      </ScrollView>
      {props.renderList ? (
        props.renderList({
          selectedKey: state.key,
          selectedPill: state.pill,
          metricDisplay: display,
        })
      ) : (
        <>
          <DsDataState
            {...props}
            loadingPadding="none"
            empty={!rows.length}
            loadingContent={<DsListSkeleton variant="compact" />}
            emptyContent={
              <DsEmpty text={emptyMessage} description={emptySubMessage} />
            }
          >
            <View>
              {state.pill && <KText style={{ textAlign:"right", paddingHorizontal:tokens.dimension.value16, paddingVertical:tokens.dimension.value8, ...typeStyle('caption'),  color:colors.textSecondary }}>{state.pill.label}</KText>}
              {rows.map((row, i) => (
                <Pressable
                  key={String(getValue(row, rowKey) ?? i)}
                  accessible={false}
                  onPress={() => props.onRowClick?.(row)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: tokens.dimension.value10,
                    paddingHorizontal: tokens.dimension.value16,
                    borderBottomWidth: tokens.border.defaultWidth,
                    borderBottomColor: colors.border,
                    backgroundColor: pressed ? colors.hover : undefined,
                  })}
                >
                  <MarketIdentity row={row} props={props} compact />
                  <View style={{ marginLeft: tokens.dimension.value12, alignItems: "flex-end" }}>
                    {state.pill?.format === "sparkline" ? (
                      <DsSparkline
                        data={(getValue(row, state.key) as number[]) || []}
                        width={tokens.extensions.marketTable.sparklineWidth}
                        height={tokens.extensions.marketTable.sparklineHeight}
                      />
                    ) : state.pill ? (
                      <>
                        {metricLoading(row, state.key) ? (
                          <DsSkeleton type="block" height={tokens.extensions.marketTable.valueSkeletonHeight} width={tokens.extensions.marketTable.valueSkeletonWidth} />
                        ) : isChange && getValue(row, state.key) != null ? (
                          <DsSignedValue
                            value={finiteNumber(getValue(row, state.key))}
                            formatter={() => display(row)}
                            stale={!!getValue(row, "stale")}
                            tone="pill"
                          />
                        ) : isPrice && getValue(row, state.key) == null ? (
                          <DsSkeleton type="block" height={tokens.extensions.financial.priceSkeletonHeight} width={tokens.extensions.financial.priceSkeletonWidth} />
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
                </Pressable>
              ))}
            </View>
          </DsDataState>
          <MarketFooter props={props} />
        </>
      )}
    </View>
  );
}
