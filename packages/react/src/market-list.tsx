import { tokens } from "@kjun/tokens";
import { DsDataState } from "./data-state";
import { DsBadge,DsEmpty,DsSkeleton } from "./display";
import {
DsFreshness,
DsPriceCell,
DsSignedValue,
finiteNumber
} from "./financial";
import { DsMarketSimpleListProps } from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
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
  } = props;
  return (
    <div className="kjun-market-simple-list">
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
        <div>
          {rows.map((row, i) => {
            const price = priceValue(row),
              change = changeValue(row),
              stale = !!getValue(row, "stale"),
              source = String(getValue(row, "source") || ""),
              fetchedAt = String(getValue(row, "fetched_at") || "");
            return (
              <div
                key={String(getValue(row, rowKey) ?? i)}
                className="kjun-market-row"
                role={props.onRowClick ? "button" : undefined}
                tabIndex={props.onRowClick ? 0 : undefined}
                onClick={() => props.onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (props.onRowClick && event.target === event.currentTarget &&
                      !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    props.onRowClick?.(row);
                  }
                }}
              >
                <MarketIdentity row={row} props={props} />
                <div className="kjun-market-quote">
                  <div className="kjun-market-price">
                    <DsPriceCell
                      value={price}
                      formatter={priceFormatter}
                      stale={stale}
                      showFreshness={false}
                    />
                  </div>
                  <div className="kjun-market-change">
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
                      <span>-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DsDataState>
      <MarketFooter props={props} />
    </div>
  );
}
