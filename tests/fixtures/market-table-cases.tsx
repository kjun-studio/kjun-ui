import { useLayoutEffect, useState } from 'react';
// MarketTable: sort headers, row keyboard and open button, activeKey, price flash and the pinned identity column, for React and Native.
import { longRows, marketColumns, marketRows, wideColumns } from './market-table-data';
const price = (n: number) => Math.round(n).toLocaleString('en-US');
export function MarketTableCases({ K }: { K: any }) {
  const [c, setConfig] = useState<any>({ bump: 0, active: undefined });
  const [events, setEvents] = useState<string[]>([]);
  const log = (event: string) => setEvents(old => [...old, event]);
  useLayoutEffect(() => { Object.assign(window, { configureCases: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const rows = marketRows.map(row => ({ ...row, price: row.price + c.bump }));
  const common = { rows, primaryLabel: (row: any) => row.name, subMeta: (row: any) => row.symbol, priceFormatter: price, showFooter: false, hasLoadedOnce: true };
  return <div style={{ padding: 16 }}>
    <div data-testid="events">{JSON.stringify(events)}</div>
    <div data-testid="main" style={{ width: 640 }}>
      <K.KjunMarketTable {...common} columns={marketColumns} sortKey="price" sortOrder="desc" activeKey={c.active}
        onSort={(key: string) => log('sort:' + key)} onRowClick={(row: any) => log('open:' + row.id)} />
    </div>
    <div data-testid="bare" style={{ width: 640 }}>
      <K.KjunMarketTable {...common} columns={marketColumns} showActions={false} activeKey={c.active} onRowClick={(row: any) => log('bare:' + row.id)} />
    </div>
    <div data-testid="still" style={{ width: 640 }}><K.KjunMarketTable {...common} columns={marketColumns} divider={false} /></div>
    <div data-testid="long" style={{ width: 343 }}><K.KjunMarketTable {...common} rows={longRows} columns={marketColumns} /></div>
    <div data-testid="narrow" style={{ width: 343 }}><K.KjunMarketTable {...common} columns={wideColumns} onRowClick={() => {}} /></div>
    <div data-testid="narrow-off" style={{ width: 343 }}><K.KjunMarketTable {...common} columns={wideColumns} stickyIdentity={false} /></div>
    {/* One column drawn by the app; the others keep the built-in cells. */}
    <div data-testid="custom-cell" style={{ width: 640 }}><K.KjunMarketTable {...common}
      columns={marketColumns.map(col => col.key === 'change' ? { ...col, render: (row: any) => 'custom:' + row.id } : col)} /></div>
  </div>;
}
