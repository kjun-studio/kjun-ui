import Vue from 'vue';
import { KjunProvider, DsTabs, DsTabPane, DsButton } from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
new Vue({
  data: () => ({ value: 'one', tabs: [
    { name: 'one', label: '첫 탭', disabled: false }, { name: 'blocked', label: '비활성 탭', disabled: true },
    { name: 'two', label: '둘째 탭', disabled: false }, { name: 'three', label: '마지막 탭', disabled: false },
  ], refuse: false, itemsOnly: false, interactive: false, events: [] as string[] }),
  mounted() { (window as any).configureTabs = (patch: any) => Object.assign(this, patch); },
  render(h) {
    const group = (secondary = false) => h(DsTabs, {
      props: { value: secondary ? 'one' : this.value, ariaLabel: secondary ? '두 번째 목록' : '탭 검사', items: this.itemsOnly ? this.tabs : [] },
      on: { input: (value: string) => { if (secondary) return; this.events.push(value); if (!this.refuse) this.value = value; } },
    }, this.itemsOnly ? [] : this.tabs.map(tab => h(DsTabPane, { key: tab.name, props: tab }, [
      this.interactive ? h(DsButton, '패널 행동') : '내용 ' + tab.name,
    ])));
    return h(KjunProvider, [
      h('button', { attrs: { id: 'before' } }, '앞'), h('div', { style: { maxWidth: '260px' }, attrs: { 'data-testid': 'primary' } }, [group()]),
      h('button', { attrs: { id: 'after' } }, '뒤'), h('div', { attrs: { 'data-testid': 'secondary' } }, [group(true)]),
      h('output', { attrs: { 'data-testid': 'events' } }, JSON.stringify(this.events)), h('output', { attrs: { 'data-testid': 'value' } }, this.value),
    ]);
  },
}).$mount('#root');
