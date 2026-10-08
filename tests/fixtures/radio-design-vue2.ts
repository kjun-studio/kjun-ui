import Vue from 'vue';
import * as K from '@kjun/vue2';
import { radioOptions, radioConfig, setupRadioColors } from './radio-design-cases';
setupRadioColors();
const vm = new Vue({
  data: () => ({ config: { ...radioConfig }, events: [] as string[] }),
  render(h) {
    return h(K.KjunProvider, [h('div', { style: { padding: '24px', width: this.config.width + 'px', display: 'grid', gap: '24px' } }, [
      h('div', { attrs: { 'data-testid': 'group' } }, [h(K.DsRadioGroup, {
        props: { value: this.config.value, direction: this.config.direction, ariaLabel: '과일', options: radioOptions.map(option => ({ ...option, disabled: this.config.disabled || option.disabled })) },
        on: { input: (value: string) => { this.config.value = value; this.events.push('value:' + value); }, change: (value: string) => this.events.push('change:' + value) },
      })]),
      h('div', { attrs: { 'data-testid': 'standalone' } }, [h(K.DsRadio, { props: { value: this.config.standalone, val: true, label: '개별 항목', disabled: this.config.disabled }, on: { input: (value: boolean) => { this.config.standalone = value; } } })]),
      h('div', { attrs: { 'data-testid': 'checkbox' } }, [h(K.DsCheckbox, { props: { value: false, label: '체크박스' } })]),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join('|')),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureRadio: (next: object) => { vm.config = { ...vm.config, ...next }; vm.events = []; } });
