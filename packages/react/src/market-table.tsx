import { fromNestedControl } from "../../../shared/package-runtime/nested-controls";
import { marketQueryState } from "../../../shared/package-runtime/market-query";
import { sparklineCell } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { watchLeadingScroll, watchTrailingOverflow } from "../../../shared/package-runtime/trailing-overflow";
import { marketCellKind, marketColumnFlash, marketPinnedIdentity, marketRowActivates, marketRowLabel, marketSortIcon, marketSortState, marketStatusColumn } from "../../../shared/package-runtime/market-table";
import { isComposingKey } from "@kjun-ui/tokens";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { MarketColumns, webMarketLayout } from "./market-layout";
import { KjunIconToggle } from "./actions";
import { KjunIcon } from "./button";
import { KjunDataState } from "./data-state";
import { KjunEmpty,KjunSkeleton } from "./display";
import {
KjunCollectionMark,
KjunPriceCell,
KjunSignedValue,
KjunSparkline,
finiteNumber,
} from "./financial";
import { PriceStatus } from "./number-display";
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
    stickyIdentity = true,
    divider = true,
    activeKey,
    emptyMessage = m.noItems,
    emptySubMessage = "",
    formatMetric,
    renderCell,
    onRowClick,
  } = props;
  // Like Native and Vue: the trailing edge fades while columns still overflow it, and pinned columns cast an edge once scrolled.
  const scroller = useRef<HTMLDivElement>(null), [fadeEnd, setFadeEnd] = useState(false), [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const element = scroller.current;
    if (!element) return undefined;
    const stopEnd = watchTrailingOverflow(element, setFadeEnd), stopStart = watchLeadingScroll(element, setScrolled);
    return () => { stopEnd(); stopStart(); };
  }, [rows, columns]);
  const pinned = marketPinnedIdentity(columns, stickyIdentity);
  const label = (row: Row) => marketRowLabel(row, props.primaryLabel, getValue);
  const render = (row: Row, col: MarketColumn) => {
    const value = getValue(row, col.key),
      stale = !!getValue(row, "stale");
    if (cellLoading(row, col))
      return <KjunSkeleton type="line" width={tokens.extensions.marketTable.valueSkeletonWidth} />;
    if (renderCell) return renderCell(row, col);
    if (col.render) return col.render(row, col);
    const kind = marketCellKind(col), context = { currency, row, column: col };
    if (kind === "identity") return <MarketIdentity row={row} props={props} />;
    if (kind === "sparkline")
      return (
        <KjunSparkline
          {...sparklineCell(rows, row, col, getValue)}
          width={tokens.extensions.marketTable.sparklineWidth}
          height={tokens.extensions.marketTable.sparklineHeight}
        />
      );
    if (kind === "price")
      return <KjunPriceCell value={finiteNumber(value)} formatter={priceFormatter} stale={stale} flash={marketColumnFlash(col)} />;
    if (kind === "percent")
      return value == null ? "-" : (
        <KjunSignedValue value={finiteNumber(value)} format="percent" stale={stale}
          formatter={formatMetric ? (number) => formatMetric(number, col.type!, context) : undefined} />
      );
    const text = formatMetric ? formatMetric(value, col.type || "text", context) : value == null ? "-" : String(value);
    return kind === "signed" ? <KjunSignedValue value={finiteNumber(value)} formatter={() => text} stale={stale} /> : text;
  };
  const rowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row) => {
    if (!onRowClick || event.target !== event.currentTarget || event.defaultPrevented || isComposingKey(event)) return;
    if (marketRowActivates(event.key)) { event.preventDefault(); onRowClick(row); }
  };
  // Pinned cells: the toggle column, then the identity column, whose end casts the edge.
  const pin = (key: string | null) => !pinned ? {} : key === null
    ? { "data-pin": "start" } : key === pinned ? { "data-pin": showActions ? "identity" : "start", "data-pin-edge": "" } : {};
  return (
    <div className="kjun-market-table" data-embedded={embedded} data-divider={divider ? undefined : "false"}
      ref={domainColorRef(showActions && rows.length > 0 && !props.loading)}>
      <KjunDataState
        {...props}
        {...marketQueryState(props)}
        loadingPadding="none"
        empty={!rows.length}
        emptyText={emptyMessage}
        loadingContent={props.skeleton === false ? undefined : (
          <KjunMarketTableSkeleton columns={columns} showActions={showActions} />
        )}
        emptyContent={
          <KjunEmpty size="sm" text={emptyMessage} description={emptySubMessage} />
        }
      >
        <div className="kjun-table-scroll" ref={scroller} data-fade-end={fadeEnd || undefined} data-scrolled={scrolled || undefined}>
          <table aria-label={m.marketData} className="kjun-market-table-grid" style={webMarketLayout(columns, showActions).tableStyle}>
            <MarketColumns columns={columns} showActions={showActions} />
            <thead>
              <tr>
                {showActions && (
                  <th className="kjun-market-actions" {...pin(null)}>
                    {/* The marks are drawings; the header column still needs a name. */}
                    <span className="kjun-sr-only">{m.collectionMarks}</span>
                    <span className="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
                    <span className="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
                  </th>
                )}
                {columns.map((col) => {
                  const sort = marketSortState(col, sortKey, sortOrder);
                  return (
                    <th key={col.key} style={{ textAlign: col.align }} aria-sort={sort} {...pin(col.key)}>
                      {sort ? (
                        <button type="button" onClick={() => props.onSort?.(col.key)}>
                          {col.label}
                          <KjunIcon name={marketSortIcon(sort)} size={tokens.extensions.marketTable.sortIconSize} />
                        </button>
                      ) : col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = getValue(row, rowKey),
                  statusKey = marketStatusColumn(columns, row, cellLoading, getValue),
                  interest = !!props.interestKeys?.has(id), favorite = !!props.favoriteKeys?.has(id);
                return (
                  <tr
                    key={String(id ?? i)}
                    // Like KjunTable: a row that opens takes focus and opens with Enter or Space.
                    tabIndex={onRowClick ? 0 : undefined}
                    data-clickable={onRowClick ? "" : undefined}
                    aria-current={activeKey != null && id === activeKey ? "true" : undefined}
                    onKeyDown={(event) => rowKeyDown(event, row)}
                    onClick={(event) => { if (!fromNestedControl(event)) onRowClick?.(row); }}
                  >
                    {showActions && (
                      <td className="kjun-market-actions" {...pin(null)}>
                        <KjunIconToggle
                          size="xs"
                          active={interest}
                          activeIcon="heart"
                          activeColor="var(--_kjun-color-interest)"
                          ariaLabel={m.watchToggle(label(row), interest)}
                          loading={togglingInterest === id}
                          onToggle={() => props.onToggleInterest?.(row)}
                        />
                        <KjunIconToggle
                          size="xs"
                          active={favorite}
                          activeIcon="star"
                          activeColor="var(--_kjun-color-favorite)"
                          ariaLabel={m.favoriteToggle(label(row), favorite)}
                          loading={togglingFavorite === id}
                          onToggle={() => props.onToggleFavorite?.(row)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        {...pin(col.key)}
                        style={{
                          textAlign: col.align,
                          fontWeight: col.weight === "bold" ? tokens.typography.control.fontWeight : undefined,
                        }}
                      >
                        {render(row, col)}
                        {col.key === statusKey && (
                          <PriceStatus status={props.renderStatus?.(row)} />
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
