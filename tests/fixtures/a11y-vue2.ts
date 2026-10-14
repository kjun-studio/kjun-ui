import Vue from 'vue';
import * as ui from '@kjun-ui/vue2';
import { setRootValues } from './style-values';
setRootValues();
const target = new URLSearchParams(location.search).get('component') || 'KjunInput';
const field = target === 'KjunFormGroup' ? 'KjunInput' : target;
const Broken = Vue.extend({ render(): any { throw Error('Intentional accessibility boundary fixture'); } });
new Vue({
  data: { value: field === 'KjunDatePicker' ? '2026-09-12' : field === 'KjunQuantityStepper' ? 2 : '', error: '', disabled: false, required: true, fieldRequired: undefined as boolean | undefined, readOnly: false, broken: true, resets: 0 },
  mounted() { Object.assign(window, { configureA11y: (next: object) => Object.assign(this, next) }); },
  render(h) {
    const self = this;
    return h(ui.KjunProvider, [target === 'KjunErrorBoundary' ? h('div', [
      h(ui.KjunErrorBoundary, { props: { fallbackMessage: '예제 렌더 오류' }, on: { reset: () => { self.resets++; self.broken = false; } } }, [h(Broken)]),
      h('output', { attrs: { 'data-testid': 'resets' } }, String(this.resets)),
    ]) : h('div', [
      h('button', { attrs: { 'data-testid': 'field-before' } }, '입력 앞'),
      ...[0, 1].map(index => h('div', { attrs: { 'data-field': index } }, [
        h(ui.KjunFormGroup, { props: { label: `검증 필드 ${index + 1}`, hint: `도움말 ${index + 1}`, error: this.error, required: this.required } }, [
          h((ui as any)[field], { attrs: { required: this.fieldRequired }, props: { value: this.value, disabled: this.disabled, readonly: this.readOnly, required: this.fieldRequired, error: !!this.error,
            ...(field === 'KjunInput' ? { errorMessage: this.error } : {}),
          }, on: { input: (value: any) => { self.value = value; } } }),
        ]),
      ])),
      h('output', { attrs: { 'data-testid': 'field-value' } }, String(this.value)),
      h('button', { attrs: { 'data-testid': 'field-after' } }, '입력 뒤'),
    ])]);
  },
}).$mount('#root');
