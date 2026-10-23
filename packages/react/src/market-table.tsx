import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { watchTrailingOverflow } from "../../../shared/package-runtime/trailing-overflow";
import { useEffect, useRef, useState } from "react";
import { MarketColumns, webMarketLayout } from "./market-layout";
import { KjunIconToggle } from "./actions";
import { KjunIcon } from "./button";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunCollectionMark,
KjunFreshness,
KjunPriceCell,
KjunSignedValue,
KjunSparkline,
finiteNumber,
} from "./financial";
import {
KjunMarketTableProps,
MarketColumn
} from "./market-model";
import { MarketFooter,MarketIdentity } from "./market-parts";
import { KjunMarketTableSkeleton } from "./skeletons";
import { getValue } from "./table";
export function KjunMarketTable<Row extends object = Record<string, unknown>>(
  props: KjunMarketTableProps<Row>
) {
  const m = useKjunMessages();
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
    emptyMessage = m.noItems,
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
      return <KjunSkeleton type="block" height={tokens.extensions.marketTable.valueSkeletonHeight} width={tokens.extensions.marketTable.valueSkeletonWidth} />;
    if (renderCell) return renderCell(row, col);
    if (["stock_name", "name", "symbol"].includes(col.key))
      return <MarketIdentity row={row} props={props} />;
    if (col.type === "sparkline")
      return (
        <KjunSparkline
          data={Array.isArray(value) ? (value as number[]) : []}
          width={tokens.extensions.marketTable.sparklineWidth}
          height={tokens.extensions.marketTable.sparklineHeight}
        />
      );
    if (col.type === "price")
      return (
        <KjunPriceCell
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
        <KjunSignedValue
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
      <KjunSignedValue
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
      <KjunDataState
        {...props}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={props.skeleton === false ? undefined : (
          <KjunMarketTableSkeleton columns={columns} showActions={showActions} />
        )}
        emptyContent={
          <KjunEmpty text={emptyMessage} description={emptySubMessage} />
        }
      >
        <div className="kjun-table-scroll" ref={scroller} data-fade-end={fadeEnd || undefined}>
          <table aria-label={m.marketData} className="kjun-market-table-grid" style={webMarketLayout(columns, showActions).tableStyle}>
            <MarketColumns columns={columns} showActions={showActions} />
            <thead>
              <tr>
                {showActions && (
                  <th className="kjun-market-actions">
                    <span className="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
                    <span className="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
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
                        <KjunIcon
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
                        <KjunIconToggle
                          size="xs"
                          active={props.interestKeys?.has(id)}
                          activeIcon="heart"
                          activeColor="var(--_kjun-color-interest)"
                          ariaLabel={m.watchToggle(props.primaryLabel?.(row) || String(getValue(row, "name") || ""), !!props.interestKeys?.has(id))}
                          loading={togglingInterest === id}
                          onToggle={() => props.onToggleInterest?.(row)}
                        />
                        <KjunIconToggle
                          size="xs"
                          active={props.favoriteKeys?.has(id)}
                          activeIcon="star"
                          activeColor="var(--_kjun-color-favorite)"
                          ariaLabel={m.favoriteToggle(props.primaryLabel?.(row) || String(getValue(row, "name") || ""), !!props.favoriteKeys?.has(id))}
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
                          <KjunFreshness
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
      </KjunDataState>
      <MarketFooter props={props} />
    </div>
  );
}
