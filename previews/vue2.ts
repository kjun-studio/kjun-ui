import Vue from "vue";
import { KjunProvider, DsButton, DsInput, DsModal, DsFormGroup } from "@kjun-ui/vue2";
import { defaultConfig, componentProps, labelFor } from "../shared/demo-config";
import { connectDemo } from "./bridge";
import {applyDemoColors} from "../shared/demo-colors";
applyDemoColors(defaultConfig.palette);
Vue.config.productionTip = false;
Vue.config.devtools = false;
const app = new Vue({
  data: () => ({ config: defaultConfig, count: 0, value: "", open: false, saved: false }),
  watch: {
    open(value: boolean) {
      window.parent.postMessage({ type: "kjun:modal-state", open: value }, location.origin);
    },
  },
  render(h) {
    const c = this.config,
      props = componentProps(c);
    const output = (value: string) => h("output", { attrs: { "aria-live": "polite" } }, value);
    let children;
    if (c.component === "button")
      children = [
        h("div", { class: "demo-control" }, [
          h(DsButton, { props, on: { click: () => this.count++ } }, labelFor(c)),
        ]),
        output(this.count ? this.count + "번 실행했습니다" : "버튼을 눌러보세요"),
      ];
    else if (c.component === "input") {
      const { readOnly, ...inputProps } = props as any;
      children = [
        h("div", { class: "demo-field" }, [
          h(
            DsFormGroup,
            { props: { label: "내용", hint: "입력한 값은 이 예제 안에서만 사용됩니다." } },
            [
              h(DsInput, {
                props: { ...inputProps, readonly: readOnly, value: this.value },
                on: { input: (value: string) => (this.value = value) },
              }),
            ],
          ),
        ]),
        output(this.value ? "입력값: " + this.value : "입력 대기 중"),
      ];
    } else
      children = [
        h(
          DsButton,
          {
            props: { size: "lg" },
            on: {
              click: () => {
                this.saved = false;
                this.open = true;
              },
            },
          },
          "모달 열기",
        ),
        output(this.saved ? "저장했습니다" : "확인·취소·닫기를 살펴보세요"),
        h(
          DsModal,
          {
            props: { ...props, value: this.open },
            on: {
              input: (value: boolean) => (this.open = value),
              confirm: () => {
                this.saved = true;
                this.open = false;
              },
            },
          },
          [
            h("p", { style: { margin: 0 } }, "입력한 내용을 저장할까요?"),
            h(
              "p",
              {
                style: {
                  margin: "12px 0 0",
                  fontSize: "14px",
                  color: "var(--kjun-text-secondary)",
                },
              },
              "확인을 누르면 저장하고 모달을 닫습니다.",
            ),
          ],
        ),
      ];
    return h(KjunProvider, [
      h("div", { class: "demo-stage", attrs: { "data-component": c.component } }, children),
    ]);
  },
}).$mount("#root");
connectDemo((config) => {
  app.config = config;
});
