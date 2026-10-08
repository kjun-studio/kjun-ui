import { useState } from "react";
import type { DsCombobox, DsSelect, DsSearchInput } from "@kjun-ui/react";

type Controls = { Combo: typeof DsCombobox; Select: typeof DsSelect; Search: typeof DsSearchInput };
const requests: { query: string; signal: AbortSignal; resolve: (value: { name: string }[]) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<{ name: string }[]>(resolve => requests.push({ query, signal, resolve }));

export function InputContracts({ Combo, Select, Search }: Controls) {
  const params = new URLSearchParams(location.search), kind = params.get("control") || "combo", zero = params.has("zero");
  const [config, setConfig] = useState({ value: (kind === "search" ? "" : zero ? 0 : "a") as string | number | null,
    accept: true, disabled: false, minChars: 2, multiple: false });
  const [events, setEvents] = useState<unknown[]>([]), [query, setQuery] = useState("");
  const change = (value: unknown) => {
    setEvents(previous => [...previous, value]);
    if (config.accept) setConfig(previous => ({ ...previous, value: value as typeof config.value }));
  };
  Object.assign(window, {
    configureInput: (next: Partial<typeof config>) => setConfig(previous => ({ ...previous, ...next })),
    searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
    resolveSearch: (index: number) => requests[index].resolve([{ name: requests[index].query + " result" }]),
  });
  const options = zero ? [0, 1] : [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
  return <>
    {kind === "search" ? <Search ariaLabel="Search" value={String(config.value ?? "")} minChars={config.minChars} loadOptions={loadOptions} onValueChange={change} />
      : kind === "select" ? <Select ariaLabel="Choice" value={config.value} options={options} clearable multiple={config.multiple} onValueChange={change} />
      : <Combo ariaLabel="Choice" value={config.value} options={options} disabled={config.disabled} clearable onValueChange={change} onSearch={setQuery} />}
    <button style={{ display: "block", marginTop: 160 }}>Outside</button>
    <output data-testid="model">{JSON.stringify(config.value)}</output>
    <output data-testid="events">{JSON.stringify(events)}</output>
    <output data-testid="search">{query}</output>
  </>;
}
