import Vue from 'vue';
import * as K from '@kjun/vue2';
import accessible from '@kjun/icons/icons/accessible';
import alien from '@kjun/icons/icons/alien';
import rocket from '@kjun/icons/icons/rocket';
import { setup } from './icon-toggle-values';
setup();
const Feedback = { inject: ['kjunFeedback'], render(this: any, h: any) {
  return h('button', { on: { click: () => this.kjunFeedback.toast.info('등록된 피드백 아이콘', { duration: 0 }) } }, '피드백 표시');
} };
const vm = new Vue({
  data: () => ({ changed: false, removed: false, modal: false, drawer: false }),
  render(h) {
    const icons = this.removed ? {} : { accessible, alien: this.changed ? rocket : alien, custom: alien, heart: alien, x: alien, 'info-circle': alien };
    const icon = (id: string, name: string, filled = false) => h('div', { attrs: { 'data-testid': id } }, [h(K.DsIcon, { props: { name, filled, size: '24px' } })]);
    return h('div', [
      h(K.KjunProvider, { props: { icons } }, [h(K.KjunFeedbackProvider, [
        h('div', { attrs: { 'data-testid': 'colored-node' } }, [h(K.DsIcon, { props: { name: 'accessible', size: '24px' }, attrs: { color: '#b61dd8' } })]), icon('extra', 'alien'), icon('extra-filled', 'alien', true), icon('unknown', 'missing'), icon('fallback', 'search', true),
        h('div', { attrs: { 'data-testid': 'prefix' } }, [h(K.DsButton, { props: { prefixIcon: 'alien' } }, '내부 아이콘')]),
        h(K.KjunProvider, { props: { icons: { custom: { outline: rocket.outline } } } }, [icon('nested-outline', 'custom'), icon('nested-filled', 'custom', true), icon('nested-inherit', 'alien')]),
        h('button', { on: { click: () => { this.modal = true; } } }, '모달 표시'),
        h('button', { on: { click: () => { this.drawer = true; } } }, '드로어 표시'), h(Feedback),
        h(K.DsModal, { props: { value: this.modal, title: '아이콘 모달' }, on: { input: (value: boolean) => { this.modal = value; } } }, [icon('modal-icon', 'alien')]),
        h(K.DsDrawer, { props: { value: this.drawer, title: '아이콘 드로어' }, on: { input: (value: boolean) => { this.drawer = value; } } }, [icon('drawer-icon', 'alien')]),
      ])]),
      h(K.KjunProvider, [icon('isolated', 'alien'), icon('default-heart', 'heart', true)]),
    ]);
  },
}).$mount('#root');
Object.assign(window, { updateIcons: (change: boolean, remove = false) => { vm.changed = change; vm.removed = remove; } });
