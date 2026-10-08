import Vue from 'vue';
import * as K from '@kjun/vue2';
import { navigationConfig, navigationItems, setupNavigationColors } from './bottom-navigation-design-data';
setupNavigationColors();
const vm = new Vue({
  data: () => ({ config: { ...navigationConfig }, events: [] as string[] }),
  render(h) {
    return h(K.KjunProvider, [h('main', { style: { padding: '16px' } }, [
      h(K.DsBottomNavigation, { props: { ...this.config, items: navigationItems(this.config) }, on: { navigate: (key: string, event: MouseEvent) => {
        event.preventDefault(); this.events.push(key); if (this.config.acceptNavigation) this.config.value = key;
      } } }),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join('|')),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureNavigation: (next: object) => { vm.config = { ...vm.config, ...next }; vm.events = []; } });
