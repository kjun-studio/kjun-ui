import Vue from "vue";
import * as K from "@kjun-ui/vue2";
import { setRootValues } from "./style-values";
setRootValues();
let instance = 0;
const Option = Vue.extend({ props: ["option"], data: () => ({ id: ++instance }), render(h) {
  return h("span", { attrs: { "data-testid": this.option.label, "data-instance": this.id } }, this.option.label);
} });
const vm = new Vue({
  data: () => ({ controlled: false, open: false, accept: true, disabled: false, value: null as unknown,
    options: [{ value: 0, label: "Number zero" }, { value: "0", label: "String zero" }, { value: "alpha", label: "Alpha" },
      { value: "beta", label: "Beta", disabled: true }, { value: "gamma", label: "Gamma" }],
    pageSize: 2, multiple: false, tabs: [] as { name: string; label: string; disabled?: boolean }[], tabValue: "", compound: false,
    accordionMultiple: true, children: ["One", "Two", "Three"], defaults: false, events: [] as unknown[],
  }),
  methods: { emit(name: string, value?: unknown) { this.events.push([name, value]); } },
  render(h) {
    const kind = new URLSearchParams(location.search).get("case") || "select";
    const select = () => h(K.DsSelect, {
      props: { value: this.value, options: this.options, ariaLabel: "Choose", searchable: true, open: this.controlled ? this.open : undefined,
        disabled: this.disabled, optionPageSize: this.pageSize, multiple: this.multiple },
      on: { "update:open": (open: boolean) => { this.emit("open", open); if (this.accept) this.open = open; }, search: (q: string) => this.emit("search", q),
        input: (value: unknown) => { this.emit("value", value); if (this.accept) this.value = value; }, change: (value: unknown) => this.emit("change", value) },
      scopedSlots: { option: ({ option }: { option: object }) => h(Option, { props: { option } }) },
    });
    const body = kind === "select" ? select() : kind === "modal" ? h(K.DsModal, { props: { value: true, title: "Editor" }, on: { input: () => this.emit("modal") } }, [select()])
      : kind === "tabs" ? h(K.DsTabs, { props: { value: this.tabValue, items: this.compound ? [] : this.tabs }, on: {
        input: (value: string) => { this.emit("value", value); if (this.accept) this.tabValue = value; }, change: (value: string) => this.emit("change", value),
      } }, this.compound ? this.tabs.map(tab => h(K.DsTabPane, { key: tab.name, props: tab }, tab.label + " content")) : [])
      : kind === "accordion" ? h(K.DsAccordion, { props: { multiple: this.accordionMultiple } }, this.children.map(title => h(K.DsAccordionItem, { key: title, props: { title, defaultOpen: this.defaults } }, title + " content"))) : null;
    return h(K.KjunProvider, [body, h("button", { style: { marginTop: "40px" } }, "Outside"), h("output", { attrs: { "data-testid": "events" } }, JSON.stringify(this.events))]);
  },
}).$mount("#root");
Object.assign(window, { configureState: (next: object) => { Object.assign(vm, next); }, resetStateEvents: () => { vm.events = []; } });
