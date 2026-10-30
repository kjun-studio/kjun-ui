import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setupSliderColors, sliderConfig } from './slider-design-cases';
setupSliderColors();
const state = reactive({ config: { ...sliderConfig } as any, events: [] as string[] });
Object.assign(window, { configureSlider: (next: object) => { state.config = { ...state.config, ...next }; state.events = []; } });
createApp(defineComponent(() => () => {
  const { min, max, step, disabled, label } = state.config;
  const change = (key: 'value' | 'range', value: any) => { state.config[key] = value; state.events.push('change:' + JSON.stringify(value)); };
  const commit = (value: any) => state.events.push('commit:' + JSON.stringify(value));
  return <K.KjunProvider>{{ default: () => (
    <div style={{ padding: '24px', width: state.config.width + 'px', display: 'grid', gap: '24px' }}>
      <div data-testid="single"><K.KjunSlider min={min} max={max} step={step} disabled={disabled} label={label} showValue={state.config.showValue} formatValue={state.config.format ? (v: number) => v + '%' : undefined} ariaLabel="음량" modelValue={state.config.value}
        onUpdate:modelValue={(v: any) => change('value', v)} onChange={commit} /></div>
      <div data-testid="range"><K.KjunRangeSlider min={min} max={max} step={step} disabled={disabled} label="조회 범위" showValue={state.config.showValue} formatValue={state.config.format ? (v: number) => '$' + v : undefined} modelValue={state.config.range} thumbLabels={['시작', '끝']}
        onUpdate:modelValue={(v: any) => change('range', v)} onChange={commit} /></div>
      <K.KjunButton>적용하기</K.KjunButton>
      <K.KjunButtonGroup modelValue="all" options={[{ value: 'all', label: '전체' }, { value: 'selected', label: '선택' }]} />
      <output data-testid="events">{state.events.join('|')}</output>
    </div>
  ) }}</K.KjunProvider>;
})).mount('#root');
