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
  showFooter?: boolean;
  calculatedAt?: string | null;
  footerNote?: string;
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
  flash?: "price" | "change";
  weight?: string;
}
export type MarketFormatter<Row extends object> = (
  value: unknown,
  format: string,
  context: { currency: string; row: Row; column?: MarketColumn }
) => string;
export interface DsMarketSimpleListProps<
  Row extends object = Record<string, unknown>
> extends MarketBaseProps<Row> {
  priceValue: (row: Row) => number | null;
  changeValue: (row: Row) => number | null;
  changeLoading?: (row: Row) => boolean;
  priceFormatter: (value: number) => string;
  closingPrice?: boolean;
  renderPricePrefix?: (row: Row) => ReactNode;
}
export interface DsMarketTableProps<
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
  formatMetric?: MarketFormatter<Row>;
  renderCell?: (row: Row, column: MarketColumn) => ReactNode;
  onSort?: (key: string) => void;
  onToggleInterest?: (row: Row) => void;
  onToggleFavorite?: (row: Row) => void;
}
export interface DsMarketCardsProps<
  Row extends object = Record<string, unknown>
> extends MarketBaseProps<Row>, MarketCardsModelProps {
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
export function useMarketCards<Row extends object>(props: DsMarketCardsProps<Row>) {
  return useMarketCardsModel(props, () => props.storage || (typeof window === "undefined" ? undefined : window.localStorage));
}
