import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');

// An app that already uses names KJUN once shared: instance helpers, a global toast and provide keys.
const record = window as unknown as { warnings: string[]; errors: string[]; appToast: string[]; boundary: string[] };
record.warnings = []; record.errors = []; record.appToast = []; record.boundary = [];
Vue.config.warnHandler = message => { record.warnings.push(message); };
Vue.config.errorHandler = error => { record.errors.push(String((error as Error).message)); };
const proto = Vue.prototype as Record<string, unknown>;
for (const name of ['Number', 'Percent', 'Date', 'RelativeTime', 'Price', 'KRW', 'BigKRW', 'Compact']) proto['$format' + name] = () => 'APP';
proto.$toast = { success: () => record.appToast.push('success'), error: () => record.appToast.push('error'), info: () => record.appToast.push('info') };

const AppScope = {
  provide: {
    dropdown: { app: true }, radioGroup: { app: true, value: 'b', name: 'app' }, tabsContainer: { app: true },
    accordion: { app: true }, dsFormGroup: { app: true, inputId: 'app-input', hintId: 'app-hint', errorId: 'app-error' },
  },
  render(this: Vue, h: Vue.CreateElement) { return h('div', this.$slots.default); },
};
const Thrower = { render() { throw new Error('child failed'); } };

const subtree = (h: Vue.CreateElement) => [
  h(K.KjunSignedValue, { props: { value: 0.12 } }),
  h(K.KjunAnimatedNumber, { props: { value: 1234, animated: false } }),
  h(K.KjunRadio, { props: { value: 'a', val: 'a', label: '라디오' } }),
  h(K.KjunInput, { props: { value: '값', ariaLabel: '입력' } }),
];

new Vue({
  render(h) {
    return h(K.KjunProvider, [h(K.KjunFeedbackProvider, [
      h('div', { attrs: { 'data-testid': 'reference' } }, subtree(h)),
      h(AppScope, [h('div', { attrs: { 'data-testid': 'app-scope' } }, subtree(h))]),
      h('div', { attrs: { 'data-testid': 'copy' } }, [h(K.KjunCopyButton, { props: { value: '복사할 값' } })]),
      h('div', { attrs: { 'data-testid': 'boundary' } }, [
        h(K.KjunErrorBoundary, { on: { error: (error: Error) => record.boundary.push(error.message) } }, [h(Thrower)]),
      ]),
    ])]);
  },
}).$mount('#root');
