import Vue from "vue";
import Kjun, { KjunProvider, DsTable, DsSearchInput } from "@kjun-ui/vue2";
import { setRootValues } from "./style-values";
Vue.use(Kjun); setRootValues();
const rows = [{ id: 2, name: "Two" }, { id: 0, name: "Zero" }, { id: 1, name: "One" }];
const requests: { query: string; signal: AbortSignal; resolve: (options: object[]) => void }[] = [];
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<object[]>(resolve => requests.push({ query, signal, resolve }));
const vm = new Vue({
  data: () => ({ expanded: [] as number[], controlled: true, accept: true, single: false, events: [] as unknown[],
    value: "", remote: true, disabled: false, debounce: 1000, mounted: true, selected: "none" }),
  render(h) {
    if (location.search.includes("table")) return h(KjunProvider, [
      h(DsTable, { props: { data: rows, columns: [{ key: "name", label: "Name" }], responsive: "card", expandable: true,
        expandedRows: this.controlled ? this.expanded : undefined, expandSingle: this.single },
        on: { "update:expandedRows": (expanded: number[]) => { this.events.push(expanded); if (this.accept) this.expanded = expanded; } },
        scopedSlots: { expand: ({ row }: { row: { id: number } }) => h("span", "Detail " + row.id) } }),
      h("output", { attrs: { "data-testid": "expanded" } }, JSON.stringify(this.expanded)),
      h("output", { attrs: { "data-testid": "events" } }, JSON.stringify(this.events)),
    ]);
    return h(KjunProvider, [
      this.mounted && h(DsSearchInput, { props: { value: this.value, disabled: this.disabled, debounce: this.debounce,
        loadOptions: this.remote ? loadOptions : null, ariaLabel: "Search" },
        on: { input: (value: string) => { this.events.push(value); this.value = value; },
          select: (option: { name: string }) => { this.selected = option.name; } } }),
      h("output", { attrs: { "data-testid": "model" } }, this.value),
      h("output", { attrs: { "data-testid": "events" } }, JSON.stringify(this.events)),
      h("output", { attrs: { "data-testid": "selected" } }, this.selected),
    ]);
  },
}).$mount("#root");
Object.assign(window, {
  configureState: (next: Partial<typeof vm.$data>) => Object.assign(vm, next),
  searchRequests: () => requests.map(({ query, signal }) => ({ query, aborted: signal.aborted })),
  resolveSearch: (index: number) => requests[index].resolve([{ id: index, name: requests[index].query + " result" }]),
});
