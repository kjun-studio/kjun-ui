import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { View,useWindowDimensions } from "react-native";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunPriceCell,
KjunSignedValue,
finiteNumber
} from "./financial";
import { KText } from "./internal";
import { MarketQuoteTypeContext, PriceStatus } from "./number-display";
const changeWeight = { fontWeight: typeStyle("label").fontWeight };
const quoteDesktop = { price: typeStyle("control"), change: { ...typeStyle("caption"), ...changeWeight } };
const quoteMobile = { price: typeStyle("input"), change: { ...typeStyle("body"), ...changeWeight } };
import { KjunMarketSimpleListProps } from "./market-model";
import { MarketFooter,MarketIdentity,MarketRow } from "./market-parts";
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
      emptyMessage = m.noItems,
      emptySubMessage = "",
    } = props,
    { colors } = useKjunStyles(),
    mobile = useWindowDimensions().width < tokens.responsive.market;
  return (
    <View>
      <KjunDataState
        {...props}
        {...marketQueryState(props)}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={props.skeleton === false ? undefined : <KjunListSkeleton />}
        emptyContent={
          <KjunEmpty size="sm" text={emptyMessage} description={emptySubMessage} />
        }
      >
        <View style={{ gap: tokens.dimension.value2 }}>
          {rows.map((row, i) => {
            const price = priceValue(row),
              change = changeValue(row),
              stale = !!getValue(row, "stale");
            return (
              <MarketRow
                key={String(getValue(row, rowKey) ?? i)}
                row={row}
                props={props}
                selectedKey={props.selectedRowKey}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: mobile ? tokens.dimension.value14 : tokens.dimension.value16,
                  paddingHorizontal: mobile ? tokens.dimension.value12 : tokens.dimension.value8,
                  // Like Web, the minimum height belongs to the narrow layout only.
                  minHeight: mobile ? tokens.extensions.marketList.minimumHeight : undefined,
                }}
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
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: tokens.extensions.financial.statusGap,
                      marginTop: tokens.dimension.value2,
                    }}
                  >
                    {price !== null && props.renderPricePrefix?.(row)}
                    {/* A status shows whenever the app gives one, also with no price (trading halted, no quote). */}
                    <PriceStatus status={props.renderStatus?.(row)} />
                    {changeLoading(row) ? (
                      <KjunSkeleton type="line" role="numberSm" width={tokens.extensions.marketList.changeSkeletonWidth} />
                    ) : change !== null ? (
                      <KjunSignedValue
                        value={change}
                        stale={stale}
                        format="percent"
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
              </MarketRow>
            );
          })}
        </View>
      </KjunDataState>
      <MarketFooter props={props} />
    </View>
  );
}
