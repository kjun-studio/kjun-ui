import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { columns, initial, rows, setup } from './icon-toggle-values';
setup();
const vm = new Vue({
  data: () => ({ config: { ...initial }, events: [] as unknown[] }),
  methods: { emit(name: string, id?: number | string) { this.events.push([name, id ?? null]); } },
  render(h) {
    const config = this.config;
    return h(K.KjunProvider, [
      h('div', { on: { click: () => this.emit('parent') } }, [h(K.DsIconToggle, {
        props: { active: config.active, activeIcon: config.activeIcon, inactiveIcon: config.inactiveIcon,
          ariaLabel: '예제 항목 관심 ' + (config.active ? '해제' : '등록'),
          loading: config.loading, disabled: config.disabled, size: config.size },
        on: { toggle: () => this.emit('toggle') },
      })]),
      h(K.DsMarketTable, {
        props: { rows, columns, hasLoadedOnce: true, showActions: true,
          favoriteKeys: new Set(config.favorite), interestKeys: new Set(config.interest),
          togglingFavorite: config.togglingFavorite, togglingInterest: config.togglingInterest },
        on: { 'toggle-favorite': (row: typeof rows[number]) => this.emit('favorite', row.id),
          'toggle-interest': (row: typeof rows[number]) => this.emit('interest', row.id),
          'row-click': (row: typeof rows[number]) => this.emit('row', row.id) },
      }),
      h('button', '다음 컨트롤'),
      h('output', { attrs: { 'data-testid': 'events' } }, JSON.stringify(this.events)),
    ]);
  },
}).$mount('#root');
Object.assign(window, {
  configureToggle: (next: object) => { vm.config = { ...vm.config, ...next }; },
  resetToggleEvents: () => { vm.events = []; }, toggleExports: Object.keys(K),
});
