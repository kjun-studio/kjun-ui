import { tokens } from "@kjun-ui/tokens";
import { isMarketIdentity, normalizeMarketColumns } from "../../../shared/package-runtime/market-layout";
import { DsSkeleton } from "./display";
import { MarketColumns, webMarketLayout } from "./market-layout";
export interface DsMarketTableSkeletonProps {
  columns?: ({ key?: string; label?: string; width?: string | number; align?: "left" | "right" | "center" } | string)[];
  rows?: number;
  showActions?: boolean;
  alignClass?: (align: unknown) => string;
  widthClass?: (column: unknown) => string;
}
export function DsMarketTableSkeleton({ columns = [], rows = 8, showActions = false, alignClass, widthClass }: DsMarketTableSkeletonProps) {
  const cols = normalizeMarketColumns(columns);
  return <div aria-hidden="true" className="kjun-table-scroll">
    <table className="kjun-market-table-grid" style={webMarketLayout(cols, showActions, widthClass).tableStyle}>
      <MarketColumns columns={cols} showActions={showActions} widthClass={widthClass} />
      <thead><tr>
        {showActions && <th className="kjun-market-actions"><span className="kjun-market-skeleton-value"><DsSkeleton type="block" width={tokens.extensions.marketTable.actionSkeletonWidth} height={tokens.extensions.marketTable.headerSkeletonHeight} /></span></th>}
        {cols.map((col, i) => <th key={col.key || i} className={alignClass?.(col.align)} style={{ textAlign: col.align }}>{col.label}</th>)}
      </tr></thead>
      <tbody>{Array.from({ length: Math.max(0, rows) }, (_, row) => <tr key={row}>
        {showActions && <td className="kjun-market-actions"><span className="kjun-market-skeleton-value"><DsSkeleton type="block" width={tokens.extensions.marketTable.actionSkeletonWidth} height={tokens.extensions.financial.priceSkeletonHeight} /></span></td>}
        {cols.map((col, i) => <td key={col.key || i} className={alignClass?.(col.align)} style={{ textAlign: col.align }}>
          {isMarketIdentity(col.key) ? <div className="kjun-market-skeleton-identity">
            <DsSkeleton type="block" width="80%" height={tokens.extensions.skeleton.lineHeights.md} />
            <DsSkeleton type="block" width="60%" height={tokens.extensions.skeleton.lineHeights.sm} />
          </div> : <span className="kjun-market-skeleton-value"><DsSkeleton type="block" width={tokens.extensions.financial.priceSkeletonWidth} height={tokens.extensions.financial.priceSkeletonHeight} /></span>}
        </td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
