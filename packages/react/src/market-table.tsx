import { tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { watchTrailingOverflow } from "../../../shared/package-runtime/trailing-overflow";
import { useEffect, useRef, useState } from "react";
import { MarketColumns, webMarketLayout } from "./market-layout";
import { DsIconToggle } from "./actions";
import { DsIcon } from "./button";
import { DsDataState } from "./data-state";
import { DsEmpty,DsSkeleton } from "./display";
import {
DsCollectionMark,
DsFreshness,
DsPriceCell,
DsSignedValue,
DsSparkline,
finiteNumber,
} from "./financial";
import {
DsMarketTableProps,
MarketColumn
} from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { DsMarketTableSkeleton } from "./skeletons";
import { getValue } from "./table";
export function DsMarketTable<Row extends object = Record<string, unknown>>(
  props: DsMarketTableProps<Row>
) {
  const {
    rows = [],
    columns,
    rowKey = "id",
    cellLoading = () => false,
    showActions = true,
    togglingInterest,
    togglingFavorite,
    sortKey,
    sortOrder = "desc",
    priceFormatter,
    currency = "krw",
    embedded = false,
    emptyMessage = "항목이 없습니다",
    emptySubMessage = "",
    formatMetric,
    renderCell,
  } = props;
  // Like Native and Vue: the trailing edge fades while columns still overflow it.
  const scroller = useRef<HTMLDivElement>(null), [fadeEnd, setFadeEnd] = useState(false);
  useEffect(() => scroller.current ? watchTrailingOverflow(scroller.current, setFadeEnd) : undefined, [rows, columns]);
  const render = (row: Row, col: MarketColumn) => {
    const value = getValue(row, col.key),
      stale = !!getValue(row, "stale");
    if (cellLoading(row, col))
      return <DsSkeleton type="block" height={tokens.extensions.marketTable.valueSkeletonHeight} width={tokens.extensions.marketTable.valueSkeletonWidth} />;
    if (renderCell) return renderCell(row, col);
    if (["stock_name", "name", "symbol"].includes(col.key))
      return <MarketIdentity row={row} props={props} />;
    if (col.type === "sparkline")
      return (
        <DsSparkline
          data={Array.isArray(value) ? (value as number[]) : []}
          width={tokens.extensions.marketTable.sparklineWidth}
          height={tokens.extensions.marketTable.sparklineHeight}
        />
      );
    if (col.type === "price")
      return (
        <DsPriceCell
          value={finiteNumber(value)}
          formatter={priceFormatter}
          stale={stale}
          showFreshness={false}
        />
      );
    if (col.type === "percent")
      return value == null ? (
        "-"
      ) : (
        <DsSignedValue
          value={finiteNumber(value)}
          format="percent"
          isRaw
          stale={stale}
          showFreshness={false}
          formatter={
            formatMetric
              ? (number) =>
                  formatMetric(number, col.type!, {
                    currency,
                    row,
                    column: col,
                  })
              : undefined
          }
        />
      );
    const text = formatMetric
      ? formatMetric(value, col.type || "text", { currency, row, column: col })
      : value == null
      ? "-"
      : String(value);
    return ["investor", "net_amount", "net_volume"].includes(col.type || "") ? (
      <DsSignedValue
        value={finiteNumber(value)}
        formatter={() => text}
        stale={stale}
        showFreshness={false}
      />
    ) : (
      text
    );
  };
  return (
    <div className="kjun-market-table" data-embedded={embedded}
      ref={domainColorRef(showActions && rows.length > 0 && !props.loading)}>
      <DsDataState
        {...props}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={
          <DsMarketTableSkeleton columns={columns} showActions={showActions} />
        }
        emptyContent={
          <DsEmpty text={emptyMessage} description={emptySubMessage} />
        }
      >
        <div className="kjun-table-scroll" ref={scroller} data-fade-end={fadeEnd || undefined}>
          <table aria-label="시장 데이터" className="kjun-market-table-grid" style={webMarketLayout(columns, showActions).tableStyle}>
            <MarketColumns columns={columns} showActions={showActions} />
            <thead>
              <tr>
                {showActions && (
                  <th className="kjun-market-actions">
                    <span className="kjun-market-actions-mark"><DsCollectionMark kind="interest" size="md" /></span>
                    <span className="kjun-market-actions-mark"><DsCollectionMark kind="favorite" size="md" /></span>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ textAlign: col.align }}
                    aria-sort={
                      col.sortable
                        ? sortKey === col.key
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => props.onSort?.(col.key)}
                      >
                        {col.label}
                        <DsIcon
                          name={
                            sortKey === col.key
                              ? sortOrder === "asc"
                                ? "sort-ascending"
                                : "sort-descending"
                              : "arrows-sort"
                          }
                          size={tokens.extensions.marketTable.sortIconSize}
                        />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = getValue(row, rowKey),
                  priceCol = columns.find(
                    (c) =>
                      c.type === "price" &&
                      !cellLoading(row, c) &&
                      getValue(row, c.key) != null
                  );
                return (
                  <tr
                    key={String(id ?? i)}
                    onClick={() => props.onRowClick?.(row)}
                  >
                    {showActions && (
                      <td className="kjun-market-actions">
                        <DsIconToggle
                          size="xs"
                          active={props.interestKeys?.has(id)}
                          activeIcon="heart"
                          activeColor="var(--_kjun-color-interest)"
                          ariaLabel={[
                            props.primaryLabel?.(row) || String(getValue(row, "name") || ""),
                            "관심", props.interestKeys?.has(id) ? "해제" : "등록",
                          ].filter(Boolean).join(" ")}
                          loading={togglingInterest === id}
                          onToggle={() => props.onToggleInterest?.(row)}
                        />
                        <DsIconToggle
                          size="xs"
                          active={props.favoriteKeys?.has(id)}
                          activeIcon="star"
                          activeColor="var(--_kjun-color-favorite)"
                          ariaLabel={[
                            props.primaryLabel?.(row) || String(getValue(row, "name") || ""),
                            "즐겨찾기", props.favoriteKeys?.has(id) ? "해제" : "등록",
                          ].filter(Boolean).join(" ")}
                          loading={togglingFavorite === id}
                          onToggle={() => props.onToggleFavorite?.(row)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align,
                          fontWeight: col.weight === "bold" ? tokens.typography.control.fontWeight : undefined,
                        }}
                      >
                        {render(row, col)}
                        {col.key === priceCol?.key && (
                          <DsFreshness
                            stale={!!getValue(row, "stale")}
                            source={String(getValue(row, "source") || "")}
                            fetchedAt={String(
                              getValue(row, "fetched_at") || ""
                            )}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DsDataState>
      <MarketFooter props={props} />
    </div>
  );
}
