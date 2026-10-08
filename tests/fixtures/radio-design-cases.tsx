import { useLayoutEffect, useState } from 'react';
import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';

export const radioColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const radioConfig = { value: 'a', standalone: false, disabled: false, direction: 'horizontal', width: 300 };
export const radioOptions = [{ value: 'a', label: '사과' }, { value: 'b', label: '배', disabled: true }, { value: 'c', label: '체리' }];
export function setupRadioColors() {
  for (const [key, value] of Object.entries(cssValues(radioColors, 'Arial'))) document.documentElement.style.setProperty(key, value);
  document.body.style.background = radioColors.background;
}
export function RadioDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(radioConfig);
  const [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureRadio: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  const change = (value: string) => { setConfig(old => ({ ...old, value })); setEvents(old => [...old, 'value:' + value]); };
  const notify = (value: string) => setEvents(old => [...old, 'change:' + value]);
  return <div style={{ padding: 24, width: config.width, display: 'grid', gap: 24 }}>
    <div data-testid="group"><K.DsRadioGroup value={config.value} direction={config.direction} ariaLabel="과일"
      options={radioOptions.map(option => ({ ...option, disabled: config.disabled || option.disabled }))}
      onValueChange={change} onChange={notify} /></div>
    <div data-testid="standalone"><K.DsRadio value={config.standalone} val={true} label="개별 항목" disabled={config.disabled}
      onValueChange={(standalone: boolean) => setConfig(old => ({ ...old, standalone }))} /></div>
    <div data-testid="checkbox"><K.DsCheckbox value={false} label="체크박스" /></div>
    <output data-testid="events">{events.join('|')}</output>
  </div>;
}
