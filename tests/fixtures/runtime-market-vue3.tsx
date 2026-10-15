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
const s = reactive({ events: [] as string[], config: { namespace: 'runtime', show: true, emit: !params.has('silent'), sortKey: params.get('sort'), exclude: [] as string[] } });
Object.assign(window, { configureMarket: (next: object) => { s.config = { ...s.config, ...next }; }, marketStorage: () => ({ reads, writes, stored }) });
createApp(defineComponent(() => () => <K.KjunProvider>
  {s.config.show && <K.KjunMarketCards columns={columns} metricConfig={metricConfig} storageNamespace={s.config.namespace}
    storage={params.has('browser') ? undefined : storage} excludeKeys={s.config.exclude} sortKey={s.config.sortKey}
    emitSortOnMount={s.config.emit} onSort={(key: string) => s.events.push(key)} />}
  <output data-testid="events">{JSON.stringify(s.events)}</output>
</K.KjunProvider>)).mount('#root');
