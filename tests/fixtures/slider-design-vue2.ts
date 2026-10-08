import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { setupSliderColors, sliderConfig } from './slider-design-cases';
setupSliderColors();
const vm = new Vue({
  data: () => ({ config: { ...sliderConfig }, events: [] as string[] }),
  render(h) {
    const { min, max, step, disabled, label } = this.config;
    const change = (key: 'value' | 'range', value: any) => { this.config[key] = value; this.events.push('change:' + JSON.stringify(value)); };
    const commit = (value: any) => this.events.push('commit:' + JSON.stringify(value));
    return h(K.KjunProvider, [h('div', { style: { padding: '24px', width: this.config.width + 'px', display: 'grid', gap: '24px' } }, [
      h('div', { attrs: { 'data-testid': 'single' } }, [h(K.DsSlider, { props: { min, max, step, disabled, label, ariaLabel: '음량', value: this.config.value }, on: { input: (v: number) => change('value', v), change: commit } })]),
      h('div', { attrs: { 'data-testid': 'range' } }, [h(K.DsRangeSlider, { props: { min, max, step, disabled, label: '조회 범위', value: this.config.range, thumbLabels: ['시작', '끝'] }, on: { input: (v: number[]) => change('range', v), change: commit } })]),
      h(K.DsButton, ['적용하기']),
      h(K.DsButtonGroup, { props: { value: 'all', options: [{ value: 'all', label: '전체' }, { value: 'selected', label: '선택' }] } }),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join('|')),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureSlider: (next: object) => { vm.config = { ...vm.config, ...next }; vm.events = []; } });
