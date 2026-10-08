import { demoPalettes } from '../../shared/demo-colors';
import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { cssPalette } from './typography-values';
  cssPalette();
  const colors = new URLSearchParams(location.search).get('palette') === 'dark' ? demoPalettes.dark : demoPalettes.default;
  for (const [role, value] of Object.entries(colors)) document.documentElement.style.setProperty('--kjun-' + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value);
  document.body.style.background = colors.background;
  document.body.style.color = colors.text;
const Cases = Vue.extend({
  inject: ['kjunFeedback'],
  data: () => ({ escape: true, parent: false, child: false, drawer: false, popup: false, select: false, keep: false, present: true, trigger: true, actions: 0, closes: 0 }),
  mounted() {
    Object.assign(window, { elevation: { openWindow: () => this.child = true, openParent: () => this.parent = true, closeWindow: () => this.child = false, escape: (v: boolean) => this.escape = v, acknowledge: () => { this.popup = false; this.select = false; },
      delay: () => this.keep = true, removeTrigger: () => this.trigger = false, unmount: () => this.present = false,
      reopen: () => { this.child = false; setTimeout(() => this.child = true, 30); },
      toast: (duration = 0) => (this as any).kjunFeedback.toast.info('진행 상태 알림', { duration, action: { label: '알림 행동', onClick: () => this.actions++ } }),
    } });
  },
  render(h) {
    const button = (label: string, action?: () => void) => h(K.DsButton, { props: { variant: 'secondary' }, on: { click: action || (() => {}) } }, label);
    const pop = (label: string, controlled = false) => h(K.DsPopover, { props: { ariaLabel: label + ' 내용', ...(controlled ? { value: this.popup } : {}) },
      on: controlled ? { input: (v: boolean) => { if (!v) this.closes++; if (v || !this.keep) this.popup = v; } } : {},
      scopedSlots: { trigger: () => button(label) } }, [button('새 창 열기', () => this.child = true), button('팝업 행동', () => this.actions++)]);
    return h('div', { style: { padding: '16px', display: 'grid', gap: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'flat' } }, [h(K.DsCard, { props: { title: '기본 표면', border: true } }, [button('카드 내부 행동', () => this.actions++)])]),
      h('div', { attrs: { 'data-testid': 'raised' } }, [h(K.DsCard, { props: { title: '분리된 표면', elevation: 'raised' } }, '분리된 내용')]),
      this.trigger ? pop('화면 팝업', true) : null,
      h(K.DsSelect, { props: { ariaLabel: '화면 선택', value: 'a', options: [{ value: 'a', label: '첫 옵션' }, { value: 'b', label: '둘째 옵션' }], open: this.select }, on: { 'update:open': (v: boolean) => { if (v || !this.keep) this.select = v; if (!v) this.closes++; } } }),
      h(K.DsDropdown, { scopedSlots: { trigger: () => button('화면 메뉴') } }, [h(K.DsDropdownItem, { on: { click: () => this.child = true } }, '메뉴에서 새 창')]),
      h(K.DsCombobox, { props: { ariaLabel: '화면 자동완성', value: null, options: ['자동완성 후보'] } }),
      h(K.DsSearchInput, { props: { ariaLabel: '화면 검색 제안', value: '', minChars: 0, debounce: 0, loadOptions: async () => [{ id: 'result', name: '검색 후보' }] } }),
      button('상위 창 열기', () => this.parent = true), button('패널 열기', () => this.drawer = true),
      h(K.DsTooltip, { props: { content: '짧은 도움말' } }, [button('도움말')]),
      this.present && h(K.DsModal, { props: { value: this.parent, title: '상위 창', height: '360px' }, on: { input: (v: boolean) => this.parent = v } }, [
        this.trigger && pop('상위 팝업'), button('중첩 패널', () => this.drawer = true), h(K.DsSelect, { props: { ariaLabel: '상위 선택', options: ['옵션 A', '옵션 B'] } }),
        h('div', { style: { height: '800px' } }, '긴 본문'), button('본문 마지막'),
      ]),
      this.present && h(K.DsDrawer, { props: { value: this.drawer, title: '패널', position: 'bottom' }, on: { input: (v: boolean) => this.drawer = v } }, [pop('패널 팝업')]),
      this.present && h(K.DsModal, { props: { value: this.child, title: '새 창', closeOnEsc: this.escape }, on: { input: (v: boolean) => this.child = v } }, [button('새 창 닫기', () => this.child = false), button('새 창 행동', () => this.actions++), h(K.DsTextarea, { props: { ariaLabel: '새 창 메모' } })]),
      h('output', { attrs: { 'data-testid': 'actions' } }, String(this.actions)), h('output', { attrs: { 'data-testid': 'closes' } }, String(this.closes)),
    ]);
  },
});
new Vue({ render: h => h(K.KjunProvider, [h(K.KjunFeedbackProvider, [h(Cases)])]) }).$mount('#root');
