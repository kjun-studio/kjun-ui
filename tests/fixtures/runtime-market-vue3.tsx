import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const params = new URLSearchParams(location.search);
const columns = [
  { key: 'price', label: 'Price', sortable: true },
  { key: 'change', label: 'Change', sortable: true, defaultSort: true },
  { key: 'volume', label: 'Volume', sortable: false },
];
const metricConfig = { price: { label: 'Price', sortKey: 'price' }, change: { label: 'Change', sortKey: 'change' }, volume: { label: 'Volume', sortKey: 'volume' } };
const stored: Record<string, string> = params.has('stored') ? { 'runtime:pill': params.get('stored')! } : {};
const reads: string[] = [], writes: [string, string][] = [];
const storage = {
  getItem(key: string) { reads.push(key); if (params.has('throw')) throw Error('unavailable'); return stored[key] || null; },
  setItem(key: string, value: string) { writes.push([key, value]); if (params.has('throw')) throw Error('unavailable'); stored[key] = value; },
};
// Like runtime-market-cases: ?rows adds quotes (clickable cards marking a, a passive list marking b); ?narrow squeezes the pills.
const rows = [{ id: 'a', name: 'Alpha', price: 100, change: 1.5, volume: 10 }, { id: 'b', name: 'Beta', price: 90, change: -2, volume: 20 }];
const quoteProps = params.has('rows') ? { rows, hasLoadedOnce: true } : {};
const s = reactive({ events: [] as string[], config: { namespace: 'runtime', show: true, emit: !params.has('silent'), sortKey: params.get('sort'), exclude: [] as string[] } });
Object.assign(window, { configureMarket: (next: object) => { s.config = { ...s.config, ...next }; }, marketStorage: () => ({ reads, writes, stored }) });
createApp(defineComponent(() => () => <K.KjunProvider>
  {s.config.show && <div style={params.has('narrow') ? { width: (Number(params.get('narrow')) || 160) + 'px' } : undefined} data-testid="cards"><K.KjunMarketCards {...quoteProps} columns={columns} metricConfig={metricConfig} storageNamespace={s.config.namespace}
    storage={params.has('browser') ? undefined : storage} excludeKeys={s.config.exclude} sortKey={s.config.sortKey}
    emitSortOnMount={s.config.emit} onSort={(key: string) => s.events.push(key)}
    {...(params.has('rows') ? { activeKey: 'a', onRowClick: (row: { id: string }) => s.events.push('row:' + row.id) } : {})} /></div>}
  {params.has('rows') && <div data-testid="list"><K.KjunMarketSimpleList {...quoteProps} activeKey="b"
    priceValue={(row: { price: number }) => row.price} changeValue={(row: { change: number }) => row.change} priceFormatter={String} /></div>}
  <output data-testid="events">{JSON.stringify(s.events)}</output>
</K.KjunProvider>)).mount('#root');
