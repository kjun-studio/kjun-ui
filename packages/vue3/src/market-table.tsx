import { fromNestedControl } from "../../../shared/package-runtime/nested-controls";
import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { sparklineCell } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "./runtime/messages";
import { onBeforeUnmount, onMounted, onUpdated, ref, type ExtractPublicPropTypes, type PropType, type VNode, type VNodeChild, type SlotsType } from "vue";
import { defineComponent } from "./runtime/component";
import { isComposingKey, tokens } from "@kjun-ui/tokens";
import { webMarketLayout } from "../../../shared/package-runtime/market-layout";
import { getValue } from "../../../shared/package-runtime/table-model";
import { watchLeadingScroll, watchTrailingOverflow } from "../../../shared/package-runtime/trailing-overflow";
import { marketCellKind, marketColumnFlash, marketPinnedIdentity, marketRowActivates, marketRowLabel, marketSortIcon, marketSortState, marketStatusColumn } from "../../../shared/package-runtime/market-table";
import { KjunIconToggle } from "./actions";
import { KjunIcon } from "./button";
import { KjunDataState } from "./data-state";
import { KjunEmpty, KjunSkeleton } from "./display";
import { KjunCollectionMark, KjunSparkline } from "./financial-display";
import { marketBaseProps, queryProps, type MarketColumn, type MarketFormatter } from "./market-model";
import { KjunMarketTableSkeleton, MarketFooter, marketColumns, marketIdentity, type MarketIdentitySlots } from "./market-parts";
import { KjunPriceCell, KjunSignedValue, finiteNumber, priceStatus } from "./number-display";
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
  /** The toggle and identity columns stay in view while the other columns scroll sideways. */
  stickyIdentity: { type: Boolean, default: true },
  /** false drops the lines between rows; the header keeps its line. */
  divider: { type: Boolean, default: true },
  /** The rowKey value of the row the app has open; it takes the selected fill and aria-current. */
  activeKey: { type: null as unknown as PropType<unknown>, default: undefined },
  formatMetric: { type: Function as PropType<MarketFormatter>, default: undefined },
} as const;
export type KjunMarketTableProps = ExtractPublicPropTypes<typeof kjunMarketTableProps>;
/**
 * Slots: cell-<key>({ row, column }) for one column, cell({ row, column }) for every column (a column slot wins, then cell, then the column's render), status({ row }) — the row's quote status after the price column's value — plus the identity slots. Events: sort(key), toggle-interest(row), toggle-favorite(row), page-change(page).
 */
