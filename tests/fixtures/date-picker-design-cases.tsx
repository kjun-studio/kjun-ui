import { useLayoutEffect, useState } from 'react';
import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const dateColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export function setupDateColors() {
  for (const [name, value] of Object.entries(cssValues(dateColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0';
  document.body.style.background = dateColors.background;
}
// September 2026 opens on the 12th; the bounds block 1–2 September and everything after 20 October.
export const dateConfig = { min: '2026-09-03', max: '2026-10-20', clearable: true, disabled: false };
export function DatePickerCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(dateConfig);
  const [date, setDate] = useState('2026-09-12'), [range, setRange] = useState({ start: '2026-09-08', end: '2026-09-16' });
  useLayoutEffect(() => { Object.assign(window, { configureDates: (next: object) => setConfig(old => ({ ...old, ...next })) }); }, []);
  void native;
  return <main style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
    <div data-testid="date"><K.KjunDatePicker {...config} value={date} onValueChange={setDate} ariaLabel="시작일" /></div>
    <div data-testid="range"><K.KjunDateRangePicker {...config} value={range} onValueChange={setRange} ariaLabel="사용 기간" /></div>
    <output data-testid="values" style={{ display: 'none' }}>{date}|{range.start}/{range.end}</output>
  </main>;
}
