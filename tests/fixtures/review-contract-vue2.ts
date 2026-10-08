import Vue from "vue";
import { KjunProvider, DsModal, DsDrawer, DsFormGroup, DsQuantityStepper, DsTable, DsButton } from "@kjun/vue2";
import { setRootValues } from "./style-values";
setRootValues();
const rows = [{ id: 3, name: "Three", amount: 30 }, { id: 1, name: "One", amount: 10 }, { id: 2, name: "Two", amount: 20 }];
const vm = new Vue({
  data: () => ({ value: 2, open: false, disabled: false, accept: true, label: "Order quantity", hint: "Quantity hint", error: "", required: true,
    layerKind: 'modal', closeOnEsc: true, showHeader: true, dialogTitle: 'Editor',
    dialogLabel: undefined as string | undefined, customHeader: false,
    inputId: undefined as string | undefined, ariaLabel: undefined as string | undefined,
    data: rows, controlled: false, sort: null as null | { key: string; order: "asc" | "desc" },
    sortMode: "client", sortable: true, rowAction: true, sync: false,
    searchable: false, show: true, controlledExpansion: false, expanded: [] as (string | number)[], expandSingle: false,
    responsive: "card", maxHeight: undefined as number | undefined, events: [] as unknown[], selected: [] as object[] }),
  methods: { emit(name: string, value?: unknown) { this.events.push([name, value]); } },
  render(h) {
    const button = (label: string, click: () => void) => h(DsButton, { on: { click } }, label);
    const content = location.search.includes("table") ? [this.show ? h(DsTable, {
      props: { data: this.data, columns: [{ key: "name", label: "Name" }, { key: "amount", label: "Amount", sortable: true }, { key: "actions", label: "Actions" }],
        responsive: this.responsive, searchable: this.searchable, maxHeight: this.maxHeight,
        expandedRows: this.controlledExpansion ? this.expanded : undefined, expandSingle: this.expandSingle, selectable: true, selected: this.selected, expandable: true,
        sort: this.controlled ? this.sort : undefined, sortMode: this.sortMode, sortable: this.sortable },
      on: { search: (q: string) => this.emit("search", q),
        "update:expandedRows": (keys: (string | number)[]) => { this.emit("expanded", keys); if (this.accept) this.expanded = keys; },
        "selection-change": (selected: object[]) => { this.selected = selected; },
        "update:sort": (sort: NonNullable<typeof this.sort>) => { if (this.sync) { this.emit("update:sort", sort); if (this.accept) this.sort = sort; } },
        "sort-change": (sort: NonNullable<typeof this.sort>) => { this.emit("sort", sort); if (this.accept && !this.sync) this.sort = sort; },
        ...(this.rowAction ? { "row-click": (row: typeof rows[number], index: number) => this.emit("row", [row.id, index]) } : {}),
      },
      scopedSlots: {
        "cell-name": ({ row }: { row: typeof rows[number] }) => h("span", { attrs: { "data-testid": "row-" + row.id } }, row.name),
        "cell-actions": () => button("Action", () => this.emit("action")),
        expand: ({ row }: { row: typeof rows[number] }) => h("span", "Detail " + row.id),
      },
    }) : null] : [button("Open", () => { this.open = true; }), h(this.layerKind === 'drawer' ? DsDrawer : DsModal, {
      props: { value: this.open, title: this.dialogTitle, ariaLabel: this.dialogLabel, showHeader: this.showHeader, closeOnEsc: this.closeOnEsc },
      scopedSlots: this.customHeader ? { header: () => h('span', 'Custom heading') } : {},
      on: { input: (open: boolean) => { this.open = open; } },
    }, [
      h(DsFormGroup, { props: { id: "quantity-field", label: this.label, hint: this.hint, error: this.error, required: this.required } }, [
        h(DsQuantityStepper, { props: { value: this.value, disabled: this.disabled, id: this.inputId, ariaLabel: this.ariaLabel },
          on: { input: (value: number) => { this.emit("value", value); if (this.accept) this.value = value; }, change: (value: number) => this.emit("commit", value), "invalid-input": (draft: string) => this.emit("invalid", draft) } }),
      ]), button("Other field", () => {}),
    ])];
    return h(KjunProvider, [...content,
      h("output", { attrs: { "data-testid": "selected" } }, JSON.stringify(this.selected)),
      h("output", { attrs: { "data-testid": "model" } }, JSON.stringify({ value: this.value, sort: this.sort })),
      h("output", { attrs: { "data-testid": "events" } }, JSON.stringify(this.events)),
    ]);
  },
}).$mount("#root");
Object.assign(window, { configureReview: (next: object) => Object.assign(vm, next), resetReviewEvents: () => { vm.events = []; } });
