import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { KjunDataState } from "./data-state";
import { KjunBadge,KjunEmpty,KjunSkeleton } from "./display";
import {
KjunFreshness,
KjunPriceCell,
KjunSignedValue,
finiteNumber
} from "./financial";
import { KjunMarketSimpleListProps } from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
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
  } = props;
  return (
    <div className="kjun-market-simple-list">
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
                    <KjunPriceCell
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
                      <span>-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </KjunDataState>
      <MarketFooter props={props} />
    </div>
  );
}
