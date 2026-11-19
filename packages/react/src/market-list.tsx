import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunPriceCell,
KjunSignedValue,
finiteNumber
} from "./financial";
import { PriceStatus } from "./number-display";
import { KjunMarketSimpleListProps } from "./market-model";
import { MarketFooter,MarketIdentity,MarketRow } from "./market-parts";
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
  } = props;
  return (
    <div className="kjun-market-simple-list">
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
        <div>
          {rows.map((row, i) => {
            const price = priceValue(row),
              change = changeValue(row),
              stale = !!getValue(row, "stale");
            return (
              <MarketRow key={String(getValue(row, rowKey) ?? i)} row={row} props={props} selectedKey={props.selectedRowKey}>
                <MarketIdentity row={row} props={props} />
                <div className="kjun-market-quote">
                  <div className="kjun-market-price">
                    <KjunPriceCell
                      value={price}
                      formatter={priceFormatter}
                      stale={stale}
                    />
                  </div>
                  <div className="kjun-market-change">
                    {price !== null && props.renderPricePrefix?.(row)}
                    {/* A status shows whenever the app gives one, also with no price (trading halted, no quote). */}
                    <PriceStatus status={props.renderStatus?.(row)} />
                    {changeLoading(row) ? (
                      <KjunSkeleton type="line" width={tokens.extensions.marketList.changeSkeletonWidth} />
                    ) : change !== null ? (
                      <KjunSignedValue
                        value={change}
                        stale={stale}
                        format="percent"
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              </MarketRow>
            );
          })}
        </div>
      </KjunDataState>
      <MarketFooter props={props} />
    </div>
  );
}
