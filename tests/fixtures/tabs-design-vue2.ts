import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { tabsConfig, setupTabsColors } from './tabs-design-data';
setupTabsColors();
const vm = new Vue({
  data: () => ({ config: tabsConfig(), events: [] as string[] }),
  render(h) {
    return h(K.KjunProvider, [h('main', { style: { padding: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'frame' }, style: { width: this.config.width + 'px', maxWidth: '100%' } }, [
        h(K.DsTabs, { props: { value: this.config.value, variant: this.config.variant, density: this.config.density, items: this.config.items }, on: {
          input: (value: string) => { this.events.push(value); if (this.config.accept) this.config.value = value; },
        } }, this.config.items.map(item => h(K.DsTabPane, { key: item.name, props: item }, [h('div', { attrs: { 'data-testid': 'content-' + item.name } }, '본문 ' + item.label)]))),
      ]),
      h('output', { attrs: { 'data-testid': 'value' } }, this.config.value),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join('|')),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureTabs: (next: object) => { vm.config = { ...vm.config, ...next }; vm.events = []; } });
