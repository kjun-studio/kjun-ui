import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { eventHoliday, eventMarks } from './event-calendar-cases';
applyDemoColors('default');
document.body.style.margin = '0';
// Same sections, test ids and data as event-calendar-cases.tsx (React).
const s = reactive({ month: '2026-11', week: '2026-11-30', value: null as string | null, longPressed: '', plainMonth: '2026-11', plainValue: null as string | null,
  // An app that applies the month later, as a router or async state would.
  deferredMonth: '2026-11' });
Object.assign(window, { configureEvents: (next: { plainMonth?: string }) => { if (next.plainMonth) s.plainMonth = next.plainMonth; } });
createApp(defineComponent(() => () => <K.KjunProvider><main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', width: '390px', boxSizing: 'border-box' }}>
  <div data-testid="month"><K.KjunEventCalendar month={s.month} onUpdate:month={(v: string) => { s.month = v; }} modelValue={s.value} onSelect={(v: string) => { s.value = v; }}
    onDayLongPress={(v: string) => { s.longPressed = v; }} dayLongPressLabel="이날 약속 추가" marks={eventMarks} isHoliday={eventHoliday} /></div>
  <div data-testid="week"><K.KjunEventCalendar view="week" week={s.week} onUpdate:week={(v: string) => { s.week = v; }} modelValue={s.value} onSelect={(v: string) => { s.value = v; }}
    marks={eventMarks} isHoliday={eventHoliday} swipeable={false} /></div>
  <div data-testid="plain"><K.KjunEventCalendar month={s.plainMonth} onUpdate:month={(v: string) => { s.plainMonth = v; }} modelValue={s.plainValue}
    onUpdate:modelValue={(v: string) => { s.plainValue = v; }} /></div>
  {/* A month with no update:month listener: keys stop at the edge of the month. */}
  <div data-testid="unlistened"><K.KjunEventCalendar month="2026-11" /></div>
  <div data-testid="deferred"><K.KjunEventCalendar month={s.deferredMonth} onUpdate:month={(v: string) => { setTimeout(() => { s.deferredMonth = v; }, 50); }} /></div>
  {/* The app's today (2026-02-10, not the clock's) while February's events are still loading. */}
  <div data-testid="loading"><K.KjunEventCalendar month="2026-02" today="2026-02-10" loading /></div>
  <output data-testid="deferred-month" style={{ display: 'none' }}>{s.deferredMonth}</output>
  <output data-testid="values" style={{ display: 'none' }}>{s.month}|{s.week}|{s.value ?? ''}|{s.longPressed}</output>
</main></K.KjunProvider>)).mount('#root');
