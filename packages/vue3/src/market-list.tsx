import { fromNestedControl } from "../../../shared/package-runtime/nested-controls";
import { isSelectedMarketRow, marketQueryState } from "../../../shared/package-runtime/market-query";
import { useKjunMessages } from "./runtime/messages";
import { type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { getValue } from "../../../shared/package-runtime/table-model";
import { KjunDataState } from "./data-state";
import { KjunEmpty, KjunSkeleton } from "./display";
import { marketBaseProps, queryProps } from "./market-model";
import { MarketFooter, marketIdentity, type MarketIdentitySlots } from "./market-parts";
import { KjunPriceCell, KjunSignedValue, finiteNumber, priceStatus } from "./number-display";
import { KjunListSkeleton } from "./skeletons";

/** Enter and Space activate a row the same way a click does, but not when a control inside it handled them. */
export const rowKeydown = (handler: (() => void) | undefined) => (event: KeyboardEvent) => {
  if (handler && event.target === event.currentTarget && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    handler();
  }
};

/** Like React's MarketRow: a button only when the app listens for clicks, aria-current on the selected row. */
export function marketRowAttrs(row: object, props: { rowKey: string; onRowClick?: (row: any) => void }, selectedRowKey: unknown) {
  const activate = props.onRowClick && (() => props.onRowClick?.(row));
  return {
    role: activate ? "button" : undefined,
    tabindex: activate ? 0 : undefined,
    "aria-current": isSelectedMarketRow(getValue(row, props.rowKey || "id"), selectedRowKey) || undefined,
    onClick: activate && ((event: MouseEvent) => { if (!fromNestedControl(event)) activate(); }),
    onKeydown: activate && rowKeydown(activate),
  };
}

const kjunMarketSimpleListProps = {
  ...marketBaseProps,
  /** The rowKey value of the row the rest of the screen shows (a chart or detail beside the list): a quiet fill and aria-current. */
  selectedRowKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  priceValue: { type: Function as PropType<(row: any) => number | null>, required: true },
  changeValue: { type: Function as PropType<(row: any) => number | null>, required: true },
  changeLoading: { type: Function as PropType<(row: any) => boolean>, default: () => false },
  priceFormatter: { type: Function as PropType<(value: number) => string>, required: true },
} as const;
export type KjunMarketSimpleListProps = ExtractPublicPropTypes<typeof kjunMarketSimpleListProps>;
/** Slots: pricePrefix({ row }), status({ row }) — the row's quote status before the change — plus the identity slots. Event: page-change. */
export const KjunMarketSimpleList = defineComponent({
  name: "KjunMarketSimpleList",
  props: kjunMarketSimpleListProps,
  emits: { "page-change": (_page: number) => true },
  slots: Object as SlotsType<MarketIdentitySlots & { pricePrefix?: (scope: { row: any }) => VNodeChild; status?: (scope: { row: any }) => VNode[] }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    return () => {
      const { rows } = props;
      return (
        <div class="kjun-market-simple-list">
          <KjunDataState {...queryProps(props)} {...marketQueryState(props)} onRetry={props.onRetry} loadingPadding="none" empty={!rows.length} emptyText={(props.emptyMessage ?? m.value.noItems)}
            loadingText={props.loadingText} loadingDelay={props.loadingDelay}>
            {{
              loading: props.skeleton ? () => <KjunListSkeleton /> : undefined,
              empty: () => <KjunEmpty size="sm" text={(props.emptyMessage ?? m.value.noItems)} description={props.emptySubMessage} />,
              default: () => <div>
                {rows.map((row: any, i) => {
                  const price = props.priceValue(row), change = props.changeValue(row), stale = !!getValue(row, "stale");
                  return (
                    <div key={String(getValue(row, props.rowKey) ?? i)} class="kjun-market-row" {...marketRowAttrs(row, props, props.selectedRowKey)}>
                      {marketIdentity(row, props, slots)}
                      <div class="kjun-market-quote">
                        <div class="kjun-market-price"><KjunPriceCell value={price} formatter={props.priceFormatter} stale={stale} /></div>
                        <div class="kjun-market-change">
                          {price !== null && slots.pricePrefix?.({ row })}
                          {/* A status shows whenever the app gives one, also with no price (trading halted, no quote). */}
                          {priceStatus(slots.status?.({ row }))}
                          {props.changeLoading(row)
                            ? <KjunSkeleton type="line" width={tokens.extensions.marketList.changeSkeletonWidth} />
                            : change !== null ? <KjunSignedValue value={change} stale={stale} format="percent" /> : <span>-</span>}
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
