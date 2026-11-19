import { useState } from 'react';

const params = new URLSearchParams(location.search);
const columns = [
  { key: 'price', label: 'Price', sortable: true },
  { key: 'change', label: 'Change', sortable: true, defaultSort: true },
  { key: 'volume', label: 'Volume', sortable: false },
];
const metricConfig = {
  price: { label: 'Price', sortKey: 'price' },
  change: { label: 'Change', sortKey: 'change' },
  volume: { label: 'Volume', sortKey: 'volume' },
};
const stored: Record<string, string> = params.has('stored') ? { 'runtime:pill': params.get('stored')! } : {};
const reads: string[] = [], writes: [string, string][] = [];
const storage = {
  getItem(key: string) { reads.push(key); if (params.has('throw')) throw Error('unavailable'); return stored[key] || null; },
  setItem(key: string, value: string) { writes.push([key, value]); if (params.has('throw')) throw Error('unavailable'); stored[key] = value; },
};
// ?rows: quotes under the cards and a plain list. The cards' rows answer clicks and mark row a; the list has no
// click handler and marks row b. Neither gives totalCount, so the footer counts the rows. ?narrow squeezes the pills.
const rows = [{ id: 'a', name: 'Alpha', price: 100, change: 1.5, volume: 10 }, { id: 'b', name: 'Beta', price: 90, change: -2, volume: 20 }];
const quoteProps = params.has('rows') ? { rows, hasLoadedOnce: true } : {};
export function MarketCases({ K }: { K: any }) {
  const [events, setEvents] = useState<string[]>([]);
  const [config, setConfig] = useState({ namespace: 'runtime', show: true, emit: !params.has('silent'), sortKey: params.get('sort'), exclude: [] as string[] });
  Object.assign(window, {
    configureMarket: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })),
    marketStorage: () => ({ reads, writes, stored }),
  });
  return <>
    {config.show && <div style={params.has('narrow') ? { width: Number(params.get('narrow')) || 160 } : undefined} data-testid="cards"><K.KjunMarketCards {...quoteProps} columns={columns} metricConfig={metricConfig} storageNamespace={config.namespace}
      storage={params.has('browser') ? undefined : storage} excludeKeys={config.exclude} sortKey={config.sortKey}
      emitSortOnMount={config.emit} onSort={(key: string) => setEvents(old => [...old, key])}
      {...(params.has('rows') ? { activeKey: 'a', onRowClick: (row: { id: string }) => setEvents(old => [...old, 'row:' + row.id]) } : {})} /></div>}
    {params.has('rows') && <div data-testid="list"><K.KjunMarketSimpleList {...quoteProps} activeKey="b"
      priceValue={(row: { price: number }) => row.price} changeValue={(row: { change: number }) => row.change} priceFormatter={String} /></div>}
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
