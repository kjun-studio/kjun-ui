import { type LayoutColumn, marketGeometry, webMarketLayout } from "../../../shared/package-runtime/market-layout";

export { webMarketLayout };
export function MarketColumns({ columns, showActions, widthClass }: {
  columns: LayoutColumn[];
  showActions: boolean;
  widthClass?: (column: LayoutColumn) => string;
}) {
  const layout = webMarketLayout(columns, showActions, widthClass);
  return <colgroup>
    {showActions && <col style={{ width: marketGeometry.actionsWidth }} />}
    {layout.columns.map((column, index) => <col key={columns[index].key || index} {...column} />)}
  </colgroup>;
}
