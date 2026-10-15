import { createApp, defineComponent, h, ref, shallowRef, watch } from "vue";
import { KjunProvider, KjunButton, KjunInput, KjunModal, KjunFormGroup } from "@kjun-ui/vue3";
import { defaultConfig, componentProps, labelFor, type DemoConfig } from "../shared/demo-config";
import { connectDemo } from "./bridge";
import { applyDemoColors } from "../shared/demo-colors";
applyDemoColors(defaultConfig.palette);
const config = shallowRef<DemoConfig>(defaultConfig);
const count = ref(0), value = ref(""), open = ref(false), saved = ref(false);
watch(open, next => window.parent.postMessage({ type: "kjun:modal-state", open: next }, location.origin));
const output = (text: string) => h("output", { "aria-live": "polite" }, text);
createApp(defineComponent(() => () => {
  const c = config.value, props = componentProps(c) as Record<string, any>;
  let children;
  if (c.component === "button")
    children = [
      h("div", { class: "demo-control" }, [h(KjunButton, { ...props, onClick: () => count.value++ }, { default: () => labelFor(c) })]),
      output(count.value ? count.value + "번 실행했습니다" : "버튼을 눌러보세요"),
    ];
  else if (c.component === "input") {
    const { placeholder, ...inputProps } = props;
    children = [
      h("div", { class: "demo-field" }, [
        h(KjunFormGroup, { label: "내용", hint: "입력한 값은 이 예제 안에서만 사용됩니다." }, {
          default: () => h(KjunInput, { ...inputProps, placeholder, modelValue: value.value, "onUpdate:modelValue": (next: string) => (value.value = next) }),
        }),
      ]),
      output(value.value ? "입력값: " + value.value : "입력 대기 중"),
    ];
  } else
    children = [
      h(KjunButton, { size: "lg", onClick: () => { saved.value = false; open.value = true; } }, { default: () => "모달 열기" }),
      output(saved.value ? "저장했습니다" : "확인·취소·닫기를 살펴보세요"),
      h(KjunModal, { ...props, open: open.value, "onUpdate:open": (next: boolean) => (open.value = next), onConfirm: () => { saved.value = true; open.value = false; } }, {
        default: () => [
          h("p", { style: { margin: 0 } }, "입력한 내용을 저장할까요?"),
          h("p", { style: { margin: "12px 0 0", fontSize: "14px", color: "var(--kjun-text-secondary)" } }, "확인을 누르면 저장하고 모달을 닫습니다."),
        ],
      }),
    ];
  return h(KjunProvider, null, { default: () => h("div", { class: "demo-stage", "data-component": c.component }, children) });
})).mount("#root");
connectDemo(next => { config.value = next; });
