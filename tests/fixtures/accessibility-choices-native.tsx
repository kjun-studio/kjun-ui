import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { scopedColors } from './style-values';

const options = [{ value: 'a', label: '사과' }, { value: 'b', label: '배', disabled: true }, { value: 'c', label: '체리' }, { value: 'd', label: '대추' }];
function Cases() {
  const [config, setConfig] = useState({ disabled: false, refuse: false, value: 'a', options });
  const [checked, setChecked] = useState(false), [switched, setSwitched] = useState(false), [selected, setSelected] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents(old => [...old, event]);
  // Commit synchronously so a keypress right after configure sees the new handlers (e.g. refuse), like other fixtures.
  useLayoutEffect(() => { Object.assign(window, { configureChoices: (next: object) => flushSync(() => setConfig(old => ({ ...old, ...next }))) }); }, []);
  return <K.KjunProvider colors={scopedColors(false)}>
    <K.DsCheckbox value={checked} label="알림 받기" disabled={config.disabled} onValueChange={value => { setChecked(!!value); record('checkbox:' + value); }} />
    <K.DsSwitch value={switched} label="자동 갱신" disabled={config.disabled} onValueChange={value => { setSwitched(value); record('switch:' + value); }} />
    <K.DsCheckbox value={selected} val="one" label="배열 선택" onValueChange={value => { setSelected(value as string[]); record('array:' + JSON.stringify(value)); }} />
    <button id="before-group">그룹 앞</button>
    <K.DsRadioGroup value={config.value} options={config.options} ariaLabel="과일" onValueChange={value => {
      record('radio:' + value); if (!config.refuse) setConfig(old => ({ ...old, value: String(value) }));
    }} />
    <button id="after-group">그룹 뒤</button>
    <K.DsRadioGroup value="one" ariaLabel="자식 라디오">
      <K.DsRadio val="one" label="자식 하나" /><K.DsRadio val="two" label="자식 둘" />
    </K.DsRadioGroup>
    <output data-testid="events">{JSON.stringify(events)}</output>
    <output data-testid="value">{config.value}</output>
  </K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<Cases />);
