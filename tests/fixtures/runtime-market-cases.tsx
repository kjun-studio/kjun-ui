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
export function MarketCases({ K }: { K: any }) {
  const [events, setEvents] = useState<string[]>([]);
  const [config, setConfig] = useState({ namespace: 'runtime', show: true, emit: !params.has('silent'), sortKey: params.get('sort'), exclude: [] as string[] });
  Object.assign(window, {
    configureMarket: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })),
    marketStorage: () => ({ reads, writes, stored }),
  });
  return <>
    {config.show && <K.DsMarketCards columns={columns} metricConfig={metricConfig} storageNamespace={config.namespace}
      storage={params.has('browser') ? undefined : storage} excludeKeys={config.exclude} sortKey={config.sortKey}
      emitSortOnMount={config.emit} onSort={(key: string) => setEvents(old => [...old, key])} />}
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
