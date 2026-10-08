import Vue from "vue";
import Kjun, { KjunProvider, DsButton, DsInput, DsModal } from "@kjun/vue2";
import { scoped, rootValues, cssValues } from "./color-contract-values";
rootValues(); Vue.use(Kjun);
const vm = new Vue({
  data: () => ({ changed: false, override: false, open: false }),
  render(h) {
    const input = (name: string) => h(DsInput, { props: { value: name, ariaLabel: name, readonly: true } });
    return h(KjunProvider, [input("Outer input"), h(KjunProvider, { style: cssValues(scoped(this.changed, this.override)) }, [
      input("Scoped input"), h(DsButton, { on: { click: () => { this.open = true; } } }, "Open dialog"),
      h(DsModal, { props: { value: this.open, title: "Core colors" }, on: { input: (open: boolean) => { this.open = open; } } }, [input("Dialog input")]),
    ])]);
  },
}).$mount("#root");
Object.assign(window, { configureFollowup: (next: Partial<typeof vm.$data>) => Object.assign(vm, next) });
