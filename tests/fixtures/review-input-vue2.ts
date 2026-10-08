import Vue from "vue";
import { KjunProvider, DsCombobox, DsSelect, DsSearchInput } from "@kjun/vue2";
import { setRootValues } from "./style-values";
setRootValues();
const params = new URLSearchParams(location.search), kind = params.get("control") || "combo", zero = params.has("zero");
const requests: { query: string; signal: AbortSignal; resolve: (value: { name: string }[]) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<{ name: string }[]>(resolve => requests.push({ query, signal, resolve }));
const vm = new Vue({
  data: () => ({ value: (kind === "search" ? "" : zero ? 0 : "a") as unknown, accept: true, disabled: false,
    minChars: 2, multiple: false, events: [] as unknown[], query: "" }),
  render(h) {
    const options = zero ? [0, 1] : [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
    return h(KjunProvider, [h(kind === "search" ? DsSearchInput : kind === "select" ? DsSelect : DsCombobox, {
      props: { ariaLabel: kind === "search" ? "Search" : "Choice", value: this.value, options,
        clearable: true, disabled: this.disabled, minChars: this.minChars, multiple: this.multiple,
        ...(kind === "search" ? { loadOptions } : {}) },
      on: { input: (value: unknown) => { this.events.push(value); if (this.accept) this.value = value; }, search: (query: string) => this.query = query },
    }), h("button", { style: { display: "block", marginTop: "160px" } }, "Outside"),
    h("output", { attrs: { "data-testid": "model" } }, JSON.stringify(this.value)),
    h("output", { attrs: { "data-testid": "events" } }, JSON.stringify(this.events)),
    h("output", { attrs: { "data-testid": "search" } }, this.query)]);
  },
}).$mount("#root");
Object.assign(window, {
  configureInput: (next: Partial<typeof vm.$data>) => Object.assign(vm, next),
  searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
  resolveSearch: (index: number) => requests[index].resolve([{ name: requests[index].query + " result" }]),
});
