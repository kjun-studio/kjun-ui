import Vue from 'vue';
import { KjunProvider, DsTabs, DsTabPane, DsButton, DsInput } from '@kjun/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const lifecycle = { mounts: 0, unmounts: 0 };
(window as any).tabLifecycle = lifecycle;
const Editor = Vue.extend({
  props: ['name'], data: () => ({ value: 'initial', count: 0 }),
  mounted() { lifecycle.mounts++; }, beforeDestroy() { lifecycle.unmounts++; },
  render(h) { return h('div', [
    h(DsInput, { props: { value: this.value, ariaLabel: this.name + ' 초안' }, on: { input: (value: string) => { this.value = value; } } }),
    h(DsButton, { on: { click: () => { this.count++; } } }, this.name + ' 카운터 ' + this.count),
  ]); },
});
new Vue({
  data: () => ({ value: 'one', firstDisabled: false, removeFirst: false, shown: true, menu: true, menus: [] as string[] }),
  mounted() { (window as any).configureTabContract = (patch: any) => Object.assign(this, patch); },
  render(h) { return h(KjunProvider, [
    h('button', { attrs: { id: 'before' } }, '앞'),
    h('div', { attrs: { 'data-testid': 'tabs', 'data-menu': String(this.menu) } }, [this.shown && h(DsTabs, {
      props: { value: this.value }, on: { input: (value: string) => { this.value = value; },
        ...(this.menu ? { 'tab-menu': (event: { name: string }) => this.menus.push(event.name) } : {}) },
    }, [
      !this.removeFirst && h(DsTabPane, { key: 'one', props: { name: 'one', label: '첫 탭', disabled: this.firstDisabled } }, [h(Editor, { props: { name: '첫' } })]),
      h(DsTabPane, { key: 'two', props: { name: 'two', label: '둘째 탭' } }, [h(Editor, { props: { name: '둘째' } })]),
      h(DsTabPane, { key: 'blocked', props: { name: 'blocked', label: '비활성 탭', disabled: true } }, ['비활성 내용']),
    ])]),
    h('button', { attrs: { id: 'after' } }, '뒤'), h('output', { attrs: { 'data-testid': 'menus' } }, JSON.stringify(this.menus)),
  ]); },
}).$mount('#root');
