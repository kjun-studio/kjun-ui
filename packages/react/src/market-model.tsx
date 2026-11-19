import { type QueryDisplayProps } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { useMarketCardsModel, type MarketCardsModelProps, type MarketMetric } from "../../../shared/package-runtime/market-cards";
export type { MarketMetric } from "../../../shared/package-runtime/market-cards";

export interface MarketPagination {
  page: number;
  size: number;
  total: number;
}
export interface MarketBaseProps<Row extends object> extends QueryDisplayProps {
  rows?: Row[];
  rowKey?: string;
  interestKeys?: ReadonlySet<unknown>;
  favoriteKeys?: ReadonlySet<unknown>;
  pagination?: MarketPagination | null;
  primaryLabel?: (row: Row) => string;
  subMeta?: (row: Row) => string;
  emptyMessage?: string;
  emptySubMessage?: string;
  /** false shows the shared spinner and loadingText instead of the skeleton. Default true. */
  skeleton?: boolean;
  loadingText?: string;
  /** Milliseconds a first load must last before its loading display shows. */
  loadingDelay?: number;
  showFooter?: boolean;
  calculatedAt?: string | null;
  footerNote?: string;
  /** The count in the footer. Default: pagination.total, else the number of rows. */
  totalCount?: number;
  unitLabel?: string;
  formatDate?: (value: string) => string;
  renderIdentity?: (row: Row, content: ReactNode) => ReactNode;
  renderNamePrefix?: (row: Row) => ReactNode;
  renderNameSuffix?: (row: Row) => ReactNode;
  renderSubMeta?: (row: Row) => ReactNode;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: Row) => void;
  onRetry?: () => void;
}
export interface MarketColumn {
  key: string;
  label: string;
  type?: string;
  align?: "left" | "right" | "center";
  width?: number | string;
  sortable?: boolean;
  defaultSort?: boolean;
  /** Price columns: true or "text" colours the digits, "background" fills the price for a moment after it moves (KjunPriceCell flash). "price" reads as true; "change" has no effect. */
  flash?: boolean | "text" | "background" | "price" | "change";
  weight?: string;
  /** Sparkline columns: the row field with the reference value (a previous close), drawn as a dotted baseline. */
  baselineKey?: string;
  /** Sparkline columns: every row shares one vertical range, for series on a common scale (such as percent changes). */
  sharedRange?: boolean;
}
export type MarketFormatter<Row extends object> = (
  value: unknown,
  format: string,
  context: { currency: string; row: Row; column?: MarketColumn }
) => string;
export interface KjunMarketSimpleListProps<
  Row extends object = Record<string, unknown>
> extends MarketBaseProps<Row> {
  /** The rowKey value of the row the app has open (a detail or chart beside the list); it takes the selected fill and aria-current, like MarketTable. */
  activeKey?: unknown;
  priceValue: (row: Row) => number | null;
  changeValue: (row: Row) => number | null;
  changeLoading?: (row: Row) => boolean;
  priceFormatter: (value: number) => string;
  renderPricePrefix?: (row: Row) => ReactNode;
  /** The row's quote status (a KjunBadge or text) before the change; the wording and tone belong to the app. */
  renderStatus?: (row: Row) => ReactNode;
}
export interface KjunMarketTableProps<
  Row extends object = Record<string, unknown>
> extends MarketBaseProps<Row> {
  columns: MarketColumn[];
  cellLoading?: (row: Row, column: MarketColumn) => boolean;
  showActions?: boolean;
  togglingInterest?: unknown;
  togglingFavorite?: unknown;
  sortKey?: string | null;
  sortOrder?: "asc" | "desc";
  priceFormatter?: (value: number) => string;
  currency?: string;
  embedded?: boolean;
  /** The toggle and identity columns stay in view while the other columns scroll sideways. Default true. */
  stickyIdentity?: boolean;
  /** false drops the lines between rows; the header keeps its line. Default true. */
  divider?: boolean;
  /** The rowKey value of the row the app has open (a detail beside the table); it takes the selected fill and aria-current. */
  activeKey?: unknown;
  formatMetric?: MarketFormatter<Row>;
  renderCell?: (row: Row, column: MarketColumn) => ReactNode;
  /** The row's quote status after the price column's value. */
  renderStatus?: (row: Row) => ReactNode;
  onSort?: (key: string) => void;
  onToggleInterest?: (row: Row) => void;
  onToggleFavorite?: (row: Row) => void;
}
export interface KjunMarketCardsProps<
  Row extends object = Record<string, unknown>
> extends MarketBaseProps<Row>, MarketCardsModelProps {
  /** The rowKey value of the row the app has open (a detail or chart beside the list); it takes the selected fill and aria-current, like MarketTable. */
  activeKey?: unknown;
  columns: MarketColumn[];
  sortOrder?: "asc" | "desc";
  currency?: string;
  changeMetricKey?: string;
  priceMetricKeys?: string[];
  metricLoading?: (row: Row, key: string) => boolean;
  formatMetric?: MarketFormatter<Row>;
  renderMetricPrefix?: (row: Row, key: string, isPrice: boolean) => ReactNode;
  renderList?: (state: {
    selectedKey: string;
    selectedPill: MarketMetric | undefined;
    metricDisplay: (row: Row) => string;
  }) => ReactNode;
}
export function useMarketCards<Row extends object>(props: KjunMarketCardsProps<Row>) {
  return useMarketCardsModel(props, () => props.storage || (typeof window === "undefined" ? undefined : window.localStorage));
}
