import Vue from 'vue';
import { KjunProvider, DsButton, DsModal, DsSearchInput } from '@kjun/vue2';
import { setRootValues } from './style-values';
setRootValues();
const params = new URLSearchParams(location.search);
const records = [
  { name: 'Missing' },
  { name: 'Number zero', code: 0, alternate: '0' },
  { name: 'String zero', code: '0', alternate: 0 },
];
const requests: { signal: AbortSignal; query: string; resolve: (rows: typeof records) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<typeof records>(resolve => requests.push({ signal, query, resolve }));
let instance = 0;
const Result = Vue.extend({
  props: ['name'], data: () => ({ id: ++instance }),
  render(h) { return h('span', { attrs: { 'data-testid': this.name, 'data-instance': this.id } }, this.name); },
});
const vm = new Vue({
  data: () => ({ open: false, value: 'Alpha', events: [] as unknown[], itemKey: 'code' }),
  render(h) {
    const field = h(DsSearchInput, {
      props: { value: this.value, loadOptions: params.has('plain') ? undefined : loadOptions,
        ariaLabel: 'Search', minChars: 0, itemKey: this.itemKey, debounce: Number(params.get('debounce') || 0) },
      on: {
        input: (next: string) => { if (!params.has('reject')) this.value = next; this.events.push(['value', next]); },
        clear: () => this.events.push(['clear']), select: () => this.events.push(['select']),
      },
      scopedSlots: { item: ({ item }: { item: typeof records[number] }) => h(Result, { props: { name: item.name } }) },
    });
    return h(KjunProvider, [
      ...(params.has('modal') ? [
        h(DsButton, { on: { click: () => { this.open = true; } } }, ['Open']),
        h(DsModal, { props: { value: this.open, title: 'Editor' }, on: { input: (next: boolean) => { this.open = next; } } }, [field]),
      ] : [field]),
      h('output', { attrs: { 'data-testid': 'events' } }, JSON.stringify(this.events)),
    ]);
  },
}).$mount('#root');
Object.assign(window, {
  resetEvents: () => { vm.events = []; },
  configureSearch: (key: string) => { vm.itemKey = key; },
  searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
  resolveSearch: (index: number) => requests[index].resolve(records),
});
