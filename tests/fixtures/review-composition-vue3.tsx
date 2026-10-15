import { createApp, defineComponent, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const params = new URLSearchParams(location.search), mode = params.get('case');
const records = [
  { name: 'Missing' },
  { name: 'Number zero', code: 0, alternate: '0' },
  { name: 'String zero', code: '0', alternate: 0 },
];
const requests: { signal: AbortSignal; query: string; resolve: (rows: typeof records) => void; reject: (error: Error) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<typeof records>((resolve, reject) => requests.push({ signal, query, resolve, reject }));
let instance = 0;
const Result = defineComponent({ props: { name: { type: String, required: true } }, setup(props) {
  const id = ++instance;
  return () => <span data-testid={props.name} data-instance={id}>{props.name}</span>;
} });
const state = reactive({
  value: 'Alpha', open: params.has('initial'), modal: false, events: [] as unknown[], itemKey: 'code',
  config: { disabled: false, minChars: 0, debounce: Number(params.get('debounce') || 0), async: !params.has('plain'), show: true },
});
// SearchInput keeps its own model, separate from the Popover editor value.
const searchValue = ref('Alpha');
const log = (event: unknown) => { state.events.push(event); };
Object.assign(window, {
  resetEvents: () => { state.events = []; },
  configureSearch: (next: string | (Partial<typeof state.config> & { value?: string })) => {
    if (typeof next === 'string') state.itemKey = next;
    else { const { value, ...rest } = next; Object.assign(state.config, rest); if (value !== undefined) searchValue.value = value; }
  },
  searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
  resolveSearch: (index: number) => requests[index].resolve(records),
  rejectSearch: (index: number) => requests[index].reject(new Error('request failed')),
});
const search = () => state.config.show && <K.KjunSearchInput modelValue={searchValue.value} disabled={state.config.disabled} ariaLabel="Search"
  itemKey={state.itemKey} minChars={state.config.minChars} debounce={state.config.debounce}
  loadOptions={state.config.async ? loadOptions : undefined}
  onUpdate:modelValue={(next: string) => { if (!params.has('reject')) searchValue.value = next; log(['value', next]); }}
  onClear={() => log(['clear'])} onSelect={() => log(['select'])} onEnter={() => log(['enter'])}
  onSearch-error={(error: unknown) => log(['error', String(error)])}>
  {{ option: ({ option }: { option: any }) => <Result name={option.name} /> }}
</K.KjunSearchInput>;
const market = () => ({
  rows: [{ id: 1, name: 'Alpha', current_price: 1 }], primaryLabel: (row: any) => row.name,
  priceValue: () => 1, changeValue: () => null, priceFormatter: String,
  onRowClick: params.has('passive') ? undefined : () => log('row'),
});
const nameSuffix = () => <K.KjunButton onClick={() => log('action')}>Action</K.KjunButton>;
// Mirrors the Vue 2 state-contracts search scenario: a controlled SearchInput with live debounce and mode switches.
const stateRequests: { query: string; signal: AbortSignal; resolve: (options: object[]) => void }[] = [];
const StateSearch = defineComponent(() => {
  const config = reactive({ value: '', remote: true, disabled: false, debounce: 1000, mounted: true, selected: 'none', events: [] as unknown[] });
  const load = (query: string, { signal }: { signal: AbortSignal }) => new Promise<object[]>(resolve => stateRequests.push({ query, signal, resolve }));
  Object.assign(window, {
    configureState: (next: Partial<typeof config>) => Object.assign(config, next),
    searchRequests: () => stateRequests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
    resolveSearch: (index: number) => stateRequests[index].resolve([{ id: index, name: stateRequests[index].query + ' result' }]),
  });
  return () => <>
    {config.mounted && <K.KjunSearchInput modelValue={config.value} disabled={config.disabled} debounce={config.debounce}
      loadOptions={config.remote ? load : undefined} ariaLabel="Search"
      onUpdate:modelValue={(value: string) => { config.events.push(value); config.value = value; }}
      onSelect={(option: any) => { config.selected = option.name; }} />}
    <output data-testid="model">{config.value}</output>
    <output data-testid="events">{JSON.stringify(config.events)}</output>
    <output data-testid="selected">{config.selected}</output>
  </>;
});
const Cases = defineComponent(() => () => mode === 'state-search' ? <StateSearch /> : <>
  {mode === 'focus' && <K.KjunPopover focusOnOpen ariaLabel="Editor" open={state.open} onUpdate:open={(open: boolean) => { state.open = open; }}>
    {{
      trigger: () => <K.KjunButton>Open</K.KjunButton>,
      default: () => <K.KjunInput modelValue={state.value} ariaLabel="Edit value" onUpdate:modelValue={(value: string) => { state.value = value; }} />,
    }}
  </K.KjunPopover>}
  {mode === 'list' && <K.KjunMarketSimpleList {...market()}>{{ nameSuffix }}</K.KjunMarketSimpleList>}
  {mode === 'cards' && <K.KjunMarketCards {...market()} storageNamespace="review-composition" metricConfig={{ current_price: { label: 'Price' } }}
    columns={[{ key: 'current_price', label: 'Price' }]}>{{ nameSuffix }}</K.KjunMarketCards>}
  {!mode && (params.has('modal') ? <>
    <K.KjunButton onClick={() => { state.modal = true; }}>Open</K.KjunButton>
    <K.KjunModal open={state.modal} title="Editor" onUpdate:open={(open: boolean) => { state.modal = open; }}>{{ default: search }}</K.KjunModal>
  </> : search())}
  {mode ? <><output data-testid="value">{state.value}</output><output data-testid="events">{JSON.stringify(state.events)}</output></>
    : <output data-testid="events">{JSON.stringify(state.events)}</output>}
</>);
createApp(defineComponent(() => () => <K.KjunProvider><Cases /></K.KjunProvider>)).mount('#root');
