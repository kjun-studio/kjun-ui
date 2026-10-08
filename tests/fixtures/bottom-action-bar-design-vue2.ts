import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { actionBarConfig, setupActionBarColors } from './bottom-action-bar-design-data';
setupActionBarColors();
const vm = new Vue({
  data: () => ({ config: { ...actionBarConfig }, events: [] as string[] }),
  render(h) {
    const c = this.config;
    const buttons = c.direct ? [
      ...(c.showCancel ? [h(K.DsButton, { props: { size: 'lg', variant: 'ghost', disabled: c.disabled }, on: { click: () => this.events.push('cancel') } }, '취소')] : []),
      ...(c.showConfirm ? [h(K.DsButton, { props: { size: 'lg', variant: c.variant, disabled: c.disabled, loading: c.loading }, on: { click: () => this.events.push('save') } }, '변경 사항 저장')] : []),
    ] : [h(K.DsFormActions, { props: { confirmText: '변경 사항 저장', variant: c.variant, showCancel: c.showCancel, showConfirm: c.showConfirm, loading: c.loading, confirmDisabled: c.disabled, cancelDisabled: c.disabled }, on: { confirm: () => this.events.push('save'), cancel: () => this.events.push('cancel') } })];
    return h(K.KjunProvider, [h('main', { style: { padding: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'bar' }, style: { width: c.width + 'px', maxWidth: '100%' } }, [h(K.DsBottomActionBar, { props: { description: c.description, safeAreaBottom: c.safeAreaBottom, keyboardVisible: c.keyboardVisible, hideOnKeyboard: c.hideOnKeyboard } }, buttons)]),
      h('div', { attrs: { 'data-testid': 'outside' }, style: { width: '320px' } }, [h(K.DsFormActions, { props: { confirmText: '일반 저장' } })]),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join('|')),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureActionBar: async (next: object) => { vm.config = { ...vm.config, ...next }; vm.events = []; await Vue.nextTick(); } });
