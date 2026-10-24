import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { View,useWindowDimensions } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunDataState } from "./data-state";
import { KjunBadge,KjunEmpty,KjunSkeleton } from "./display";
import {
KjunFreshness,
KjunPriceCell,
KjunSignedValue,
finiteNumber
} from "./financial";
import { KText } from "./internal";
import { MarketQuoteTypeContext } from "./number-display";
const changeWeight = { fontWeight: typeStyle("label").fontWeight };
const quoteDesktop = { price: typeStyle("control"), change: { ...typeStyle("caption"), ...changeWeight } };
const quoteMobile = { price: typeStyle("input"), change: { ...typeStyle("body"), ...changeWeight } };
import { KjunMarketSimpleListProps } from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { useKjunStyles } from "./provider";
import { KjunListSkeleton } from "./skeletons";
import { getValue } from "./table";
export function KjunMarketSimpleList<
  Row extends object = Record<string, unknown>
>(props: KjunMarketSimpleListProps<Row>) {
  const m = useKjunMessages();
  const {
      rows = [],
      rowKey = "id",
      priceValue,
      changeValue,
      changeLoading = () => false,
      priceFormatter,
      closingPrice = false,
      emptyMessage = m.noItems,
      emptySubMessage = "",
    } = props,
    { colors } = useKjunStyles(),
    mobile = useWindowDimensions().width < tokens.responsive.market;
  return (
    <View>
      <KjunDataState
        {...props}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={props.skeleton === false ? undefined : <KjunListSkeleton />}
        emptyContent={
          <KjunEmpty text={emptyMessage} description={emptySubMessage} />
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
                  <KjunPriceCell
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
                        <KjunBadge variant="secondary" size="xs">
                          {m.closePrice}
                        </KjunBadge>
                      ) : (
                        <KjunFreshness
                          stale={stale}
                          source={closingPrice ? "close" : source}
                          fetchedAt={fetchedAt}
                        />
                      ))}
                    {changeLoading(row) ? (
                      <KjunSkeleton type="block" height={tokens.extensions.marketList.changeSkeletonHeight} width={tokens.extensions.marketList.changeSkeletonWidth} />
                    ) : change !== null ? (
                      <KjunSignedValue
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
      </KjunDataState>
      <MarketFooter props={props} />
    </View>
  );
}
