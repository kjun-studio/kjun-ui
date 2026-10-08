import Vue from "vue";
import Kjun, { KjunProvider, DsTabs, DsTabPane, DsPagination, DsSearchInput } from "@kjun/vue2";
import { setRootValues } from "./style-values";
setRootValues();
Vue.use(Kjun);
const vm = new Vue({
  data: () => ({ value: "a", disabled: false, label: "Second", badge: 1, name: "b", mounted: true, size: 10, page: 2, total: 30, showSizeSelector: true, showInfo: true, debounce: 1000, handler: "first", events: [] as string[] }),
  render(h) {
    if (location.search.includes("search")) return h(KjunProvider, [
      this.mounted && h(DsSearchInput, { props: { value: this.value, disabled: this.disabled, debounce: this.debounce, ariaLabel: "검색" },
        on: { input: (value: string) => { this.events.push(`${this.handler}:${value}`); this.value = value; } } }),
      h("output", { attrs: { "data-testid": "model" } }, this.value),
      h("output", { attrs: { "data-testid": "events" } }, JSON.stringify(this.events)),
    ]);
    if (location.search.includes("pagination")) return h(KjunProvider, [
      h(DsPagination, { props: { totalPages: Math.ceil(this.total / this.size), totalRows: this.total, currentPage: this.page, pageSize: this.size, showSizeSelector: this.showSizeSelector, showInfo: this.showInfo },
        on: { "update:page-size": (size: number) => { this.size = size; }, "update:currentPage": (page: number) => { this.page = page; } } }),
      h("output", { attrs: { "data-testid": "model" } }, `${this.size}:${this.page}`),
    ]);
    return h(KjunProvider, [h(DsTabs, { props: { value: this.value }, on: { input: (value: string) => { this.value = value; } } }, [
      h(DsTabPane, { key: "a", props: { name: "a", label: "First" } }, "first panel"),
      this.mounted && h(DsTabPane, { key: "b", props: { name: this.name, label: this.label, badge: this.badge, disabled: this.disabled } }, "second panel"),
    ]), h("output", { attrs: { "data-testid": "model" } }, this.value)]);
  },
}).$mount("#root");
Object.assign(window, { configureFollowup: (next: Partial<typeof vm.$data>) => Object.assign(vm, next) });
