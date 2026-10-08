import Vue from "vue";
import { KjunProvider, KjunFeedbackProvider, DsTable } from "@kjun-ui/vue2";
import { setRootValues } from "./style-values";

setRootValues();
const ToastCase = Vue.extend({
  inject: ["kjunFeedback"],
  mounted() {
    Object.assign(window, { showToast: () => (this as any).kjunFeedback.toast.info("Timed message", {
      duration: 1000, action: { label: "Action", onClick() {} },
    }) });
  },
  render: h => h("button", { attrs: { "data-testid": "outside" } }, "Outside"),
});
new Vue({
  data: () => ({ submits: 0, selected: [] as object[] }),
  render(h) {
    if (location.search.includes("toast")) return h(KjunProvider, [h(KjunFeedbackProvider, [h(ToastCase)])]);
    return h(KjunProvider, [
      h("form", { on: { submit: (event: Event) => { event.preventDefault(); this.submits++; } } }, [
        h(DsTable, {
          props: {
            data: [{ id: 1, name: "One" }, { id: 2, name: "Two" }],
            columns: [{ key: "name", label: "Name" }],
            expandable: true, selectable: true, selected: this.selected, responsive: "card",
          },
          on: { "selection-change": (value: object[]) => { this.selected = value; } },
          scopedSlots: { expand: () => h("span", "Detail") },
        }),
        h("button", { attrs: { type: "submit" } }, "Save"),
      ]),
      h("output", { attrs: { "data-testid": "submits" } }, String(this.submits)),
      h("output", { attrs: { "data-testid": "selected" } }, String(this.selected.length)),
    ]);
  },
}).$mount("#root");
