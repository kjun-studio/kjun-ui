import { createApp, defineComponent, reactive } from "vue";
import * as K from "@kjun-ui/vue3";
import { applyDemoColors } from "../../shared/demo-colors";
applyDemoColors("default");
const options = [
  { value: "a", label: "사과" },
  { value: "b", label: "배", disabled: true },
  { value: "c", label: "체리" },
];
const state = reactive({ selected: null as any, combo: null as any, radio: "a" as any, disabled: false, clicks: 0, modal: false });
const sample = (id: string, node: any) => <div data-testid={id}>{node}</div>;
// Vue 3 has no Provider-level formatters (like React); the per-component formatter prop is the override.
createApp(defineComponent(() => () => <div>
  <button data-testid="outside">앱 버튼</button>
  <K.KjunProvider>
    <K.KjunButton data-testid="primary">기본 버튼</K.KjunButton>
    <K.KjunButton variant="secondary" data-testid="secondary">보조 버튼</K.KjunButton>
    {sample("card", <K.KjunCard title="카드 제목" subtitle="카드 설명" border elevation="raised">본문</K.KjunCard>)}
    {sample("refresh", <K.KjunIcon name="refresh" size="28" aria-label="새로고침 아이콘" onClick={() => { state.clicks++; }} />)}
    {sample("icon-clicks", String(state.clicks))}
    {sample("filled", <K.KjunIcon name="heart" filled />)}
    {sample("ratio", <K.KjunSignedValue value={0.0235} format="percent" />)}
    {sample("raw", <K.KjunSignedValue value={2.35} format="percent" isRaw tone="pill" />)}
    {sample("deviation", <K.KjunDeviation value={-1.25} />)}
    {sample("override", <K.KjunSignedValue value={2.35} format="percent" formatter={() => "셀 포맷"} />)}
    {sample("select", <K.KjunSelect modelValue={state.selected} options={options} ariaLabel="목록 선택" onUpdate:modelValue={(value: any) => { state.selected = value; }} />)}
    {sample("combo", <K.KjunCombobox modelValue={state.combo} options={options} disabled={state.disabled} ariaLabel="목록 검색" onUpdate:modelValue={(value: any) => { state.combo = value; }} />)}
    {sample("combo-value", String(state.combo))}
    {/* Vue 3 (like React) has no group-level disabled; each Radio takes it. */}
    <K.KjunRadioGroup modelValue={state.radio} onUpdate:modelValue={(value: any) => { state.radio = value; }}>
      {options.map(option => <K.KjunRadio key={option.value} val={option.value} label={"라디오 " + option.label} disabled={option.disabled || state.disabled} />)}
    </K.KjunRadioGroup>
    <K.KjunButton onClick={() => { state.disabled = !state.disabled; }}>비활성 전환</K.KjunButton>
    <K.KjunAlert closable title="상태 안내">알림 본문</K.KjunAlert>
    <K.KjunButton onClick={() => { state.modal = true; }}>중첩 선택 열기</K.KjunButton>
    <K.KjunModal open={state.modal} title="선택 대화상자" onUpdate:open={(open: boolean) => { state.modal = open; }}>
      <K.KjunSelect options={options} searchable ariaLabel="모달 선택" />
      <K.KjunCombobox options={options} ariaLabel="모달 검색" />
    </K.KjunModal>
  </K.KjunProvider>
</div>)).mount("#root");
