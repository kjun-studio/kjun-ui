import { useState, type ComponentType } from 'react';
const params = new URLSearchParams(location.search);
const records = [
  { name: 'Missing' },
  { name: 'Number zero', code: 0, alternate: '0' },
  { name: 'String zero', code: '0', alternate: 0 },
];
const requests: { signal: AbortSignal; query: string; resolve: (rows: typeof records) => void; reject: (error: Error) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<typeof records>((resolve, reject) => requests.push({ signal, query, resolve, reject }));
let instance = 0;
function Result({ name }: { name: string }) {
  const [id] = useState(() => ++instance);
  return <span data-testid={name} data-instance={id}>{name}</span>;
}
export function SearchContracts({ Search }: { Search: ComponentType<any> }) {
  const [value, setValue] = useState('Alpha');
  const [events, setEvents] = useState<unknown[]>([]);
  const [itemKey, setItemKey] = useState('code');
  const [config, setConfig] = useState({ disabled: false, minChars: 0, debounce: Number(params.get('debounce') || 0), async: !params.has('plain'), show: true });
  const log = (next: unknown) => setEvents(old => [...old, next]);
  Object.assign(window, {
    resetEvents: () => setEvents([]),
    configureSearch: (next: string | (Partial<typeof config> & { value?: string })) => {
      if (typeof next === "string") setItemKey(next);
      else { setConfig(old => ({ ...old, ...next })); if (next.value !== undefined) setValue(next.value); }
    },
    searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
    resolveSearch: (index: number) => requests[index].resolve(records),
    rejectSearch: (index: number) => requests[index].reject(new Error("request failed")),
  });
  return <>
    {config.show && <Search value={value} disabled={config.disabled} ariaLabel="Search" itemKey={itemKey} minChars={config.minChars}
      debounce={config.debounce}
      loadOptions={config.async ? loadOptions : undefined}
      renderOption={(item: typeof records[number]) => <Result name={item.name} />}
      onValueChange={(next: string) => { if (!params.has('reject')) setValue(next); log(['value', next]); }}
      onClear={() => log(['clear'])} onSelect={() => log(['select'])} onEnter={() => log(['enter'])} onSearchError={(error: unknown) => log(['error', String(error)])} />}
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
