import { tokens } from "@kjun/tokens";
import { DsDataState } from "./data-state";
import { DsEmpty,DsSkeleton } from "./display";
import {
DsSignedValue,
DsSparkline,
finiteNumber
} from "./financial";
import {
DsMarketCardsProps,
useMarketCards
} from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
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
  } = props;
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
    <div className="kjun-market-cards">
      <div className="kjun-metric-pills" role="group" aria-label="표시 지표">
        {state.pills.map((pill) => (
          <button
            key={pill.key}
            type="button"
            aria-pressed={state.key === pill.key}
            onClick={(event) => {
              state.select(pill.key);
              event.currentTarget.scrollIntoView({
                inline: "center",
                block: "nearest",
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "auto"
                  : "smooth",
              });
            }}
          >
            {pill.label}
            {state.key === pill.key &&
              pill.sortKey &&
              (emitSortOnMount || pill.sortKey === sortKey) && (
                <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
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
          <DsDataState
            {...props}
            loadingPadding="none"
            empty={!rows.length}
            loadingContent={<DsListSkeleton variant="compact" />}
            emptyContent={
              <DsEmpty text={emptyMessage} description={emptySubMessage} />
            }
          >
            <div>
              {state.pill && <div className="kjun-market-column-label">{state.pill.label}</div>}
              {rows.map((row, i) => (
                <div
                  key={String(getValue(row, rowKey) ?? i)}
                  className="kjun-market-row kjun-market-row-compact"
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
                </div>
              ))}
            </div>
          </DsDataState>
          <MarketFooter props={props} />
        </>
      )}
    </div>
  );
}
