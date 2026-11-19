import { marketBlockingError } from "../../../shared/package-runtime/market-query";
import { useKjunMessages } from "./runtime/messages";
import { type ExtractPublicPropTypes, type PropType, type VNode, type VNodeChild, type SlotsType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { isMarketIdentity, normalizeMarketColumns, webMarketActionsWidth, webMarketLayout, type LayoutColumn } from "../../../shared/package-runtime/market-layout";
import { getValue } from "../../../shared/package-runtime/table-model";
import { KjunCard } from "./card";
import { useQueryDisplay } from "./data-state";
import { skeletonCount, skeletonRowWidths, skeletonWidthScale } from "../../../shared/package-runtime/skeleton-text";
import { KjunSkeleton } from "./display";
import { KjunCollectionMark } from "./financial-display";
import { queryProps, type MarketPagination } from "./market-model";
import { KjunPagination } from "./navigation";
import { hasContent } from "./runtime/slots";

interface IdentityProps {
  rowKey: string;
  primaryLabel?: (row: any) => string;
  subMeta?: (row: any) => string;
  interestKeys?: ReadonlySet<unknown>;
  favoriteKeys?: ReadonlySet<unknown>;
}
export type MarketIdentitySlots = {
  identity?: (scope: { row: object; content: VNode }) => VNodeChild;
  namePrefix?: (scope: { row: object }) => VNodeChild;
  nameSuffix?: (scope: { row: object }) => VNodeChild;
  subMeta?: (scope: { row: object }) => VNodeChild;
};
/** Name, collection marks and meta line; slots identity({ row, content }), namePrefix, nameSuffix, subMeta({ row }). */
export function marketIdentity(row: object, props: IdentityProps, slots: Readonly<MarketIdentitySlots>): VNodeChild {
  const label = props.primaryLabel?.(row) ?? String(getValue(row, "name") ?? ""), meta = props.subMeta?.(row) || "";
  const id = getValue(row, props.rowKey || "id");
  const subMeta = slots.subMeta?.({ row });
  const body = <>
    {slots.namePrefix?.({ row })}
    <div class="kjun-market-identity-text">
      <div class="kjun-market-name">
        <span title={label}>{label}</span>
        {props.interestKeys?.has(id) && <KjunCollectionMark kind="interest" size="sm" active />}
        {props.favoriteKeys?.has(id) && <KjunCollectionMark kind="favorite" size="sm" active />}
        {slots.nameSuffix?.({ row })}
      </div>
      {(meta || slots.subMeta) && <div class="kjun-market-meta">{hasContent(subMeta) ? subMeta : meta}</div>}
    </div>
  </>;
  const custom = slots.identity?.({ row, content: body });
  return <div class="kjun-market-identity">{hasContent(custom) ? custom : body}</div>;
}

/** Pagination and the update/total line under a market view. */
export const MarketFooter = defineComponent({
  name: "KjunMarketFooter",
  props: {
    queryKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
    resultKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
    loading: { type: Boolean, default: false },
    error: { type: String as PropType<string | null>, default: null },
    hasLoadedOnce: { type: Boolean, default: undefined },
    pagination: { type: Object as PropType<MarketPagination | null>, default: undefined },
    rowCount: { type: Number, required: true },
    showFooter: { type: Boolean, default: true },
    calculatedAt: { type: String as PropType<string | null>, default: undefined },
    footerNote: { type: String, default: undefined },
    totalCount: { type: Number, default: 0 },
    unitLabel: { type: String, default: undefined },
    formatDate: { type: Function as PropType<(value: string) => string>, default: undefined },
  },
  emits: { "page-change": (_page: number) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    const status = useQueryDisplay(() => queryProps(props));
    return () => {
      // A blocking error replaces the rows, so their count, update time and pages go with them.
      const state = status(), { pagination } = props, hidden = marketBlockingError(props, state);
      return <>
        {pagination && !hidden && (
          <KjunPagination currentPage={pagination.page} totalPages={Math.ceil(pagination.total / pagination.size)} totalRows={pagination.total}
            pageSize={pagination.size} showInfo onUpdate:page={(page: number) => emit("page-change", page)} />
        )}{" "}
        {props.showFooter && !hidden && !state.initialLoading && props.rowCount > 0 && (
          <div class="kjun-market-footer">
            <span>{props.calculatedAt ? m.value.lastUpdated + (props.formatDate?.(props.calculatedAt) || props.calculatedAt) : props.footerNote}</span>
            <span>{m.value.totalCount(props.totalCount, (props.unitLabel ?? m.value.unitLabel))}</span>
          </div>
        )}
      </>;
    };
  },
});

export function marketColumns(columns: LayoutColumn[], showActions: boolean, widthClass?: (column: LayoutColumn) => string) {
  const layout = webMarketLayout(columns, showActions, widthClass);
  return (
    <colgroup>
      {showActions && <col style={{ width: webMarketActionsWidth }} />}
      {layout.columns.map((column, index) => <col key={columns[index].key || index} class={column.className} style={column.style} />)}
    </colgroup>
  );
}

const kjunMarketTableSkeletonProps = {
  columns: { type: Array as PropType<(LayoutColumn | string)[]>, default: () => [] },
  rows: { type: Number, default: 8 },
  showActions: { type: Boolean, default: false },
  alignClass: { type: Function as PropType<(align: unknown) => string>, default: undefined },
  widthClass: { type: Function as PropType<(column: unknown) => string>, default: undefined },
  /** Announces loading to screen readers (a status); the table itself stays silent. */
  loadingText: { type: String, default: undefined },
} as const;
export type KjunMarketTableSkeletonProps = ExtractPublicPropTypes<typeof kjunMarketTableSkeletonProps>;
export const KjunMarketTableSkeleton = defineComponent({
  name: "KjunMarketTableSkeleton",
  props: kjunMarketTableSkeletonProps,
  setup(props) {
    return () => {
      const cols = normalizeMarketColumns(props.columns), toggle = tokens.extensions.iconToggle.sizes.xs;
      // Like React: values differ a little from cell to cell, so a column does not read as stripes.
      const valueSkeleton = (index = 0) => (
        <span class="kjun-market-skeleton-value"><KjunSkeleton type="line" width={tokens.extensions.financial.priceSkeletonWidth * skeletonWidthScale(index)} /></span>
      );
      return (
        <div aria-hidden={props.loadingText ? undefined : "true"} role={props.loadingText ? "status" : undefined} class="kjun-table-scroll">
          {props.loadingText && <span class="kjun-sr-only">{props.loadingText}</span>}
          <table aria-hidden="true" class="kjun-market-table-grid" style={webMarketLayout(cols, props.showActions, props.widthClass).tableStyle}>
            {marketColumns(cols, props.showActions, props.widthClass)}
            <thead><tr>
              {/* Like React: the header marks show as they will; the row toggles load as their squares. */}
              {props.showActions && <th class="kjun-market-actions">
                <span class="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
                <span class="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
              </th>}
              {cols.map((col, i) => <th key={col.key || i} class={props.alignClass?.(col.align)} style={{ textAlign: col.align }}>{col.label}</th>)}
            </tr></thead>
            <tbody>{Array.from({ length: skeletonCount(props.rows) }, (_, row) => (
              <tr key={row}>
                {props.showActions && <td class="kjun-market-actions">{[0, 1].map(i => <span key={i} class="kjun-market-actions-mark"><KjunSkeleton type="block" width={toggle} height={toggle} /></span>)}</td>}
                {cols.map((col, i) => (
                  <td key={col.key || i} class={props.alignClass?.(col.align)} style={{ textAlign: col.align }}>
                    {isMarketIdentity(col.key) ? (
                      <div class="kjun-market-skeleton-identity">
                        <KjunSkeleton type="line" width={skeletonRowWidths(row, true).title} />
                        <KjunSkeleton type="line" width={skeletonRowWidths(row, true).detail} />
                      </div>
                    ) : valueSkeleton(row + i)}
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
    };
  },
});

/** Slots: default (the list), controls. */
export const KjunMarketListPanel = defineComponent({
  name: "KjunMarketListPanel",
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    controls?: () => VNodeChild;
  }>,
  setup(_, { slots }) {
    return () => (
      <KjunCard>
        <div>{slots.controls?.()}</div>
        <div style={{ marginTop: tokens.dimension.value16 + "px", borderTop: `${tokens.border.defaultWidth}px solid var(--_kjun-color-border)` }}>{slots.default?.()}</div>
      </KjunCard>
    );
  },
});
