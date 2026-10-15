import { createApp, defineComponent, reactive } from 'vue';
import * as ui from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
// Deliberately assembled by a consumer, with no package source imports.
const target = new URLSearchParams(location.search).get('component') || 'KjunInput';
const field = target === 'KjunFormGroup' ? 'KjunInput' : target;
const s = reactive({ value: (field === 'KjunDatePicker' ? '2026-09-12' : field === 'KjunQuantityStepper' ? 2 : '') as any, error: '', disabled: false, required: true,
  fieldRequired: undefined as boolean | undefined, readOnly: false, broken: true, resets: 0 });
Object.assign(window, { configureA11y: (next: object) => Object.assign(s, next) });
const Broken = defineComponent(() => () => { if (s.broken) throw Error('Intentional accessibility boundary fixture'); return '복구 완료'; });
const Field: any = (ui as any)[field];
createApp(defineComponent(() => () => <ui.KjunProvider>
  {target === 'KjunErrorBoundary' ? <div>
    <ui.KjunErrorBoundary fallbackMessage="예제 렌더 오류" onReset={() => { s.resets++; s.broken = false; }}><Broken /></ui.KjunErrorBoundary>
    <output data-testid="resets">{s.resets}</output>
  </div> : <div>
    <button data-testid="field-before">입력 앞</button>
    {[0, 1].map(index => <div key={index} data-field={index}>
      <ui.KjunFormGroup label={`검증 필드 ${index + 1}`} hint={`도움말 ${index + 1}`} error={s.error} required={s.required}>
        <Field modelValue={s.value} onUpdate:modelValue={(value: any) => { s.value = value; }} disabled={s.disabled} required={s.fieldRequired}
          readOnly={s.readOnly} error={!!s.error} {...(field === 'KjunInput' ? { errorMessage: s.error } : {})} />
      </ui.KjunFormGroup>
    </div>)}
    <output data-testid="field-value">{String(s.value)}</output>
    <button data-testid="field-after">입력 뒤</button>
  </div>}
</ui.KjunProvider>)).mount('#root');
