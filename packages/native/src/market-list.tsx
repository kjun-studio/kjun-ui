import { tokens } from "@kjun/tokens";
import { typeStyle } from "./typography";
import { View,useWindowDimensions } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsDataState } from "./data-state";
import { DsBadge,DsEmpty,DsSkeleton } from "./display";
import {
DsFreshness,
DsPriceCell,
DsSignedValue,
finiteNumber
} from "./financial";
import { KText } from "./internal";
import { MarketQuoteTypeContext } from "./number-display";
const changeWeight = { fontWeight: typeStyle("label").fontWeight };
const quoteDesktop = { price: typeStyle("control"), change: { ...typeStyle("caption"), ...changeWeight } };
const quoteMobile = { price: typeStyle("input"), change: { ...typeStyle("body"), ...changeWeight } };
import { DsMarketSimpleListProps } from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { useKjunStyles } from "./provider";
import { DsListSkeleton } from "./skeletons";
import { getValue } from "./table";
export function DsMarketSimpleList<
  Row extends object = Record<string, unknown>
>(props: DsMarketSimpleListProps<Row>) {
  const {
      rows = [],
      rowKey = "id",
      priceValue,
      changeValue,
      changeLoading = () => false,
      priceFormatter,
      closingPrice = false,
      emptyMessage = "항목이 없습니다",
      emptySubMessage = "",
    } = props,
    { colors } = useKjunStyles(),
    mobile = useWindowDimensions().width < tokens.responsive.market;
  return (
    <View>
      <DsDataState
        {...props}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={<DsListSkeleton />}
        emptyContent={
          <DsEmpty text={emptyMessage} description={emptySubMessage} />
        }
      >
        <View>
          {rows.map((row, i) => {
            const price = priceValue(row),
              change = changeValue(row),
              stale = !!getValue(row, "stale"),
              source = String(getValue(row, "source") || ""),
              fetchedAt = String(getValue(row, "fetched_at") || "");
            return (
              <Pressable
                key={String(getValue(row, rowKey) ?? i)}
                accessible={false}
                onPress={() => props.onRowClick?.(row)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: mobile ? tokens.dimension.value14 : tokens.dimension.value16,
                  paddingHorizontal: mobile ? tokens.dimension.value20 : tokens.dimension.value16,
                  // Like Web, the minimum height belongs to the narrow layout only.
                  minHeight: mobile ? tokens.extensions.marketList.minimumHeight : undefined,
                  borderBottomWidth: tokens.border.defaultWidth,
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.hover : undefined,
                })}
              >
                <MarketIdentity row={row} props={props} />
                {/* Like Web .kjun-market-price/.kjun-market-change: control and caption type, input and body on narrow lists. */}
                <MarketQuoteTypeContext.Provider value={mobile ? quoteMobile : quoteDesktop}>
                <View
                  style={{
                    marginLeft: tokens.dimension.value12,
                    minWidth: mobile ? tokens.extensions.marketList.mobileQuoteMinimumWidth : undefined,
                    maxWidth: "50%",
                    alignItems: "flex-end",
                  }}
                >
                  <DsPriceCell
                    value={price}
                    formatter={priceFormatter}
                    stale={stale}
                    showFreshness={false}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: tokens.dimension.value6,
                      marginTop: tokens.dimension.value2,
                    }}
                  >
                    {price !== null && props.renderPricePrefix?.(row)}
                    {(finiteNumber(price) !== null ||
                      (!changeLoading(row) && finiteNumber(change) !== null)) &&
                      (closingPrice && !stale ? (
                        <DsBadge variant="secondary" size="xs">
                          종가
                        </DsBadge>
                      ) : (
                        <DsFreshness
                          stale={stale}
                          source={closingPrice ? "close" : source}
                          fetchedAt={fetchedAt}
                        />
                      ))}
                    {changeLoading(row) ? (
                      <DsSkeleton type="block" height={tokens.extensions.marketList.changeSkeletonHeight} width={tokens.extensions.marketList.changeSkeletonWidth} />
                    ) : change !== null ? (
                      <DsSignedValue
                        value={change}
                        stale={stale}
                        showFreshness={false}
                        format="percent"
                        isRaw
                      />
                    ) : (
                      <KText
                        style={{ ...typeStyle('caption'), color: colors.textTertiary }}
                      >
                        -
                      </KText>
                    )}
                  </View>
                </View>
                </MarketQuoteTypeContext.Provider>
              </Pressable>
            );
          })}
        </View>
      </DsDataState>
      <MarketFooter props={props} />
    </View>
  );
}
