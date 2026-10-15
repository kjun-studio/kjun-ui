import { createApp, defineComponent, reactive } from "vue";
import {
  KjunProvider, KjunFeedbackProvider, useKjunFeedback, KjunButton, KjunSelect, KjunSearchInput, KjunCheckbox, KjunRadioGroup, KjunSwitch,
  KjunTabs, KjunTabPane, KjunDropdown, KjunDropdownItem, KjunAccordion, KjunAccordionItem, KjunCard, KjunBadge, KjunProgress, KjunSkeleton, KjunTooltip,
} from "@kjun-ui/vue3";
import { cssValues, scopedColors, scopedFont, setRootValues } from "./style-values";
setRootValues();
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<{ id: string; name: string }[]>(resolve => {
    signal.addEventListener("abort", () => { (window as any).aborts = ((window as any).aborts || 0) + 1; });
    setTimeout(() => resolve([{ id: query, name: query + " result" }]), query === "slow" ? 650 : 50);
  });
const Content = defineComponent(() => {
  const feedback = useKjunFeedback();
  const s = reactive({ checked: false, toggle: false, radio: "a" as any, selected: null as any, query: "", tab: "one", message: "" });
  return () => <div style={{ padding: "24px", display: "grid", gap: "16px", maxWidth: "520px" }}>
    <KjunCard title="상태">
      <KjunBadge>배지</KjunBadge>
      <KjunProgress value={42} showLabel />
      <KjunSkeleton rows={1} />
    </KjunCard>
    <KjunCheckbox modelValue={s.checked} label="체크" onUpdate:modelValue={(v: any) => { s.checked = !!v; }} />
    <KjunSwitch modelValue={s.toggle} label="스위치" onUpdate:modelValue={(v: boolean) => { s.toggle = v; }} />
    <KjunRadioGroup modelValue={s.radio} ariaLabel="라디오"
      options={[{ value: "a", label: "A" }, { value: "b", label: "B", disabled: true }, { value: "c", label: "C" }]}
      onUpdate:modelValue={(v: any) => { s.radio = v; }} />
    <KjunSelect modelValue={s.selected} options={[{ value: "a", label: "사과" }, { value: "b", label: "배", disabled: true }, { value: "c", label: "체리" }]}
      ariaLabel="과일" clearable onUpdate:modelValue={(v: any) => { s.selected = v; }} />
    <output data-testid="selected">{s.selected}</output>
    <KjunSearchInput modelValue={s.query} ariaLabel="원격 검색" loadOptions={loadOptions} onUpdate:modelValue={(v: string) => { s.query = v; }}
      onSelect={(o: any) => { s.message = o.name; }} />
    <KjunTabs modelValue={s.tab} onUpdate:modelValue={(v: string) => { s.tab = v; }}>
      <KjunTabPane name="one" label="첫 탭">첫 내용</KjunTabPane>
      <KjunTabPane name="two" label="둘째 탭">둘째 내용</KjunTabPane>
    </KjunTabs>
    <KjunDropdown>
      {{ trigger: () => <KjunButton>메뉴 열기</KjunButton>, default: () => <KjunDropdownItem onClick={() => { s.message = "chosen"; }}>메뉴 항목</KjunDropdownItem> }}
    </KjunDropdown>
    <KjunTooltip content="도움말"><KjunButton>도움</KjunButton></KjunTooltip>
    <KjunAccordion>
      <KjunAccordionItem title="열기 하나">내용 하나</KjunAccordionItem>
      <KjunAccordionItem title="열기 둘">내용 둘</KjunAccordionItem>
    </KjunAccordion>
    <KjunButton onClick={async () => {
      const a = feedback.confirm({ title: "첫 확인" }),
        b = feedback.prompt({ title: "다음 입력", validator: (v: string) => v.length > 1 || "두 글자 이상" });
      s.message = JSON.stringify([await a, await b]);
    }}>대기열 시작</KjunButton>
    <KjunButton onClick={() => feedback.toast.success("영역 알림", { duration: 0 })}>알림 표시</KjunButton>
    <output role="status">{s.message}</output>
  </div>;
});
const app = reactive({ changed: false });
createApp(defineComponent(() => () => <KjunProvider>
  <KjunProvider style={cssValues(scopedColors(app.changed), scopedFont(app.changed))}>
    <KjunButton onClick={() => { app.changed = !app.changed; }}>영역 색상 변경</KjunButton>
    <KjunFeedbackProvider><Content /></KjunFeedbackProvider>
  </KjunProvider>
</KjunProvider>)).mount("#root");
