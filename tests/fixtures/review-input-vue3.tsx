import { createApp, defineComponent, nextTick, reactive } from "vue";
import { KjunProvider, KjunCombobox, KjunSelect, KjunSearchInput } from "@kjun-ui/vue3";
import { setRootValues } from "./style-values";
setRootValues();
const params = new URLSearchParams(location.search), kind = params.get("control") || "combo", zero = params.has("zero");
const requests: { query: string; signal: AbortSignal; resolve: (value: { name: string }[]) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<{ name: string }[]>(resolve => requests.push({ query, signal, resolve }));
const s = reactive({ value: (kind === "search" ? "" : zero ? 0 : "a") as any, accept: true, disabled: false,
  minChars: 2, multiple: false, events: [] as unknown[], query: "", open: undefined as boolean | undefined, searchable: false });
const change = (value: unknown) => { s.events = [...s.events, value]; if (s.accept) s.value = value; };
Object.assign(window, {
  configureInput: (next: object) => Object.assign(s, next),
  reopenSelect: async () => {
    const menu = document.querySelector('.kjun-select-content');
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    const exiting = !!document.querySelector('.kjun-select-panel[inert][data-motion-open="false"]');
    s.open = true;
    await nextTick(); await nextTick();
    return { exiting, retained: menu === document.querySelector('.kjun-select-content') };
  },
  searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
  resolveSearch: (index: number) => requests[index].resolve([{ name: requests[index].query + " result" }]),
});
const options: any[] = zero ? [0, 1] : [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
createApp(defineComponent(() => () => <KjunProvider>
  {kind === "search" ? <KjunSearchInput ariaLabel="Search" modelValue={String(s.value ?? "")} minChars={s.minChars} loadOptions={loadOptions} onUpdate:modelValue={change} />
    : kind === "select" ? <KjunSelect ariaLabel="Choice" modelValue={s.value} options={options} clearable multiple={s.multiple} onUpdate:modelValue={change}
      open={s.open} searchable={s.searchable} onUpdate:open={(open: boolean) => { if (s.open !== undefined) s.open = open; }} />
    : <KjunCombobox ariaLabel="Choice" modelValue={s.value} options={options} disabled={s.disabled} clearable onUpdate:modelValue={change} onSearch={(q: string) => { s.query = q; }} />}
  <button style={{ display: "block", marginTop: "160px" }}>Outside</button>
  <output data-testid="model">{JSON.stringify(s.value)}</output>
  <output data-testid="events">{JSON.stringify(s.events)}</output>
  <output data-testid="search">{s.query}</output>
</KjunProvider>)).mount("#root");
