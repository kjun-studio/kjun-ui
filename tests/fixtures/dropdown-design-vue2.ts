import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { dropdownConfig, menuLabel, setDropdownColors } from './dropdown-design-cases';
setDropdownColors();
const vm = new Vue({
  data: () => ({ config: { ...dropdownConfig }, selected: 'first', events: 0 }),
  render(h) {
    const item = (label: string, value: string, props: object) => h(K.KjunDropdownItem, {
      props, on: { click: () => { this.selected = value; this.events++; } },
    }, label);
    const items = () => [
      item(menuLabel(this.config.long), 'first', { selected: this.selected === 'first', icon: 'check' }),
      item('둘째 항목', 'second', { selected: this.selected === 'second', icon: this.config.mixed ? null : 'copy' }),
      h(K.KjunDropdownDivider),
      item('비활성 항목', 'disabled', { disabled: true, icon: 'lock' }),
      item('삭제', 'delete', { variant: 'danger', icon: 'trash' }),
    ];
    const box = (id: string, child: any) => h('div', { attrs: { 'data-testid': id } }, [child]);
    return h(K.KjunProvider, [h('div', { style: { padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' } }, [
      box('plain', h(K.KjunDropdown, { props: { disabled: this.config.disabled }, scopedSlots: {
        trigger: () => h(K.KjunButton, { props: { variant: 'secondary', suffixIcon: 'chevron-down' } }, '기본 메뉴'),
      } }, items())),
      box('menu-button', h(K.KjunMenuButton, { props: { label: '작업 메뉴', disabled: this.config.disabled, loading: this.config.loading } }, items())),
      box('button', h(K.KjunButton, { props: { variant: 'secondary' } }, '일반 버튼')),
      h(K.KjunButtonGroup, { props: { value: 'first', options: [{ value: 'first', label: '첫 항목' }, { value: 'second', label: '둘째 항목' }] } }),
      h('output', { attrs: { 'data-testid': 'events' } }, String(this.events)),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureDropdown: (next: object) => {
  vm.config = { ...vm.config, ...next };
  setDropdownColors(vm.config.dark);
} });
