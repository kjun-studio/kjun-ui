import { createApp, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { thumbColor } from './additions-cases';
applyDemoColors('default');
const date = ref('2026-10-23');
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  <div data-testid="switch-thumb">
    <div style={{ '--kjun-switch-thumb-on': thumbColor }}><K.KjunProvider><K.KjunSwitch modelValue label="Themed thumb" /></K.KjunProvider></div>
    <K.KjunProvider><K.KjunSwitch modelValue label="Default thumb" /></K.KjunProvider>
  </div>
  <K.KjunProvider><div data-testid="switch-description"><K.KjunSwitch modelValue label="Alerts" description="Sent once a day" /></div></K.KjunProvider>
  <K.KjunProvider><div data-testid="date-clear">
    <K.KjunDatePicker modelValue={date.value} clearable onUpdate:modelValue={(v: string) => { date.value = v; }} />
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="button-group">
    <K.KjunButtonGroup modelValue="a" options={[{ value: 'a', label: 'Mine' }, { value: 'b', label: 'Ours' }]} />
  </div></K.KjunProvider>
</div>).mount('#root');
