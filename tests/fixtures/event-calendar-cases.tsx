import { useLayoutEffect, useState } from 'react';
// KjunEventCalendar cases for React (Vue 3 and Native mirror this). The spec pins today to 2026-11-17 with page.clock.
export const eventColors = { blue: '#3182f6', green: '#00a661', orange: '#ff8a00', pink: '#f04452', purple: '#8b5cf6', teal: '#14b8a6', gray: '#8b95a1' };
const sevenDots = Object.values(eventColors);
// 11-13 to 11-16 carry one bar across the Saturday line; 11-10 is a named holiday with one event; 11-11 has seven events and a heart.
export function eventMarks(iso: string) {
  if (iso === '2026-11-10') return { dots: [eventColors.blue], count: 1 };
  if (iso === '2026-11-11') return { dots: sevenDots, icon: { name: 'heart', color: eventColors.pink }, count: 7 };
  if (iso >= '2026-11-13' && iso <= '2026-11-16') return { spans: [{ color: eventColors.green, start: '2026-11-13', end: '2026-11-16' }], count: 1 };
  if (iso === '2026-12-01') return { dots: [eventColors.orange], count: 1 };
  return undefined;
}
export const eventHoliday = (iso: string) => iso === '2026-11-10' ? '창립기념일' : false;
export function EventCalendarCases({ K }: { K: any }) {
  const [month, setMonth] = useState('2026-11');
  const [week, setWeek] = useState('2026-11-30');
  const [value, setValue] = useState<string | null>(null);
  const [longPressed, setLongPressed] = useState('');
  const [plainMonth, setPlainMonth] = useState('2026-11');
  const [plainValue, setPlainValue] = useState<string | null>(null);
  // An app that applies the month later, as a router or async state would.
  const [deferredMonth, setDeferredMonth] = useState('2026-11');
  useLayoutEffect(() => { Object.assign(window, { configureEvents: (next: { plainMonth?: string }) => { if (next.plainMonth) setPlainMonth(next.plainMonth); } }); }, []);
  return <main style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24, width: 390, boxSizing: 'border-box' }}>
    <div data-testid="month"><K.KjunEventCalendar month={month} onMonthChange={setMonth} value={value} onSelect={setValue}
      onDayLongPress={setLongPressed} dayLongPressLabel="이날 약속 추가" marks={eventMarks} isHoliday={eventHoliday} /></div>
    <div data-testid="week"><K.KjunEventCalendar view="week" week={week} onWeekChange={setWeek} value={value} onSelect={setValue}
      marks={eventMarks} isHoliday={eventHoliday} swipeable={false} /></div>
    <div data-testid="plain"><K.KjunEventCalendar month={plainMonth} onMonthChange={setPlainMonth} value={plainValue} onSelect={setPlainValue} /></div>
    <div data-testid="deferred"><K.KjunEventCalendar month={deferredMonth} onMonthChange={(next: string) => setTimeout(() => setDeferredMonth(next), 50)} /></div>
    <output data-testid="deferred-month" style={{ display: 'none' }}>{deferredMonth}</output>
    <output data-testid="values" style={{ display: 'none' }}>{month}|{week}|{value ?? ''}|{longPressed}</output>
  </main>;
}
