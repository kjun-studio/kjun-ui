import Vue from "vue";
import * as K from "@kjun/vue2";
import { applyDemoColors } from "../../shared/demo-colors";
applyDemoColors("default");
Vue.config.productionTip = false;
const options = [
  { value: "a", label: "사과" },
  { value: "b", label: "배", disabled: true },
  { value: "c", label: "체리" },
];
new Vue({
  data: () => ({ selected: null, combo: null, radio: "a", disabled: false, clicks: 0, custom: false, modal: false }),
  render(h) {
    const sample = (id: string, node: any) => h("div", { attrs: { "data-testid": id } }, [node]);
    return h("div", [
      h("button", { attrs: { "data-testid": "outside" } }, "앱 버튼"),
      h(K.KjunProvider, [
        h(K.DsButton, { attrs: { "data-testid": "primary" } }, "기본 버튼"),
        h(K.DsButton, { props: { variant: "secondary" }, attrs: { "data-testid": "secondary" } }, "보조 버튼"),
        sample("card", h(K.DsCard, { props: { title: "카드 제목", subtitle: "카드 설명", border: true, elevation: "raised" } }, "본문")),
        sample("refresh", h(K.DsIcon, { props: { name: "refresh", size: "28" }, attrs: { "aria-label": "새로고침 아이콘" }, on: { click: () => this.clicks++ } })),
        sample("icon-clicks", String(this.clicks)),
        sample("filled", h(K.DsIcon, { props: { name: "heart", filled: true } })),
        sample("ratio", h(K.DsSignedValue, { props: { value: 0.0235, format: "percent" } })),
        sample("raw", h(K.DsSignedValue, { props: { value: 2.35, format: "percent", isRaw: true, tone: "pill" } })),
        sample("deviation", h(K.DsDeviation, { props: { value: -1.25 } })),
        h(K.KjunProvider, { props: { formatters: { percent: (n: number) => (this.custom ? "변경 " : "프로젝트 ") + n } } }, [
          sample("injected", h(K.DsSignedValue, { props: { value: 2.35, format: "percent", isRaw: true } })),
          sample("override", h(K.DsSignedValue, { props: { value: 2.35, format: "percent", formatter: () => "셀 포맷" } })),
          h(K.DsButton, { on: { click: () => { this.custom = true; } } }, "포맷 변경"),
        ]),
        sample("select", h(K.DsSelect, { props: { value: this.selected, options, ariaLabel: "목록 선택" }, on: { input: (value: any) => { this.selected = value; } } })),
        sample("combo", h(K.DsCombobox, { props: { value: this.combo, options, disabled: this.disabled, ariaLabel: "목록 검색" }, on: { input: (value: any) => { this.combo = value; } } })),
        sample("combo-value", String(this.combo)),
        h(K.DsRadioGroup, { props: { value: this.radio, disabled: this.disabled }, on: { input: (value: any) => { this.radio = value; } } }, options.map(option => h(K.DsRadio, { props: { val: option.value, label: "라디오 " + option.label, disabled: option.disabled } }))),
        h(K.DsButton, { on: { click: () => { this.disabled = !this.disabled; } } }, "비활성 전환"),
        h(K.DsAlert, { props: { closable: true, title: "상태 안내" } }, "알림 본문"),
        h(K.DsButton, { on: { click: () => { this.modal = true; } } }, "중첩 선택 열기"),
        h(K.DsModal, { props: { value: this.modal, title: "선택 대화상자" }, on: { input: (value: boolean) => { this.modal = value; } } }, [
          h(K.DsSelect, { props: { options, searchable: true, ariaLabel: "모달 선택" } }),
          h(K.DsCombobox, { props: { options, ariaLabel: "모달 검색" } }),
        ]),
      ]),
    ]);
  },
}).$mount("#root");
