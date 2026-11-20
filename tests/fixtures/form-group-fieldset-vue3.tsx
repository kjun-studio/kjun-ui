import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Mirrors form-group-fieldset-react.tsx.
const state = reactive({ days: [] as string[], error: '', rooms: [] as string[] });
const save = () => { if (!state.days.length) { state.error = '요일을 하나 이상 고르세요'; document.getElementById('weekdays')?.focus(); } };
createApp(defineComponent(() => () => <K.KjunProvider><div style={{ padding: '16px', width: '360px' }}>
  <K.KjunFormGroup as="fieldset" id="weekdays" label="반복 요일" hint="하나 이상 고르세요" error={state.error}>
    {['월', '화', '수'].map(day => <K.KjunCheckbox key={day} label={day} val={day} modelValue={state.days}
      onUpdate:modelValue={(next: any) => { state.days = next; state.error = ''; }} />)}
  </K.KjunFormGroup>
  <K.KjunFormGroup as="fieldset" id="rooms" label="기기">{{
    default: () => <K.KjunFilterGroup multiple modelValue={state.rooms} onUpdate:modelValue={(next: any) => { state.rooms = next; }}
      options={[{ value: 'light', label: '조명', disabled: true }, { value: 'plug', label: '플러그' }]} />,
    labelEnd: () => '0/2',
  }}</K.KjunFormGroup>
  <K.KjunFormGroup id="name" label="이름"><K.KjunInput modelValue="" /></K.KjunFormGroup>
  <K.KjunButton onClick={save}>저장</K.KjunButton>
</div></K.KjunProvider>)).mount('#root');
