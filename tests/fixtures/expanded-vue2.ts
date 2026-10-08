import Vue from "vue";
import plugin, * as K from "@kjun/vue2";
import {
  cssValues,
  scopedColors,
  scopedFont,
  setRootValues,
} from "./style-values";
Vue.use(plugin);
setRootValues();
const Content = Vue.extend({
  inject: ["kjunFeedback"],
  data: () => ({
    checked: false,
    toggle: false,
    radio: "a",
    selected: null as any,
    query: "",
    tab: "one",
    message: "",
  }),
  render(h) {
    const button = (label: string, fn: () => void) =>
      h(K.DsButton, { on: { click: fn } }, label);
    const feedback = (this as any).kjunFeedback;
    const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
      new Promise((resolve) => {
        signal.addEventListener("abort", () => {
          (window as any).aborts = ((window as any).aborts || 0) + 1;
        });
        setTimeout(
          () => resolve([{ id: query, name: query + " result" }]),
          query === "slow" ? 650 : 50
        );
      });
    return h(
      "div",
      {
        style: {
          padding: "24px",
          display: "grid",
          gap: "16px",
          maxWidth: "520px",
        },
      },
      [
        h(K.DsCheckbox, {
          props: { value: this.checked, label: "체크" },
          on: {
            input: (v) => {
              this.checked = v;
            },
          },
        }),
        h(K.DsSwitch, {
          props: { value: this.toggle, label: "스위치" },
          on: {
            input: (v) => {
              this.toggle = v;
            },
          },
        }),
        h(K.DsRadioGroup, {
          props: {
            value: this.radio,
            options: [
              { value: "a", label: "A" },
              { value: "b", label: "B", disabled: true },
              { value: "c", label: "C" },
            ],
          },
          on: {
            input: (v) => {
              this.radio = v;
            },
          },
        }),
        h(K.DsSelect, {
          props: {
            value: this.selected,
            options: [
              { value: "a", label: "사과" },
              { value: "b", label: "배", disabled: true },
              { value: "c", label: "체리" },
            ],
            ariaLabel: "과일",
            clearable: true,
          },
          on: {
            input: (v) => {
              this.selected = v;
            },
          },
        }),
        h("output", { attrs: { "data-testid": "selected" } }, this.selected),
        h(K.DsSearchInput, {
          props: { value: this.query, ariaLabel: "원격 검색", loadOptions },
          on: {
            input: (v) => {
              this.query = v;
            },
          },
        }),
        h(
          K.DsTabs,
          {
            props: { value: this.tab },
            on: {
              input: (v) => {
                this.tab = v;
              },
            },
          },
          [
            h(
              K.DsTabPane,
              { props: { name: "one", label: "첫 탭" } },
              "첫 내용"
            ),
            h(
              K.DsTabPane,
              { props: { name: "two", label: "둘째 탭" } },
              "둘째 내용"
            ),
          ]
        ),
        h(K.DsDropdown, [
          h("div", { slot: "trigger" }, [button("메뉴 열기", () => {})]),
          h(
            K.DsDropdownItem,
            {
              on: {
                click: () => {
                  this.message = "chosen";
                },
              },
            },
            "메뉴 항목"
          ),
        ]),
        h(K.DsAccordion, [
          h(K.DsAccordionItem, { props: { title: "열기 하나" } }, "내용 하나"),
          h(K.DsAccordionItem, { props: { title: "열기 둘" } }, "내용 둘"),
        ]),
        button("대기열 시작", async () => {
          const a = feedback.confirm({ title: "첫 확인" }),
            b = feedback.prompt({
              title: "다음 입력",
              validator: (v: string) => v.length > 1 || "두 글자 이상",
            });
          this.message = JSON.stringify([await a, await b]);
        }),
        button("알림 표시", () =>
          feedback.toast.success("영역 알림", { duration: 0 })
        ),
        h("output", { attrs: { role: "status" } }, this.message),
      ]
    );
  },
});
new Vue({
  data: () => ({ changed: false }),
  render(h) {
    return h(
      K.KjunProvider,
      {
        style: cssValues(scopedColors(this.changed), scopedFont(this.changed)),
      },
      [
        h(
          K.DsButton,
          {
            on: {
              click: () => {
                this.changed = !this.changed;
              },
            },
          },
          "영역 색상 변경"
        ),
        h(K.KjunFeedbackProvider, [h(Content)]),
      ]
    );
  },
}).$mount("#root");
