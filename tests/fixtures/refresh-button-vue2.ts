import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
import { refreshConfig, refreshStyle } from './refresh-button-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const vm = new Vue({
  data: () => ({ config: { ...refreshConfig, loading: location.search.includes('loading') } as any, events: 0 }),
  render(h) {
    const box = (id: string, node: any) => h('div', { attrs: { 'data-testid': id }, style: { width: this.config.block ? '300px' : undefined } }, [node]);
    const refresh = (mode: string) => h(K.DsRefreshButton, { props: { ...this.config, mode, targetName: '목록' }, on: { refresh: () => this.events++ } });
    return h(K.KjunProvider, [h('div', { style: refreshStyle }, [
      box('icon', refresh('icon')), box('text', refresh('text')),
      box('reference', h(K.DsButton, { props: { ...this.config, prefixIcon: 'refresh' } }, '새로고침')),
      h('button', { attrs: { 'data-testid': 'outside' } }, '바깥 버튼'),
      h('output', { attrs: { 'data-testid': 'events' } }, String(this.events)),
      h('output', { attrs: { 'data-testid': 'config', hidden: true } }, JSON.stringify(this.config)),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureRefresh: (next: object) => { vm.config = { ...vm.config, ...next }; } });
