import { useQueryDisplay } from "./data-state";
import {
DsCollectionMark
} from "./financial";
import { MarketBaseProps } from "./market-model";
import { DsPagination } from "./navigation";
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
            <DsCollectionMark kind="interest" size="sm" active />
          )}
          {props.favoriteKeys?.has(id) && (
            <DsCollectionMark kind="favorite" size="sm" active />
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
export function MarketFooter<Row extends object>({
  props,
}: {
  props: MarketBaseProps<Row>;
}) {
  const state = useQueryDisplay(props),
    {
      pagination,
      rows = [],
      showFooter = true,
      calculatedAt,
      footerNote,
      totalCount = 0,
      unitLabel = "개",
    } = props;
  return (
    <>
      {pagination && (
        <DsPagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.size)}
          totalRows={pagination.total}
          pageSize={pagination.size}
          showInfo
          onPageChange={props.onPageChange}
        />
      )}{" "}
      {showFooter && !state.initialLoading && rows.length > 0 && (
        <div className="kjun-market-footer">
          <span>
            {calculatedAt
              ? "마지막 업데이트: " +
                (props.formatDate?.(calculatedAt) || calculatedAt)
              : footerNote}
          </span>
          <span>
            총 {totalCount}
            {unitLabel}
          </span>
        </div>
      )}
    </>
  );
}
