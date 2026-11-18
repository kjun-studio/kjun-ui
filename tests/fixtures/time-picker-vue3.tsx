import { createApp, defineComponent, ref, type PropType } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { tpCases } from './time-picker-cases';
applyDemoColors('default');
// Same sections and DOM as time-picker-cases.tsx (React/Native).
const Case = defineComponent({
  props: { caseId: { type: String, required: true }, initial: { type: String as PropType<string | null>, default: null }, options: { type: Object as PropType<Record<string, unknown>>, required: true } },
  setup(props) {
    const value = ref<string | null>(props.initial), commits = ref<(string | null)[]>([]);
    return () => <div data-testid={props.caseId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <K.KjunTimePicker modelValue={value.value} {...props.options} {...{ 'onUpdate:modelValue': (v: string | null) => { value.value = v; } }}
        onChange={(v: string | null) => { commits.value = [...commits.value, v]; }} />
      <output data-testid={props.caseId + '-value'}>{value.value ?? 'none'}</output>
      <output data-testid={props.caseId + '-commits'}>{JSON.stringify(commits.value)}</output>
    </div>;
  },
});
const LabelCase = defineComponent(() => {
  const value = ref<string | null>('10:00');
  return () => <div data-testid="tp-label"><label for="tp-outside">출발 시각</label>
    <K.KjunTimePicker id="tp-outside" ariaLabel="출발" modelValue={value.value} {...{ 'onUpdate:modelValue': (v: string | null) => { value.value = v; } }} /></div>;
});
createApp(() => <K.KjunProvider><div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', width: '360px', paddingBottom: '480px' }}>
  {tpCases.map(c => <Case key={c.id} caseId={c.id} initial={c.initial} options={c.props} />)}
  <LabelCase />
</div></K.KjunProvider>).mount('#root');
