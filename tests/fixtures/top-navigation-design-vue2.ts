import Vue from 'vue';
import * as K from '@kjun/vue2';
import { topNavigationConfig, setupTopNavigationColors } from './top-navigation-design-data';
setupTopNavigationColors();
const vm = new Vue({
  data: () => ({ config: { ...topNavigationConfig }, events: [] as string[] }),
  render(h) {
    return h(K.KjunProvider, [h('main', { style: { padding: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'header' } }, [h(K.DsTopNavigation, { props: { title: this.config.title, description: this.config.description, safeAreaTop: this.config.safeAreaTop } }, [
        ...(this.config.leading ? [h(K.DsButton, { slot: 'leading', props: { variant: 'ghost', size: 'sm', prefixIcon: 'arrow-left', ariaLabel: this.config.leadingText || '뒤로 가기', disabled: this.config.disabled }, on: { click: () => this.events.push('back') } }, this.config.leadingText)] : []),
        ...(this.config.actions ? this.config.mixed ? [
          h(K.DsRefreshButton, { slot: 'actions', props: { disabled: this.config.disabled, loading: this.config.loading }, on: { refresh: () => this.events.push('refresh') } }),
          h(K.DsMenuButton, { slot: 'actions', props: { compact: true, variant: 'ghost', ariaLabel: '더 보기', disabled: this.config.disabled, loading: this.config.loading } }, [h(K.DsDropdownItem, { on: { click: () => this.events.push('menu') } }, '세부 정보')]),
          h(K.DsIconToggle, { slot: 'actions', props: { activeIcon: 'heart', ariaLabel: '즐겨찾기', active: this.config.active, disabled: this.config.disabled, loading: this.config.loading }, on: { toggle: () => { this.config.active = !this.config.active; this.events.push('toggle'); } } }),
        ] : [h(K.DsButton, { slot: 'actions', props: { variant: this.config.variant, size: 'sm', disabled: this.config.disabled, loading: this.config.loading }, on: { click: () => this.events.push('save') } }, this.config.actionText), ...(this.config.multiple ? [h(K.DsButton, { slot: 'actions', props: { variant: 'ghost', size: 'sm' }, on: { click: () => this.events.push('cancel') } }, '취소')] : [])] : []),
      ])]),
      h('div', { attrs: { 'data-testid': 'outside' } }, [h(K.DsButton, { props: { variant: 'ghost', size: 'sm', prefixIcon: 'arrow-left', ariaLabel: '일반 버튼' } }), h(K.DsIconToggle, { props: { activeIcon: 'heart', ariaLabel: '일반 즐겨찾기' } })]),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join('|')),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureTopNavigation: (next: object) => { vm.config = { ...vm.config, ...next }; vm.events = []; } });
