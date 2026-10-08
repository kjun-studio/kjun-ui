import Vue from "vue";
import Kjun, { KjunProvider, DsFormGroup, DsTimePicker, DsModal, DsButton } from "@kjun-ui/vue2";
import { setRootValues } from "./style-values";
setRootValues();
Vue.use(Kjun);
const vm = new Vue({
  data: () => ({ value: "10:30:15" as string | null, error: "", open: true, inner: false, escape: false, innerEscape: true }),
  render(h) {
    if (location.search.includes("time")) return h(KjunProvider, [
      h(DsFormGroup, { props: { id: "review-time", label: "예약 시간", hint: "영업시간 안에서 선택하세요", error: this.error } }, [
        h(DsTimePicker, { props: { value: this.value, precision: "second" }, on: { input: (value: string | null) => { this.value = value; } } }),
      ]),
      h("output", { attrs: { "data-testid": "time" } }, this.value ?? "none"),
      h(DsFormGroup, { props: { label: "종료 시간" } }, [h(DsTimePicker, { props: { value: "11:45" } })]),
    ]);
    return h(KjunProvider, [h(DsModal, {
      props: { title: "바깥 모달", value: this.open, closeOnEsc: this.escape },
      on: { input: (value: boolean) => { this.open = value; } },
    }, [
      h(DsButton, { on: { click: () => { this.inner = true; } } }, "안쪽 모달 열기"),
      h(DsModal, { props: { title: "안쪽 모달", value: this.inner, closeOnEsc: this.innerEscape }, on: { input: (value: boolean) => { this.inner = value; } } }, [h(DsButton, "안쪽 행동")]),
    ])]);
  },
}).$mount("#root");
Object.assign(window, {
  configureReview: (next: Partial<typeof vm.$data>) => Object.assign(vm, next),
  unmountReview: () => { vm.$destroy(); vm.$el.remove(); },
});
