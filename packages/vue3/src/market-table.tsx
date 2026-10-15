import { defineComponent, onBeforeUnmount, onMounted, onUpdated, ref, type ExtractPublicPropTypes, type PropType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { webMarketLayout } from "../../../shared/package-runtime/market-layout";
import { getValue } from "../../../shared/package-runtime/table-model";
import { watchTrailingOverflow } from "../../../shared/package-runtime/trailing-overflow";
import { KjunIconToggle } from "./actions";
import { KjunIcon } from "./button";
import { KjunDataState } from "./data-state";
import { KjunEmpty, KjunSkeleton } from "./display";
import { KjunCollectionMark, KjunSparkline } from "./financial-display";
import { marketBaseProps, queryProps, type MarketColumn, type MarketFormatter } from "./market-model";
import { KjunMarketTableSkeleton, MarketFooter, marketColumns, marketIdentity } from "./market-parts";
import { KjunFreshness, KjunPriceCell, KjunSignedValue, finiteNumber } from "./number-display";
import { domainRef } from "./runtime/refs";

const kjunMarketTableProps = {
  ...marketBaseProps,
  columns: { type: Array as PropType<MarketColumn[]>, required: true },
  cellLoading: { type: Function as PropType<(row: any, column: MarketColumn) => boolean>, default: () => false },
  showActions: { type: Boolean, default: true },
  togglingInterest: { type: null as unknown as PropType<unknown>, default: undefined },
  togglingFavorite: { type: null as unknown as PropType<unknown>, default: undefined },
  sortKey: { type: String as PropType<string | null>, default: undefined },
  sortOrder: { type: String as PropType<"asc" | "desc">, default: "desc" },
  priceFormatter: { type: Function as PropType<(value: number) => string>, default: undefined },
  currency: { type: String, default: "krw" },
  embedded: { type: Boolean, default: false },
  formatMetric: { type: Function as PropType<MarketFormatter>, default: undefined },
} as const;
export type KjunMarketTableProps = ExtractPublicPropTypes<typeof kjunMarketTableProps>;
/**
 * Slots: cell({ row, column }) plus the identity slots. Events: sort(key), toggle-interest(row), toggle-favorite(row), page-change(page).
 */
export const KjunMarketTable = defineComponent({
  name: "KjunMarketTable",
  props: kjunMarketTableProps,
  emits: { sort: (_key: string) => true, "toggle-interest": (_row: any) => true, "toggle-favorite": (_row: any) => true, "page-change": (_page: number) => true },
  setup(props, { slots, emit }) {
    // Like Native and React: the trailing edge fades while columns still overflow it.
    const scroller = ref<HTMLElement | null>(null), fadeEnd = ref(false);
    let stop: (() => void) | undefined, watched: HTMLElement | null = null;
    const observe = () => {
      if (scroller.value === watched) return;
      stop?.(); watched = scroller.value;
      stop = watched ? watchTrailingOverflow(watched, hidden => { fadeEnd.value = hidden; }) : undefined;
    };
    onMounted(observe); onUpdated(observe); onBeforeUnmount(() => stop?.());
    const render = (row: any, col: MarketColumn): VNodeChild => {
      const value = getValue(row, col.key), stale = !!getValue(row, "stale");
      if (props.cellLoading(row, col))
        return <KjunSkeleton type="block" height={tokens.extensions.marketTable.valueSkeletonHeight} width={tokens.extensions.marketTable.valueSkeletonWidth} />;
      if (slots.cell) return slots.cell({ row, column: col });
      if (["stock_name", "name", "symbol"].includes(col.key)) return marketIdentity(row, props, slots);
      if (col.type === "sparkline")
        return <KjunSparkline data={Array.isArray(value) ? (value as number[]) : []} width={tokens.extensions.marketTable.sparklineWidth} height={tokens.extensions.marketTable.sparklineHeight} />;
      if (col.type === "price") return <KjunPriceCell value={finiteNumber(value)} formatter={props.priceFormatter} stale={stale} showFreshness={false} />;
      const context = { currency: props.currency, row, column: col };
      if (col.type === "percent") return value == null ? "-" : (
        <KjunSignedValue value={finiteNumber(value)} format="percent" isRaw stale={stale} showFreshness={false}
          formatter={props.formatMetric ? (number: number) => props.formatMetric!(number, col.type!, context) : undefined} />
      );
      const text = props.formatMetric ? props.formatMetric(value, col.type || "text", context) : value == null ? "-" : String(value);
      return ["investor", "net_amount", "net_volume"].includes(col.type || "")
        ? <KjunSignedValue value={finiteNumber(value)} formatter={() => text} stale={stale} showFreshness={false} />
        : text;
    };
    const toggleLabel = (row: any, kind: string, active: boolean) =>
      [props.primaryLabel?.(row) || String(getValue(row, "name") || ""), kind, active ? "해제" : "등록"].filter(Boolean).join(" ");
    return () => {
      const { rows, columns, showActions, sortKey, sortOrder } = props;
      return (
        <div class="kjun-market-table" data-embedded={String(props.embedded)} ref={domainRef(showActions && rows.length > 0 && !props.loading)}>
          <KjunDataState {...queryProps(props)} onRetry={props.onRetry} loadingPadding="none" empty={!rows.length} emptyText={props.emptyMessage}>
            {{
              loading: () => <KjunMarketTableSkeleton columns={columns} showActions={showActions} />,
              empty: () => <KjunEmpty text={props.emptyMessage} description={props.emptySubMessage} />,
              default: () => (
                <div class="kjun-table-scroll" ref={scroller} data-fade-end={fadeEnd.value || undefined}>
                  <table aria-label="시장 데이터" class="kjun-market-table-grid" style={webMarketLayout(columns, showActions).tableStyle}>
                    {marketColumns(columns, showActions)}
                    <thead>
                      <tr>
                        {showActions && (
                          <th class="kjun-market-actions">
                            <span class="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
                            <span class="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
                          </th>
                        )}
                        {columns.map(col => (
                          <th key={col.key} style={{ textAlign: col.align }}
                            aria-sort={col.sortable ? sortKey === col.key ? sortOrder === "asc" ? "ascending" : "descending" : "none" : undefined}>
                            {col.sortable ? (
                              <button type="button" onClick={() => emit("sort", col.key)}>
                                {col.label}
                                <KjunIcon name={sortKey === col.key ? sortOrder === "asc" ? "sort-ascending" : "sort-descending" : "arrows-sort"} size={tokens.extensions.marketTable.sortIconSize} />
                              </button>
                            ) : col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: any, i) => {
                        const id = getValue(row, props.rowKey);
                        const priceCol = columns.find(c => c.type === "price" && !props.cellLoading(row, c) && getValue(row, c.key) != null);
                        const interest = !!props.interestKeys?.has(id), favorite = !!props.favoriteKeys?.has(id);
                        return (
                          <tr key={String(id ?? i)} onClick={() => props.onRowClick?.(row)}>
                            {showActions && (
                              <td class="kjun-market-actions">
                                <KjunIconToggle size="xs" active={interest} activeIcon="heart" activeColor="var(--_kjun-color-interest)"
                                  ariaLabel={toggleLabel(row, "관심", interest)} loading={props.togglingInterest === id} onToggle={() => emit("toggle-interest", row)} />
                                <KjunIconToggle size="xs" active={favorite} activeIcon="star" activeColor="var(--_kjun-color-favorite)"
                                  ariaLabel={toggleLabel(row, "즐겨찾기", favorite)} loading={props.togglingFavorite === id} onToggle={() => emit("toggle-favorite", row)} />
                              </td>
                            )}
                            {columns.map(col => {
                              return (
                                <td key={col.key} style={{ textAlign: col.align, fontWeight: col.weight === "bold" ? tokens.typography.control.fontWeight : undefined }}>
                                  {render(row, col)}
                                  {col.key === priceCol?.key && (
                                    <KjunFreshness stale={!!getValue(row, "stale")} source={String(getValue(row, "source") || "")} fetchedAt={String(getValue(row, "fetched_at") || "")} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ),
            }}
          </KjunDataState>
          <MarketFooter {...queryProps(props)} pagination={props.pagination} rowCount={rows.length} showFooter={props.showFooter} calculatedAt={props.calculatedAt}
            footerNote={props.footerNote} totalCount={props.totalCount} unitLabel={props.unitLabel} formatDate={props.formatDate}
            onPage-change={(page: number) => emit("page-change", page)} />
        </div>
      );
    };
  },
});
