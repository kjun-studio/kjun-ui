import { defineComponent, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { getValue } from "../../../shared/package-runtime/table-model";
import { KjunDataState } from "./data-state";
import { KjunBadge, KjunEmpty, KjunSkeleton } from "./display";
import { marketBaseProps, queryProps } from "./market-model";
import { MarketFooter, marketIdentity, type MarketIdentitySlots } from "./market-parts";
import { KjunFreshness, KjunPriceCell, KjunSignedValue, finiteNumber } from "./number-display";
import { KjunListSkeleton } from "./skeletons";

/** Enter and Space activate a row the same way a click does, but not when a control inside it handled them. */
export const rowKeydown = (handler: (() => void) | undefined) => (event: KeyboardEvent) => {
  if (handler && event.target === event.currentTarget && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    handler();
  }
};

const kjunMarketSimpleListProps = {
  ...marketBaseProps,
  priceValue: { type: Function as PropType<(row: any) => number | null>, required: true },
  changeValue: { type: Function as PropType<(row: any) => number | null>, required: true },
  changeLoading: { type: Function as PropType<(row: any) => boolean>, default: () => false },
  priceFormatter: { type: Function as PropType<(value: number) => string>, required: true },
  closingPrice: { type: Boolean, default: false },
} as const;
export type KjunMarketSimpleListProps = ExtractPublicPropTypes<typeof kjunMarketSimpleListProps>;
/** Slots: pricePrefix({ row }) plus the identity slots. Event: page-change. */
export const KjunMarketSimpleList = defineComponent({
  name: "KjunMarketSimpleList",
  props: kjunMarketSimpleListProps,
  emits: { "page-change": (_page: number) => true },
  slots: Object as SlotsType<MarketIdentitySlots & { pricePrefix?: (scope: { row: any }) => VNodeChild }>,
  setup(props, { slots, emit }) {
    return () => {
      const { rows } = props;
      return (
        <div class="kjun-market-simple-list">
          <KjunDataState {...queryProps(props)} onRetry={props.onRetry} loadingPadding="none" empty={!rows.length} emptyText={props.emptyMessage}>
            {{
              loading: () => <KjunListSkeleton />,
              empty: () => <KjunEmpty text={props.emptyMessage} description={props.emptySubMessage} />,
              default: () => <div>
                {rows.map((row: any, i) => {
                  const price = props.priceValue(row), change = props.changeValue(row), stale = !!getValue(row, "stale");
                  const source = String(getValue(row, "source") || ""), fetchedAt = String(getValue(row, "fetched_at") || "");
                  const activate = props.onRowClick && (() => props.onRowClick?.(row));
                  return (
                    <div key={String(getValue(row, props.rowKey) ?? i)} class="kjun-market-row" role={activate ? "button" : undefined}
                      tabindex={activate ? 0 : undefined} onClick={() => activate?.()} onKeydown={rowKeydown(activate)}>
                      {marketIdentity(row, props, slots)}
                      <div class="kjun-market-quote">
                        <div class="kjun-market-price"><KjunPriceCell value={price} formatter={props.priceFormatter} stale={stale} showFreshness={false} /></div>
                        <div class="kjun-market-change">
                          {price !== null && slots.pricePrefix?.({ row })}
                          {(finiteNumber(price) !== null || (!props.changeLoading(row) && finiteNumber(change) !== null)) && (props.closingPrice && !stale
                            ? <KjunBadge variant="secondary" size="xs">종가</KjunBadge>
                            : <KjunFreshness stale={stale} source={props.closingPrice ? "close" : source} fetchedAt={fetchedAt} />)}
                          {props.changeLoading(row)
                            ? <KjunSkeleton type="block" height={tokens.extensions.marketList.changeSkeletonHeight} width={tokens.extensions.marketList.changeSkeletonWidth} />
                            : change !== null ? <KjunSignedValue value={change} stale={stale} showFreshness={false} format="percent" isRaw /> : <span>-</span>}
                        </div>
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
        </div>
      );
    };
  },
});
