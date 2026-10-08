import Vue from 'vue';
import * as K from '@kjun/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
import { alertConfig } from './alert-design-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const vm = new Vue({
  data: () => ({ config: { ...alertConfig } as any, closed: 0, actions: 0 }),
  render(h) {
    const c = this.config;
    const button = () => h(K.DsButton, { props: { size: 'sm', variant: 'secondary' }, on: { click: () => this.actions++ } }, 'Retry');
    const action = () => h(K.DsButton, { props: { variant: 'secondary', ...(c.actionSize ? { size: c.actionSize } : {}) }, on: { click: () => this.actions++ } }, 'Slot action');
    return h(K.KjunProvider, [h('div', { style: { padding: '24px', display: 'grid', gap: '24px', justifyItems: 'start' } }, [
      h('button', { attrs: { 'data-testid': 'before' } }, 'Before'),
      h('div', { attrs: { 'data-testid': 'alert' }, style: { width: c.width + 'px' } }, [
        h(K.DsAlert, { key: c.generation, props: { variant: c.variant, size: c.size, title: c.emptyFragment ? ' ' : String(c.title ?? ''), closable: c.closable }, on: { close: () => this.closed++ },
          scopedSlots: c.actions ? { actions: () => action() } : undefined }, c.action ? [button()] : c.emptyFragment ? [] : c.body),
      ]),
      h('div', { attrs: { 'data-testid': 'reference' } }, [button()]),
      h('output', { attrs: { 'data-testid': 'events' } }, this.closed + '/' + this.actions),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureAlert: (next: object) => { vm.config = { ...vm.config, ...next }; } });
