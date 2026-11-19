import { tokens } from "@kjun-ui/tokens";
import type { CSSProperties } from "react";
import { isMarketIdentity, normalizeMarketColumns } from "../../../shared/package-runtime/market-layout";
import { skeletonCount, skeletonRowWidths, skeletonWidthScale } from "../../../shared/package-runtime/skeleton-text";
import { KjunSkeleton } from "./display";
import { KjunCollectionMark } from "./financial-display";
import { MarketColumns, webMarketLayout } from "./market-layout";
export interface KjunMarketTableSkeletonProps {
  columns?: ({ key?: string; label?: string; width?: string | number; align?: "left" | "right" | "center" } | string)[];
  rows?: number;
  showActions?: boolean;
  alignClass?: (align: unknown) => string;
  widthClass?: (column: unknown) => string;
  /** Announces loading to screen readers (a status); the table itself stays silent. */
  loadingText?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
}
export function KjunMarketTableSkeleton({ columns = [], rows = 8, showActions = false, alignClass, widthClass, loadingText, className, style, id }: KjunMarketTableSkeletonProps) {
  const cols = normalizeMarketColumns(columns), toggle = tokens.extensions.iconToggle.sizes.xs;
  return <div id={id} aria-hidden={loadingText ? undefined : true} role={loadingText ? "status" : undefined}
    className={"kjun-table-scroll" + (className ? " " + className : "")} style={style}>
    {loadingText && <span className="kjun-sr-only">{loadingText}</span>}
    <table aria-hidden="true" className="kjun-market-table-grid" style={webMarketLayout(cols, showActions, widthClass).tableStyle}>
      <MarketColumns columns={cols} showActions={showActions} widthClass={widthClass} />
      <thead><tr>
        {/* The header marks do not depend on data, so they show as they will; the row toggles load as their squares. */}
        {showActions && <th className="kjun-market-actions">
          <span className="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
          <span className="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
        </th>}
        {cols.map((col, i) => <th key={col.key || i} className={alignClass?.(col.align)} style={{ textAlign: col.align }}>{col.label}</th>)}
      </tr></thead>
      <tbody>{Array.from({ length: skeletonCount(rows) }, (_, row) => <tr key={row}>
        {showActions && <td className="kjun-market-actions">{[0, 1].map((i) => <span key={i} className="kjun-market-actions-mark"><KjunSkeleton type="block" width={toggle} height={toggle} /></span>)}</td>}
        {cols.map((col, i) => <td key={col.key || i} className={alignClass?.(col.align)} style={{ textAlign: col.align }}>
          {isMarketIdentity(col.key) ? <div className="kjun-market-skeleton-identity">
            <KjunSkeleton type="line" width={skeletonRowWidths(row, true).title} />
            <KjunSkeleton type="line" width={skeletonRowWidths(row, true).detail} />
          </div> : <span className="kjun-market-skeleton-value"><KjunSkeleton type="line" width={tokens.extensions.financial.priceSkeletonWidth * skeletonWidthScale(row + i)} /></span>}
        </td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
