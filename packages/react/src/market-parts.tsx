import { fromNestedControl } from "../../../shared/package-runtime/nested-controls";
import { isSelectedMarketRow, marketBlockingError, marketTotal } from "../../../shared/package-runtime/market-query";
import { type ReactNode } from "react";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useQueryDisplay } from "./data-state";
import {
KjunCollectionMark
} from "./financial";
import { MarketBaseProps } from "./market-model";
import { KjunPagination } from "./navigation";
import { getValue } from "./table";
export function MarketIdentity<Row extends object>({
  row,
  props,
}: {
  row: Row;
  props: MarketBaseProps<Row>;
}) {
  const label =
      props.primaryLabel?.(row) ?? String(getValue(row, "name") ?? ""),
    meta = props.subMeta?.(row) || "",
    id = getValue(row, props.rowKey || "id");
  const body = (
    <>
      {props.renderNamePrefix?.(row)}
      <div className="kjun-market-identity-text">
        <div className="kjun-market-name">
          <span title={label}>{label}</span>
          {props.interestKeys?.has(id) && (
            <KjunCollectionMark kind="interest" size="sm" active />
          )}
          {props.favoriteKeys?.has(id) && (
            <KjunCollectionMark kind="favorite" size="sm" active />
          )}
          {props.renderNameSuffix?.(row)}
        </div>
        {(meta || props.renderSubMeta) && (
          <div className="kjun-market-meta">
            {props.renderSubMeta?.(row) || meta}
          </div>
        )}
      </div>
    </>
  );
  return (
    <div className="kjun-market-identity">
      {props.renderIdentity?.(row, body) || body}
    </div>
  );
}
/** A list row: a button only when the app listens for clicks (Enter and Space too), with aria-current on the selected row. */
export function MarketRow<Row extends object>({
  row,
  props,
  selectedKey,
  compact = false,
  children,
}: {
  row: Row;
  props: MarketBaseProps<Row>;
  selectedKey?: unknown;
  compact?: boolean;
  children: ReactNode;
}) {
  const activate = props.onRowClick && (() => props.onRowClick?.(row));
  return (
    <div
      className={compact ? "kjun-market-row kjun-market-row-compact" : "kjun-market-row"}
      role={activate ? "button" : undefined}
      tabIndex={activate ? 0 : undefined}
      aria-current={isSelectedMarketRow(getValue(row, props.rowKey || "id"), selectedKey) || undefined}
      onClick={activate && ((event) => { if (!fromNestedControl(event)) activate(); })}
      onKeyDown={activate && ((event) => {
        if (event.target === event.currentTarget && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          activate();
        }
      })}
    >
      {children}
    </div>
  );
}
export function MarketFooter<Row extends object>({
  props,
}: {
  props: MarketBaseProps<Row>;
}) {
  const m = useKjunMessages();
  const state = useQueryDisplay(props),
    // A blocking error replaces the rows, so their count, update time and pages go with them.
    hidden = marketBlockingError(props, state),
    {
      pagination,
      rows = [],
      showFooter = true,
      calculatedAt,
      footerNote,
      unitLabel = m.unitLabel,
    } = props;
  return (
    <>
      {pagination && !hidden && (
        <KjunPagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.size)}
          totalRows={pagination.total}
          pageSize={pagination.size}
          showInfo
          onPageChange={props.onPageChange}
        />
      )}
      {showFooter && !hidden && !state.initialLoading && rows.length > 0 && (
        <div className="kjun-market-footer">
          <span>
            {calculatedAt
              ? m.lastUpdated +
                (props.formatDate?.(calculatedAt) || calculatedAt)
              : footerNote}
          </span>
          <span>
            {m.totalCount(marketTotal(props.totalCount, pagination, rows.length), unitLabel)}
          </span>
        </div>
      )}
    </>
  );
}
