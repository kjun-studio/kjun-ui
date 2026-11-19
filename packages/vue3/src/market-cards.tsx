import { trackFilterScroll } from "../../../shared/package-runtime/filter-scroll";
import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { sparklineCell } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "./runtime/messages";
import { onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { getValue } from "../../../shared/package-runtime/table-model";
import { KjunDataState } from "./data-state";
import { KjunEmpty, KjunSkeleton } from "./display";
import { KjunSparkline } from "./financial-display";
import { marketRowAttrs } from "./market-list";
import { marketBaseProps, queryProps, useMarketCardsModel, type MarketColumn, type MarketFormatter, type MarketMetric, type MetricStorage } from "./market-model";
import { MarketFooter, marketIdentity, type MarketIdentitySlots } from "./market-parts";
import { KjunSignedValue, finiteNumber } from "./number-display";
import { hasContent } from "./runtime/slots";
import { KjunListSkeleton } from "./skeletons";

type MarketPill = ReturnType<ReturnType<typeof useMarketCardsModel>>["pill"];
const kjunMarketCardsProps = {
  ...marketBaseProps,
  /** The rowKey value of the row the app has open (a detail or chart beside the list); it takes the selected fill and aria-current, like MarketTable. */
  activeKey: { type: null as unknown as PropType<unknown>, default: undefined },
  columns: { type: Array as PropType<MarketColumn[]>, required: true },
  metricConfig: { type: Object as PropType<Record<string, MarketMetric>>, required: true },
  excludeKeys: { type: Array as PropType<string[]>, default: () => [] },
  storageNamespace: { type: String, required: true },
  storage: { type: Object as PropType<MetricStorage>, default: undefined },
  sortKey: { type: String as PropType<string | null>, default: undefined },
  sortOrder: { type: String as PropType<"asc" | "desc">, default: "desc" },
  emitSortOnMount: { type: Boolean, default: true },
  currency: { type: String, default: "krw" },
  changeMetricKey: { type: String, default: "change_rate" },
  priceMetricKeys: { type: Array as PropType<string[]>, default: () => ["current_price", "close_price"] },
  metricLoading: { type: Function as PropType<(row: any, key: string) => boolean>, default: () => false },
  formatMetric: { type: Function as PropType<MarketFormatter>, default: undefined },
} as const;
export type KjunMarketCardsProps = ExtractPublicPropTypes<typeof kjunMarketCardsProps>;
/**
 * Metric pills over a compact market list. Slots: metricPrefix({ row, key, isPrice }),
 * list({ selectedKey, selectedPill, metricDisplay }) replaces the list, plus the identity slots. Events: sort(key), page-change.
 */
export const KjunMarketCards = defineComponent({
  name: "KjunMarketCards",
  props: kjunMarketCardsProps,
  emits: { sort: (_key: string) => true, "page-change": (_page: number) => true },
  slots: Object as SlotsType<MarketIdentitySlots & {
    list?: (scope: { selectedKey: string; selectedPill: MarketPill; metricDisplay: (row: any) => string }) => VNodeChild;
    metricPrefix?: (scope: { row: any; key: string; isPrice: boolean }) => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const model = useMarketCardsModel(props, key => emit("sort", key)), pillRow = ref<HTMLElement | null>(null);
    // Like a scrolling FilterGroup: the clipped edges fade and the selected pill stays in view.
    let tracker: ReturnType<typeof trackFilterScroll> | undefined;
    onMounted(() => { if (pillRow.value) { tracker = trackFilterScroll(pillRow.value); tracker.reveal(); } });
    watch(() => model().key, () => tracker?.reveal(), { flush: "post" });
    onBeforeUnmount(() => tracker?.destroy());
    return () => {
      const state = model(), { rows } = props;
      const isPrice = props.priceMetricKeys.includes(state.key), isChange = state.key === props.changeMetricKey;
      const display = (row: any) => {
        const value = getValue(row, state.key);
        return state.pill?.formatter ? state.pill.formatter(value)
          : props.formatMetric ? props.formatMetric(value, state.pill?.format || "text", { currency: props.currency, row, column: props.columns.find(c => c.key === state.key) })
          : value == null ? "-" : String(value);
      };
      const custom = slots.list?.({ selectedKey: state.key, selectedPill: state.pill, metricDisplay: display });
      return (
        <div class="kjun-market-cards">
          <div ref={pillRow} class="kjun-metric-pills" role="group" aria-label={m.value.metrics}>
            {state.pills.map(pill => {
              const sortShown = state.key === pill.key && (props.emitSortOnMount || pill.sortKey === props.sortKey);
              return (
                <button key={pill.key} type="button" aria-pressed={state.key === pill.key} onClick={() => state.select(pill.key)}>
                  <span class="kjun-metric-label" data-label={pill.label}><span>{pill.label}</span></span>
                  {!!pill.sortKey && <span class="kjun-metric-sort" aria-hidden="true" data-visible={sortShown}>
                    {props.sortOrder === "desc" ? "↓" : "↑"}
                  </span>}
                  {/* The arrow is drawn; the order is read as a word. */}
                  {!!pill.sortKey && sortShown && <span class="kjun-sr-only">{props.sortOrder === "desc" ? m.value.descending : m.value.ascending}</span>}
                </button>
              );
            })}
          </div>
          {slots.list ? (hasContent(custom) ? custom : null) : <>
            <KjunDataState {...queryProps(props)} {...marketQueryState(props)} onRetry={props.onRetry} loadingPadding="none" empty={!rows.length}
              loadingText={props.loadingText} loadingDelay={props.loadingDelay}>
              {{
                loading: props.skeleton ? () => <KjunListSkeleton variant="compact" /> : undefined,
                empty: () => <KjunEmpty size="sm" text={(props.emptyMessage ?? m.value.noItems)} description={props.emptySubMessage} />,
                default: () => <div>
                  {rows.map((row: any, i) => {
                    const value = getValue(row, state.key);
                    return (
                      <div key={String(getValue(row, props.rowKey) ?? i)} class="kjun-market-row kjun-market-row-compact" {...marketRowAttrs(row, props, props.activeKey)}>
                        {marketIdentity(row, props, slots)}
                        <div class="kjun-market-quote">
                          {state.pill?.format === "sparkline"
                            ? <KjunSparkline {...sparklineCell(rows, row, props.columns.find(c => c.key === state.key) ?? { key: state.key }, getValue)} width={tokens.extensions.marketTable.sparklineWidth} height={tokens.extensions.marketTable.sparklineHeight} />
                            : state.pill ? props.metricLoading(row, state.key)
                              ? <KjunSkeleton type="line" width={tokens.extensions.marketTable.valueSkeletonWidth} />
                              : isChange && value != null
                                ? <KjunSignedValue value={finiteNumber(value)} formatter={() => display(row)} stale={!!getValue(row, "stale")} tone="pill" />
                                : isPrice && value == null
                                  ? <KjunSkeleton type="line" width={tokens.extensions.financial.priceSkeletonWidth} />
                                  : <div class="kjun-market-metric">{slots.metricPrefix?.({ row, key: state.key, isPrice })}{display(row)}</div>
                            : null}
                        </div>
                      </div>
                    );
                  })}
                </div>,
              }}
            </KjunDataState>
            <MarketFooter {...queryProps(props)} pagination={props.pagination} rowCount={rows.length} showFooter={props.showFooter} calculatedAt={props.calculatedAt}
              footerNote={props.footerNote} totalCount={props.totalCount} unitLabel={props.unitLabel} formatDate={props.formatDate}
              onPage-change={(page: number) => emit("page-change", page)} />
          </>}
        </div>
      );
    };
  },
});
