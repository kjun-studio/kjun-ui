import { useLayoutEffect, useState } from 'react';
import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';

export const sliderColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const sliderConfig = { min: 0, max: 100, step: 1, disabled: false, label: '알림 음량', value: 40, range: [20, 80], width: 360 };
export function setupSliderColors() {
  for (const [key, value] of Object.entries(cssValues(sliderColors))) document.documentElement.style.setProperty(key, value);
  document.body.style.background = sliderColors.background;
}
export function SliderDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(sliderConfig);
  const [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureSlider: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  const change = (key: 'value' | 'range', value: number | number[]) => { setConfig(old => ({ ...old, [key]: value })); setEvents(old => [...old, 'change:' + JSON.stringify(value)]); };
  const commit = (value: number | number[]) => setEvents(old => [...old, 'commit:' + JSON.stringify(value)]);
  const { min, max, step, disabled, label } = config;
  return <div style={{ padding: 24, width: config.width, display: 'grid', gap: 24 }}>
    <div data-testid="single"><K.DsSlider {...{ min, max, step, disabled, label }} ariaLabel="음량" value={config.value} onValueChange={(v: number) => change('value', v)} onChangeCommit={commit} /></div>
    <div data-testid="range"><K.DsRangeSlider {...{ min, max, step, disabled }} label="조회 범위" value={config.range} thumbLabels={['시작', '끝']} onValueChange={(v: number[]) => change('range', v)} onChangeCommit={commit} /></div>
    <K.DsButton>적용하기</K.DsButton>
    <K.DsButtonGroup value="all" options={[{ value: 'all', label: '전체' }, { value: 'selected', label: '선택' }]} />
    <output data-testid="events">{events.join('|')}</output>
  </div>;
}