export const KjunMarketTable = defineComponent({
  name: "KjunMarketTable",
  props: kjunMarketTableProps,
  emits: { sort: (_key: string) => true, "toggle-interest": (_row: any) => true, "toggle-favorite": (_row: any) => true, "page-change": (_page: number) => true },
  slots: Object as SlotsType<MarketIdentitySlots & { [key: `cell-${string}`]: ((scope: { row: any; column: MarketColumn }) => VNodeChild) | undefined; cell?: (scope: { row: any; column: MarketColumn }) => VNodeChild; status?: (scope: { row: any }) => VNode[] }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    // Like Native and React: the trailing edge fades while columns still overflow it, and pinned columns cast an edge once scrolled.
    const scroller = ref<HTMLElement | null>(null), fadeEnd = ref(false), scrolled = ref(false);
    let stop: (() => void) | undefined, watched: HTMLElement | null = null;
    const observe = () => {
      if (scroller.value === watched) return;
      stop?.(); watched = scroller.value;
      if (!watched) { stop = undefined; return; }
      const stopEnd = watchTrailingOverflow(watched, hidden => { fadeEnd.value = hidden; });
      const stopStart = watchLeadingScroll(watched, moved => { scrolled.value = moved; });
      stop = () => { stopEnd(); stopStart(); };
    };
    onMounted(observe); onUpdated(observe); onBeforeUnmount(() => stop?.());
    const render = (row: any, col: MarketColumn): VNodeChild => {
      const value = getValue(row, col.key), stale = !!getValue(row, "stale");
      if (props.cellLoading(row, col))
        return <KjunSkeleton type="line" width={tokens.extensions.marketTable.valueSkeletonWidth} />;
      const own = slots[`cell-${col.key}`] ?? slots.cell;
      if (own) return own({ row, column: col });
      if (col.render) return col.render(row, col);
      const kind = marketCellKind(col), context = { currency: props.currency, row, column: col };
      if (kind === "identity") return marketIdentity(row, props, slots);
      if (kind === "sparkline")
        return <KjunSparkline {...sparklineCell(props.rows, row, col, getValue)} width={tokens.extensions.marketTable.sparklineWidth} height={tokens.extensions.marketTable.sparklineHeight} />;
      if (kind === "price") return <KjunPriceCell value={finiteNumber(value)} formatter={props.priceFormatter} stale={stale} flash={marketColumnFlash(col)} />;
      if (kind === "percent") return value == null ? "-" : (
        <KjunSignedValue value={finiteNumber(value)} format="percent" stale={stale}
          formatter={props.formatMetric ? (number: number) => props.formatMetric!(number, col.type!, context) : undefined} />
      );
      const text = props.formatMetric ? props.formatMetric(value, col.type || "text", context) : value == null ? "-" : String(value);
      return kind === "signed" ? <KjunSignedValue value={finiteNumber(value)} formatter={() => text} stale={stale} /> : text;
    };
    const toggleLabel = (row: any, kind: "watchToggle" | "favoriteToggle", active: boolean) =>
      m.value[kind](marketRowLabel(row, props.primaryLabel, getValue), active);
    // Like KjunTable: a row that opens takes focus and opens with Enter or Space.
    const rowKeyDown = (event: KeyboardEvent, row: any) => {
      if (!props.onRowClick || event.target !== event.currentTarget || event.defaultPrevented || isComposingKey(event)) return;
      if (marketRowActivates(event.key)) { event.preventDefault(); props.onRowClick(row); }
    };
    return () => {
      const { rows, columns, showActions, sortKey, sortOrder } = props;
      const pinned = marketPinnedIdentity(columns, props.stickyIdentity);
      // Pinned cells: the toggle column, then the identity column, whose end casts the edge.
      const pin = (key: string | null) => !pinned ? {} : key === null
        ? { "data-pin": "start" } : key === pinned ? { "data-pin": showActions ? "identity" : "start", "data-pin-edge": "" } : {};
      return (
        <div class="kjun-market-table" data-embedded={String(props.embedded)} data-divider={props.divider ? undefined : "false"} ref={domainRef(showActions && rows.length > 0 && !props.loading)}>
          <KjunDataState {...queryProps(props)} {...marketQueryState(props)} onRetry={props.onRetry} loadingPadding="none" empty={!rows.length} emptyText={(props.emptyMessage ?? m.value.noItems)}
            loadingText={props.loadingText} loadingDelay={props.loadingDelay}>
            {{
              loading: props.skeleton ? () => <KjunMarketTableSkeleton columns={columns} showActions={showActions} /> : undefined,
              empty: () => <KjunEmpty size="sm" text={(props.emptyMessage ?? m.value.noItems)} description={props.emptySubMessage} />,
              default: () => (
                <div class="kjun-table-scroll" ref={scroller} data-fade-end={fadeEnd.value || undefined} data-scrolled={scrolled.value || undefined}>
                  <table aria-label={m.value.marketData} class="kjun-market-table-grid" style={webMarketLayout(columns, showActions).tableStyle}>
                    {marketColumns(columns, showActions)}
                    <thead>
                      <tr>
                        {showActions && (
                          <th class="kjun-market-actions" {...pin(null)}>
                            {/* The marks are drawings; the header column still needs a name. */}
                            <span class="kjun-sr-only">{m.value.collectionMarks}</span>
                            <span class="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
                            <span class="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
                          </th>
                        )}
                        {columns.map(col => {
                          const sort = marketSortState(col, sortKey, sortOrder);
                          return (
                            <th key={col.key} style={{ textAlign: col.align }} aria-sort={sort} {...pin(col.key)}>
                              {sort ? (
                                <button type="button" onClick={() => emit("sort", col.key)}>
                                  {col.label}
                                  <KjunIcon name={marketSortIcon(sort)} size={tokens.extensions.marketTable.sortIconSize} />
                                </button>
                              ) : col.label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: any, i) => {
                        const id = getValue(row, props.rowKey);
                        const statusKey = marketStatusColumn(columns, row, props.cellLoading, getValue);
                        const interest = !!props.interestKeys?.has(id), favorite = !!props.favoriteKeys?.has(id);
                        return (
                          <tr key={String(id ?? i)} tabindex={props.onRowClick ? 0 : undefined} data-clickable={props.onRowClick ? "" : undefined}
                            aria-current={props.activeKey != null && id === props.activeKey ? "true" : undefined}
                            onKeydown={(event: KeyboardEvent) => rowKeyDown(event, row)}
                            onClick={(event: MouseEvent) => { if (!fromNestedControl(event)) props.onRowClick?.(row); }}>
                            {showActions && (
                              <td class="kjun-market-actions" {...pin(null)}>
                                <KjunIconToggle size="xs" active={interest} activeIcon="heart" activeColor="var(--_kjun-color-interest)"
                                  ariaLabel={toggleLabel(row, "watchToggle", interest)} loading={props.togglingInterest === id} onToggle={() => emit("toggle-interest", row)} />
                                <KjunIconToggle size="xs" active={favorite} activeIcon="star" activeColor="var(--_kjun-color-favorite)"
                                  ariaLabel={toggleLabel(row, "favoriteToggle", favorite)} loading={props.togglingFavorite === id} onToggle={() => emit("toggle-favorite", row)} />
                              </td>
                            )}
                            {columns.map(col => {
                              return (
                                <td key={col.key} {...pin(col.key)} style={{ textAlign: col.align, fontWeight: col.weight === "bold" ? tokens.typography.control.fontWeight : undefined }}>
                                  {render(row, col)}
                                  {col.key === statusKey && priceStatus(slots.status?.({ row }))}
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
