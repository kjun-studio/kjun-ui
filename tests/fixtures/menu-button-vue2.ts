import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { applyDemoColors, menuConfig, menuChoices, fixtureStyle } from './menu-button-cases';
applyDemoColors('default');
const vm = new Vue({
  data: () => ({ config: { ...menuConfig } as any, events: [] as string[] }),
  render(h) {
    const box = (id: string, node: any) => h('div', { attrs: { 'data-testid': id } }, [node]);
    const c = this.config, iconOnly = c.compact || !c.label;
    return h(K.KjunProvider, [h('div', { style: fixtureStyle }, [
      box('menu', h(K.DsMenuButton, { props: c,
        scopedSlots: c.slotLabel ? { label: () => h('span', c.slotLabel) } : undefined,
        on: { open: () => this.events.push('open'), close: () => this.events.push('close') } }, [
        h(K.DsDropdownItem, { props: { icon: 'edit' }, on: { click: () => this.events.push('action') } }, '수정하기'),
        h(K.DsDropdownItem, { props: { disabled: true } }, '비활성 항목'),
        h(K.DsDropdownItem, { props: { icon: 'copy' } }, '복제하기'),
      ])),
      box('reference', h(K.DsButton, { props: { size: c.size, variant: c.variant || 'secondary', loading: c.loading, disabled: c.disabled,
        prefixIcon: iconOnly ? 'dots-vertical' : undefined, suffixIcon: iconOnly ? undefined : 'chevron-down' } }, iconOnly ? [] : [c.label])),
      box('group', h(K.DsButtonGroup, { props: { size: c.size, value: 'week', options: menuChoices, ariaLabel: '조회 기간' } })),
      h('button', { attrs: { 'data-testid': 'outside' } }, '바깥 버튼'),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join(',')),
      h('output', { attrs: { 'data-testid': 'config', hidden: true } }, JSON.stringify(c)),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureMenu: (next: object) => { vm.config = { ...vm.config, ...next }; } });
