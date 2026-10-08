import Vue from 'vue';
import * as ui from '@kjun/vue2';
import { setRootValues } from './style-values';
setRootValues();
const target = new URLSearchParams(location.search).get('component') || 'DsInput';
const field = target === 'DsFormGroup' ? 'DsInput' : target;
const Broken = Vue.extend({ render(): any { throw Error('Intentional accessibility boundary fixture'); } });
new Vue({
  data: { value: field === 'DsDatePicker' ? '2026-09-12' : field === 'DsQuantityStepper' ? 2 : '', error: '', disabled: false, required: true, fieldRequired: undefined as boolean | undefined, readOnly: false, broken: true, resets: 0 },
  mounted() { Object.assign(window, { configureA11y: (next: object) => Object.assign(this, next) }); },
  render(h) {
    const self = this;
    return h(ui.KjunProvider, [target === 'DsErrorBoundary' ? h('div', [
      h(ui.DsErrorBoundary, { props: { fallbackMessage: '예제 렌더 오류' }, on: { reset: () => { self.resets++; self.broken = false; } } }, [h(Broken)]),
      h('output', { attrs: { 'data-testid': 'resets' } }, String(this.resets)),
    ]) : h('div', [
      h('button', { attrs: { 'data-testid': 'field-before' } }, '입력 앞'),
      ...[0, 1].map(index => h('div', { attrs: { 'data-field': index } }, [
        h(ui.DsFormGroup, { props: { label: `검증 필드 ${index + 1}`, hint: `도움말 ${index + 1}`, error: this.error, required: this.required } }, [
          h((ui as any)[field], { attrs: { required: this.fieldRequired }, props: { value: this.value, disabled: this.disabled, readonly: this.readOnly, required: this.fieldRequired, error: !!this.error,
            ...(field === 'DsInput' ? { errorMessage: this.error } : {}),
          }, on: { input: (value: any) => { self.value = value; } } }),
        ]),
      ])),
      h('output', { attrs: { 'data-testid': 'field-value' } }, String(this.value)),
      h('button', { attrs: { 'data-testid': 'field-after' } }, '입력 뒤'),
    ])]);
  },
}).$mount('#root');
