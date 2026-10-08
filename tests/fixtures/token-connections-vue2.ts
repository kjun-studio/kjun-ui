import Vue from 'vue';
import * as K from '@kjun/vue2';
import { cssPalette } from './typography-values';
import { connectionSizes, modalSizes, connectionRows } from './token-connections-common';
cssPalette();
const Cases = Vue.extend({
  data: () => ({ dot: true, open: false, size: 'md', drawer: false, page: 1, events: 0, values: {} as Record<string, any> }),
  render(h) {
    const change = (id: string) => (value: any) => this.$set(this.values, id, value);
    const box = (id: string, child: any) => h('div', { key: id, attrs: { 'data-testid': id }, style: { marginBottom: '16px', minWidth: 0 } }, [child]);
    const button = (label: string, action?: () => void) => h(K.DsButton, { on: { click: action } }, label);
    return h('div', { style: { padding: '16px' } }, [
      box('badge', h(K.DsBadge, { props: { dot: this.dot } }, '점 있는 배지')), button('점 전환', () => this.dot = !this.dot),
      box('empty', h(K.DsEmpty, { props: { icon: 'inbox', text: '연결 빈 상태' } })),
      box('tooltip', h(K.DsTooltip, { props: { content: '연결 도움말', delay: 0 } }, [button('도움말 연결')])),
      box('menu', h(K.DsMenuButton, { props: { label: '메뉴 연결' } }, [h(K.DsDropdownItem, '연결 메뉴 항목')])),
      box('alert', h(K.DsAlert, { props: { title: '연결 안내', closable: true }, on: { close: () => this.events++ } }, '연결 설명')),
      box('actions', h(K.DsFormActions, { props: { cancelText: '취소 연결', confirmText: '승인 연결' }, on: { confirm: () => this.events++ } })),
      ...connectionSizes.flatMap(size => [
        box('input-' + size, h(K.DsInput, { props: { size, prefixIcon: 'search', value: this.values['input-' + size] ?? '입력', ariaLabel: '필드 ' + size }, on: { input: change('input-' + size) } }, [h('span', { slot: 'suffix' }, '단위')])),
        box('textarea-' + size, h(K.DsTextarea, { props: { size, rows: 2, value: '여러 줄', ariaLabel: '메모 ' + size } })),
        box('select-' + size, h(K.DsSelect, { props: { size, value: 'a', options: [{ value: 'a', label: '선택된 값 ' + size }], ariaLabel: '선택 ' + size } })),
        box('quantity-' + size, h(K.DsQuantityStepper, { props: { size, value: this.values['quantity-' + size] ?? 2, ariaLabel: '수량 ' + size }, on: { input: change('quantity-' + size) } })),
      ]),
      ...modalSizes.map(size => button('창 ' + size, () => { this.size = size; this.open = true; })),
      h(K.DsModal, { props: { size: this.size, value: this.open, title: '연결 창 제목', showFooter: true }, on: { input: (value: boolean) => this.open = value } }, '창 본문'),
      button('연결 패널 열기', () => this.drawer = true),
      h(K.DsDrawer, { props: { value: this.drawer, title: '연결 패널', position: 'right' }, on: { input: (value: boolean) => this.drawer = value } }, '패널 본문'),
      box('table', h(K.DsTable, { props: { loading: true, data: [], columns: [{ key: 'actions', label: '작업' }], responsive: 'scroll' } })),
      box('pagination', h(K.DsPagination, { props: { currentPage: this.page, totalPages: 3 }, on: { change: (value: number) => this.page = value } })),
      box('segments', h(K.DsKpiRow, { props: { items: connectionRows, mobileSummary: true } })),
      box('error', h(K.DsDataState, { props: { error: '연결 오류 메시지' } })),
      h('output', { attrs: { 'data-testid': 'events' } }, `${this.events}/${this.page}`),
    ]);
  },
});
new Vue({ render: h => h(K.KjunProvider, [h(Cases)]) }).$mount('#root');
