import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { longRows, marketColumns, marketRows, wideColumns } from './market-table-data';
applyDemoColors('default');
// The same cases as market-table-cases.tsx, in Vue.
const s = reactive({ c: { bump: 0, active: undefined } as any, events: [] as string[] });
Object.assign(window, { configureCases: (next: object) => { s.c = { ...s.c, ...next }; } });
const log = (event: string) => { s.events = [...s.events, event]; };
const price = (n: number) => Math.round(n).toLocaleString('en-US');
createApp(defineComponent(() => () => {
  const rows = marketRows.map(row => ({ ...row, price: row.price + s.c.bump }));
  const common = { rows, primaryLabel: (row: any) => row.name, subMeta: (row: any) => row.symbol, priceFormatter: price, showFooter: false, hasLoadedOnce: true };
  return <K.KjunProvider><div style={{ padding: '16px' }}>
    <div data-testid="events">{JSON.stringify(s.events)}</div>
    <div data-testid="main" style={{ width: '640px' }}>
      <K.KjunMarketTable {...common} columns={marketColumns} sortKey="price" sortOrder="desc" activeKey={s.c.active}
        onSort={(key: string) => log('sort:' + key)} onRowClick={(row: any) => log('open:' + row.id)} />
    </div>
    <div data-testid="bare" style={{ width: '640px' }}>
      <K.KjunMarketTable {...common} columns={marketColumns} showActions={false} activeKey={s.c.active} onRowClick={(row: any) => log('bare:' + row.id)} />
    </div>
    <div data-testid="still" style={{ width: '640px' }}><K.KjunMarketTable {...common} columns={marketColumns} divider={false} /></div>
    <div data-testid="long" style={{ width: '343px' }}><K.KjunMarketTable {...common} rows={longRows} columns={marketColumns} /></div>
    <div data-testid="narrow" style={{ width: '343px' }}><K.KjunMarketTable {...common} columns={wideColumns} onRowClick={() => {}} /></div>
    <div data-testid="narrow-off" style={{ width: '343px' }}><K.KjunMarketTable {...common} columns={wideColumns} stickyIdentity={false} /></div>
    {/* A column slot draws one column; a column's render draws another; the rest keep the built-in cells. */}
    <div data-testid="custom-cell" style={{ width: '640px' }}><K.KjunMarketTable {...common} columns={[...marketColumns, { key: 'volume', label: 'Volume', align: 'right', render: (row: any) => 'render:' + row.id }]}>{{
      'cell-change': ({ row }: any) => 'custom:' + row.id,
    }}</K.KjunMarketTable></div>
  </div></K.KjunProvider>;
})).mount('#root');
