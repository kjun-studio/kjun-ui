import { createApp, defineComponent, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const scenario = new URLSearchParams(location.search).get('scenario');
const InputCase = defineComponent(() => {
  const value = ref(''), prevent = ref(false), events = ref<string[]>([]);
  const log = (event: string) => { events.value.push(event); };
  Object.assign(window, { configureReview: (next: { prevent: boolean }) => { prevent.value = next.prevent; } });
  return () => <>
    <K.KjunInput modelValue={value.value} onUpdate:modelValue={(next: string) => { value.value = next; }} ariaLabel="한글 입력"
      data-prevent-enter={String(prevent.value)} onKeydown={(event: KeyboardEvent) => { if (prevent.value) event.preventDefault(); }}
      onCompositionstart={() => log('start')} onCompositionend={() => log('end')} onEnter={() => log('enter')} />
    <output data-testid="events">{JSON.stringify(events.value)}</output>
  </>;
});
const TimeCase = defineComponent(() => {
  const value = ref<string | null>('10:30:15'), error = ref('');
  Object.assign(window, { configureReview: (next: { error: string }) => { error.value = next.error; } });
  return () => <>
    <K.KjunFormGroup id="review-time" label="예약 시간" hint="영업시간 안에서 선택하세요" error={error.value}>
      <K.KjunTimePicker modelValue={value.value} precision="second" onUpdate:modelValue={(next: string | null) => { value.value = next; }} />
    </K.KjunFormGroup>
    <output data-testid="time">{value.value ?? 'none'}</output>
    <K.KjunFormGroup label="종료 시간"><K.KjunTimePicker modelValue="11:45" /></K.KjunFormGroup>
  </>;
});
const SelectCase = defineComponent(() => {
  const value = ref<any>(null);
  return () => <K.KjunFormGroup label="담당자" id="review-select" hint="담당자를 검색하세요">
    <K.KjunSelect modelValue={value.value} searchable options={[{ value: 'a', label: 'Alpha' }]} onUpdate:modelValue={(next: any) => { value.value = next; }} />
  </K.KjunFormGroup>;
});
const PromptCase = defineComponent(() => {
  const feedback = K.useKjunFeedback(), value = ref<string | null>('pending');
  return () => <>
    <K.KjunButton onClick={() => { void feedback.prompt({ title: '이름 입력' }).then(next => { value.value = next; }); }}>입력 열기</K.KjunButton>
    <output data-testid="prompt">{value.value}</output>
  </>;
});
// Nested modals with live Escape policies.
const ModalCase = defineComponent(() => {
  const config = reactive({ open: true, inner: false, escape: false, innerEscape: true });
  Object.assign(window, { configureReview: (next: Partial<typeof config>) => Object.assign(config, next) });
  return () => <K.KjunModal title="바깥 모달" open={config.open} closeOnEsc={config.escape} onUpdate:open={(open: boolean) => { config.open = open; }}>
    <K.KjunButton onClick={() => { config.inner = true; }}>안쪽 모달 열기</K.KjunButton>
    <K.KjunModal title="안쪽 모달" open={config.inner} closeOnEsc={config.innerEscape} onUpdate:open={(open: boolean) => { config.inner = open; }}>
      <K.KjunButton>안쪽 행동</K.KjunButton>
    </K.KjunModal>
  </K.KjunModal>;
});
const ComboboxCase = defineComponent(() => {
  const dynamic = location.search.includes('dynamic');
  const config = reactive({ value: (dynamic ? null : 'a') as string | null, label: 'Alpha', blocked: false, removed: false });
  const query = ref('');
  Object.assign(window, { configureReview: (next: Partial<typeof config>) => Object.assign(config, next) });
  return () => <>
    <K.KjunCombobox ariaLabel="목록 검색" modelValue={config.value}
      options={config.removed ? [] : [{ value: 'a', label: config.label, disabled: config.blocked }, { value: 'b', label: 'Beta' }]}
      onSearch={(next: string) => { query.value = next; }}
      onUpdate:modelValue={(value: any) => { config.value = value as string | null; }} />
    <output data-testid="query">{query.value}</output>
    <output data-testid="selected">{config.value ?? 'none'}</output>
  </>;
});
const cases: Record<string, any> = { input: InputCase, time: TimeCase, select: SelectCase, prompt: PromptCase, modal: ModalCase };
const Case = cases[scenario ?? ''] ?? ComboboxCase;
const app = createApp(defineComponent(() => () => <K.KjunProvider><K.KjunFeedbackProvider><Case /></K.KjunFeedbackProvider></K.KjunProvider>));
app.mount('#root');
Object.assign(window, { unmountReview: () => app.unmount() });
