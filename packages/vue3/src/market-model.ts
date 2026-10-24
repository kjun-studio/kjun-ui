import { onMounted, ref, watch, type PropType } from "vue";
import type { MarketMetric, MetricStorage } from "../../../shared/package-runtime/market-cards";
export type { MarketMetric, MetricStorage };

export interface MarketPagination { page: number; size: number; total: number }
export interface MarketColumn {
  key: string;
  label: string;
  type?: string;
  align?: "left" | "right" | "center";
  width?: number | string;
  sortable?: boolean;
  defaultSort?: boolean;
  flash?: "price" | "change";
  weight?: string;
}
export type MarketFormatter<Row extends object = any> = (value: unknown, format: string, context: { currency: string; row: Row; column?: MarketColumn }) => string;

type RowFn<T> = PropType<(row: any) => T>;
/** Props every market view shares: rows, query state, collection marks, footer and pagination. */
export const marketBaseProps = {
  rows: { type: Array as PropType<object[]>, default: () => [] },
  rowKey: { type: String, default: "id" },
  queryKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  resultKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  loading: { type: Boolean, default: false },
  error: { type: String as PropType<string | null>, default: null },
  hasLoadedOnce: { type: Boolean, default: undefined },
  interestKeys: { type: Set as unknown as PropType<ReadonlySet<unknown>>, default: undefined },
  favoriteKeys: { type: Set as unknown as PropType<ReadonlySet<unknown>>, default: undefined },
  pagination: { type: Object as PropType<MarketPagination | null>, default: undefined },
  primaryLabel: { type: Function as RowFn<string>, default: undefined },
  subMeta: { type: Function as RowFn<string>, default: undefined },
  emptyMessage: { type: String, default: undefined },
  emptySubMessage: { type: String, default: "" },
  /** false shows the shared spinner and loadingText instead of the skeleton. */
  skeleton: { type: Boolean, default: true },
  loadingText: { type: String, default: undefined },
  /** Milliseconds a first load must last before its loading display shows. */
  loadingDelay: { type: Number, default: 0 },
  showFooter: { type: Boolean, default: true },
  calculatedAt: { type: String as PropType<string | null>, default: undefined },
  footerNote: { type: String, default: undefined },
  totalCount: { type: Number, default: 0 },
  unitLabel: { type: String, default: undefined },
  formatDate: { type: Function as PropType<(value: string) => string>, default: undefined },
  /** Declared as props: rows become buttons and the retry action appears only when the app listens. */
  onRowClick: { type: Function as RowFn<void>, default: undefined },
  onRetry: { type: Function as PropType<() => void>, default: undefined },
} as const;
export const queryProps = (props: { queryKey?: string | number | null; resultKey?: string | number | null; loading: boolean; error: string | null; hasLoadedOnce?: boolean }) =>
  ({ queryKey: props.queryKey, resultKey: props.resultKey, loading: props.loading, error: props.error, hasLoadedOnce: props.hasLoadedOnce });

export interface MarketCardsModelProps {
  columns: { key: string; sortable?: boolean; defaultSort?: boolean }[];
  metricConfig: Record<string, MarketMetric>;
  excludeKeys: string[];
  storageNamespace: string;
  storage?: MetricStorage;
  sortKey?: string | null;
  emitSortOnMount: boolean;
}
/** The selected metric pill, restored from storage once per namespace and pill set. */
export function useMarketCardsModel(props: MarketCardsModelProps, sort: (key: string) => void) {
  const key = ref("");
  const pills = () => props.columns
    .filter(c => !props.excludeKeys.includes(c.key) && props.metricConfig[c.key])
    .map(c => ({ key: c.key, ...props.metricConfig[c.key], sortKey: c.sortable ? props.metricConfig[c.key].sortKey : null, isDefaultSort: c.defaultSort }));
  const persistence = () => props.storage || (typeof window === "undefined" ? undefined : window.localStorage);
  const save = (value: string) => { try { persistence()?.setItem(props.storageNamespace + ":pill", value); } catch { /* storage may be unavailable */ } };
  const restore = () => {
    const list = pills();
    let stored: string | null = null;
    try { stored = persistence()?.getItem(props.storageNamespace + ":pill") || null; } catch { /* storage may be unavailable */ }
    const selected = list.find(p => p.key === stored) || list.find(p => p.isDefaultSort) || list.find(p => p.sortKey) || list[0];
    key.value = selected?.key || "";
    if (stored && selected?.key !== stored) save(selected?.key || "");
    if (props.emitSortOnMount && selected?.sortKey && selected.sortKey !== props.sortKey) sort(selected.sortKey);
  };
  onMounted(() => {
    restore();
    watch(() => JSON.stringify([props.storageNamespace, pills()]), restore);
  });
  return () => {
    const list = pills(), pill = list.find(p => p.key === key.value) || list[0];
    return {
      pills: list, key: pill?.key || "", pill,
      select: (next: string) => {
        const selected = list.find(p => p.key === next);
        if (!selected) return;
        key.value = next;
        save(next);
        if (selected.sortKey) sort(selected.sortKey);
      },
    };
  };
}
