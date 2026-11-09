import { createApp, defineComponent, ref, type PropType } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { cpBadSwatches, cpSwatches } from './color-picker-cases';
applyDemoColors('default');
// Same sections and DOM as color-picker-cases.tsx (React/Native).
const Case = defineComponent({
  props: {
    caseId: { type: String, required: true }, initial: { type: String as PropType<string | null>, default: null },
    controlled: { type: Boolean, default: false }, options: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(props) {
    const value = ref<string | null>(props.initial), changes = ref<(string | null)[]>([]), commits = ref<(string | null)[]>([]);
    return () => <div data-testid={props.caseId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <K.KjunColorPicker {...(props.controlled ? { modelValue: value.value } : { defaultValue: props.initial })} {...props.options}
        {...{ 'onUpdate:modelValue': (v: string | null) => { value.value = v; changes.value = [...changes.value, v]; } }}
        onChange={(v: string | null) => { commits.value = [...commits.value, v]; }} />
      <output data-testid={props.caseId + '-changes'}>{JSON.stringify(changes.value)}</output>
      <output data-testid={props.caseId + '-commits'}>{JSON.stringify(commits.value)}</output>
      {props.controlled && <K.KjunButton variant="secondary" onClick={() => { value.value = '#FF0000'; }}>외부 변경</K.KjunButton>}
    </div>;
  },
});
const RecentCase = defineComponent(() => {
  const recent = ref<string[]>(['#111111', '#EF4444']);
  return () => <div data-testid="cp-recent" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <K.KjunColorPicker ariaLabel="최근 색" defaultValue="#3B82F6" swatches={cpSwatches} recentColors={recent.value}
      {...{ 'onUpdate:recentColors': (list: string[]) => { recent.value = list; } }} />
    <output data-testid="cp-recent-list">{JSON.stringify(recent.value)}</output>
  </div>;
});
const App = defineComponent(() => {
  const submitted = ref('');
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', width: '360px', paddingBottom: '480px' }}>
    <Case caseId="cp-full" initial="#3B82F680" options={{ ariaLabel: '라벨 색', custom: true, alpha: true, input: true, clearable: true, swatches: cpSwatches }} />
    <Case caseId="cp-swatches" initial="#22C55E" options={{ ariaLabel: '태그 색', clearable: true, swatches: cpBadSwatches }} />
    <Case caseId="cp-custom" initial={null} options={{ ariaLabel: '강조색', custom: true, input: true }} />
    <Case caseId="cp-gray" initial="#3B82F6" options={{ ariaLabel: '회색 확인', custom: true }} />
    <Case caseId="cp-controlled" initial="#3B82F6" controlled options={{ ariaLabel: '제어 색', custom: true, input: true }} />
    <Case caseId="cp-alpha-off" initial="#3B82F680" controlled options={{ ariaLabel: '알파 끔', input: true }} />
    <RecentCase />
    <Case caseId="cp-alpha-round" initial="#11223381" options={{ ariaLabel: '반올림', alpha: true, input: true }} />
    <Case caseId="cp-eyedropper" initial="#3B82F680" options={{ ariaLabel: '스포이드', eyeDropper: true, alpha: true, input: true }} />
    <div data-testid="cp-states" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <K.KjunColorPicker ariaLabel="비활성" defaultValue="#3B82F6" disabled swatches={cpSwatches} />
      <K.KjunColorPicker ariaLabel="오류" defaultValue="#3B82F6" error swatches={cpSwatches} />
      <form onSubmit={(e: Event) => { e.preventDefault(); submitted.value = String(new FormData(e.currentTarget as HTMLFormElement).get('color')); }}>
        <K.KjunColorPicker ariaLabel="읽기 전용" defaultValue="#3B82F6" readOnly name="color" swatches={cpSwatches} />
        <button type="submit">제출</button>
      </form>
      <output data-testid="cp-submitted">{submitted.value}</output>
    </div>
    <div data-testid="cp-custom-trigger"><K.KjunFormGroup label="커스텀 색">{{ default: () =>
      <K.KjunColorPicker defaultValue="#3B82F6" swatches={cpSwatches}>{{ trigger: () => <span>칩 보기</span> }}</K.KjunColorPicker> }}
    </K.KjunFormGroup></div>
    <div data-testid="cp-sizes" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {(['sm', 'md', 'lg'] as const).map(size => <K.KjunColorPicker key={size} size={size} ariaLabel={'크기 ' + size} defaultValue="#3B82F6" swatches={cpSwatches} />)}
    </div>
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
