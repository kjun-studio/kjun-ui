import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
import { dataStateConfig, relatedProps } from './data-state-design-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const vm = new Vue({
  data: () => ({ config: { ...dataStateConfig } as any, retried: 0, emptyActions: 0, exports: 0 }),
  render(h) {
    const c = this.config;
    const retry = () => h(K.DsButton, { props: { size: 'sm', variant: 'secondary' }, on: { click: () => this.retried++ } }, c.retryText || 'Retry');
    const slots = [
      ...(c.customEmpty ? [h(K.DsEmpty, { slot: 'empty', props: { text: 'Empty title', description: 'Empty description' } }, c.emptyActionText ? [retry()] : [])] : []),
      ...(c.customError ? [h(K.DsAlert, { slot: 'error', props: { title: 'Custom error' } }, [retry()])] : []),
      ...(c.customLoading ? [h(K.DsSkeleton, { slot: 'loading', props: { type: 'block', height: '64px' } })] : []),
    ];
    const card = h(K.DsCard, { props: { title: 'Result title', surface: 'muted' } }, [
      h(K.DsButton, { slot: 'header-actions', props: { size: 'sm', variant: 'secondary' }, on: { click: () => this.exports++ } }, 'Export'),
      h('div', { attrs: { 'data-testid': 'scroll' }, style: { height: '96px', overflow: 'auto' } }, [
        h('input', { attrs: { 'aria-label': 'Retained input', value: 'original' } }),
        h('div', { style: { height: '600px' } }, 'Result body'),
      ]),
    ]);
    return h(K.KjunProvider, [h('div', { style: { padding: '24px' } }, [
      h('div', { attrs: { 'data-testid': 'region' }, style: { width: c.width + 'px' } }, [
        c.related ? h((K as any)[c.related], { props: { ...relatedProps, ...c, data: c.empty ? [] : [{ id: 'a', name: 'Result row', price: 100 }], rows: c.empty ? [] : [{ id: 'a', name: 'Result row', price: 100 }] }, on: { retry: () => this.retried++ } }) :
        h(K.DsDataState, { props: c, on: { retry: () => this.retried++, 'empty-action': () => this.emptyActions++ } }, [...slots, card]),
      ]),
      h('output', { attrs: { 'data-testid': 'events' } }, `${this.retried}/${this.emptyActions}/${this.exports}`),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureDataState: (next: object) => { vm.config = { ...vm.config, ...next }; } });
