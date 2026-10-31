import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { dateConfig, setupDateColors } from './date-picker-design-cases';
setupDateColors();
const s = reactive({ config: { ...dateConfig }, date: '2026-09-12', range: { start: '2026-09-08', end: '2026-09-16' } });
Object.assign(window, { configureDates: (next: object) => { s.config = { ...s.config, ...next }; } });
createApp(defineComponent(() => () => <K.KjunProvider><main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '360px' }}>
  <div data-testid="date"><K.KjunDatePicker {...s.config} modelValue={s.date} onUpdate:modelValue={(v: string) => { s.date = v; }} ariaLabel="시작일" /></div>
  <div data-testid="range"><K.KjunDateRangePicker {...s.config} modelValue={s.range} onUpdate:modelValue={(v: { start: string; end: string }) => { s.range = v; }} ariaLabel="사용 기간" /></div>
  <output data-testid="values" style={{ display: 'none' }}>{s.date}|{s.range.start}/{s.range.end}</output>
</main></K.KjunProvider>)).mount('#root');
