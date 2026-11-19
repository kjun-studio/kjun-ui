import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { sparklineCell } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunSignedValue,
KjunSparkline,
finiteNumber
} from "./financial";
import {
KjunMarketCardsProps,
useMarketCards
} from "./market-model";
import { MarketFooter,MarketIdentity,MarketRow } from "./market-parts";
import { useFilterScroll } from "./use-filter-scroll";
import { KjunListSkeleton } from "./skeletons";
import { getValue } from "./table";
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
  } = props;
  const state = useMarketCards(props),
    // Like a scrolling FilterGroup: the clipped edges fade and the selected pill stays in view.
    pillRow = useFilterScroll(true, false, state.key),
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
    <div className="kjun-market-cards">
      <div ref={pillRow} className="kjun-metric-pills" role="group" aria-label={m.metrics}>
        {state.pills.map((pill) => (
          <button
            key={pill.key}
            type="button"
            aria-pressed={state.key === pill.key}
            onClick={() => state.select(pill.key)}
          >
            <span className="kjun-metric-label" data-label={pill.label}><span>{pill.label}</span></span>
            {!!pill.sortKey && (
              <span className="kjun-metric-sort" aria-hidden="true" data-visible={sortShown(pill)}>
                {sortOrder === "desc" ? "↓" : "↑"}
              </span>
            )}
            {/* The arrow is drawn; the order is read as a word. */}
            {!!pill.sortKey && sortShown(pill) && (
              <span className="kjun-sr-only">{sortOrder === "desc" ? m.descending : m.ascending}</span>
            )}
          </button>
        ))}
      </div>
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
            <div>
              {state.pill && <div className="kjun-market-column-label">{state.pill.label}</div>}
              {rows.map((row, i) => (
                <MarketRow
                  key={String(getValue(row, rowKey) ?? i)}
                  row={row}
                  props={props}
                  selectedKey={props.selectedRowKey}
                  compact
                >
                  <MarketIdentity row={row} props={props} />
                  <div className="kjun-market-quote">
                    {state.pill?.format === "sparkline" ? (
                      <KjunSparkline
                        {...sparklineCell(rows, row, props.columns.find((c) => c.key === state.key) ?? { key: state.key }, getValue)}
                        width={tokens.extensions.marketTable.sparklineWidth}
                        height={tokens.extensions.marketTable.sparklineHeight}
                      />
                    ) : state.pill ? (
                      <>
                        {metricLoading(row, state.key) ? (
                          <KjunSkeleton type="line" width={tokens.extensions.marketTable.valueSkeletonWidth} />
                        ) : isChange && getValue(row, state.key) != null ? (
                          <KjunSignedValue
                            value={finiteNumber(getValue(row, state.key))}
                            formatter={() => display(row)}
                            stale={!!getValue(row, "stale")}
                            tone="pill"
                          />
                        ) : isPrice && getValue(row, state.key) == null ? (
                          <KjunSkeleton type="line" width={tokens.extensions.financial.priceSkeletonWidth} />
                        ) : (
                          <div className="kjun-market-metric">
                            {props.renderMetricPrefix?.(
                              row,
                              state.key,
                              isPrice
                            )}
                            {display(row)}
                          </div>
                        )}

                      </>
                    ) : null}
                  </div>
                </MarketRow>
              ))}
            </div>
          </KjunDataState>
          <MarketFooter props={props} />
        </>
      )}
    </div>
  );
}
