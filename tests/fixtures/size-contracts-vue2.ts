import Vue from 'vue';
import * as K from '@kjun/vue2';
import { cssPalette } from './typography-values';
import { displaySizes, coreSizes, skeletonKinds } from './size-contracts-common';
cssPalette();
const Cases = Vue.extend({
  data: () => ({ progress: 25, removed: false, drawer: false, modal: false, selection: 'a' }),
  render(h) {
    const box = (id: string, child: any) => h('div', { key: id, attrs: { 'data-testid': id }, style: { marginBottom: '12px', minWidth: 0 } }, [child]);
    const button = (label: string, action?: () => void) => h(K.DsButton, { on: { click: action } }, label);
    return h('div', { style: { padding: '16px', maxWidth: '900px' } }, [
      ...displaySizes.map(size => box('spinner-' + size, h(K.DsSpinner, { props: { size, text: size } }))),
      ...coreSizes.map(size => box('progress-' + size, h(K.DsProgress, { props: { size, value: this.progress, showLabel: true, label: '진행 ' + size } }))),
      button('진행 변경', () => this.progress = 75),
      box('chip', !this.removed && h(K.DsChip, { props: { label: '크기 칩', icon: 'check', removable: true }, on: { remove: () => this.removed = true } })),
      box('image', h(K.DsImage, { props: { src: '', alt: '크기 이미지' } })),
      box('avatar-fallback', h(K.DsAvatar, { props: { name: '' } })),
      box('breadcrumb', h(K.DsBreadcrumb, { props: { items: [{ label: '첫 위치', icon: 'home', to: '/' }, { label: '현재 위치' }] } })),
      box('form-error', h(K.DsFormGroup, { props: { label: '오류 필드', error: '오류 메시지' } }, [h(K.DsInput, { props: { ariaLabel: '오류 입력' } })])),
      box('alert', h(K.DsAlert, { props: { title: '크기 안내', closable: true } }, '크기 설명')),
      box('selection', h(K.DsFilterGroup, { props: { value: this.selection, options: [{ value: 'a', label: '선택 A', dot: '#246' }, { value: 'b', label: '선택 B', icon: 'check' }] }, on: { input: (v: string) => this.selection = v } })),
      ...skeletonKinds.map(type => box('skeleton-' + type, h(K.DsSkeleton, { props: { type, rows: 1, columns: 1, animated: false } }))),
      box('list-skeleton', h(K.DsListSkeleton, { props: { rows: 1 } })),
      box('form-skeleton', h(K.DsFormSkeleton, { props: { fields: [''], multiline: true } })),
      box('chart-skeleton', h(K.DsChartSkeleton, { props: { kind: 'donut' } })),
      box('price', h(K.DsPriceCell, { props: { value: null } })),
      box('signed', h(K.DsSignedValue, { props: { value: 1, loading: true } })),
      box('sparkline', h(K.DsSparkline, { props: { data: [1, 3, 2] } })),
      box('progress-cell', h(K.DsProgressCell, { props: { value: 30, showLabel: true } })),
      box('market-card', h(K.DsMarketCards, { props: { rows: [{ id: 'one', name: '가격 대기', current_price: null }], columns: [{ key: 'current_price', label: '가격' }], metricConfig: { current_price: { label: '가격', format: 'price' } }, storageNamespace: 'size-contracts', showFooter: false } })),
      box('market-skeleton', h(K.DsMarketTableSkeleton, { props: { rows: 1, showActions: true, columns: [{ key: 'price', label: '가격' }] } })),
      box('kpi-hero', h(K.DsKpiHero, { props: { label: '로딩 요약', value: 10, deltaAbsolute: 1, loading: true, secondary: [{ label: '보조 값', value: 2, desc: '보조 설명' }] } })),
      box('kpi-row', h(K.DsKpiRow, { props: { loading: true, items: [{ value: 10, desc: '설명' }, { value: 2, valueSegments: [{ text: '값' }] }] } })),
      box('kpi-dot', h(K.DsKpiRow, { props: { items: [{ label: '점 규격', value: 10, badge: { text: '표식', variant: 'success' } }] } })),
      box('tooltip', h(K.DsTooltip, { props: { content: '크기 도움말', delay: 0 } }, [button('크기 도움말 열기')])),
      box('menu', h(K.DsMenuButton, { props: { label: '크기 메뉴' } }, Array.from({ length: 18 }, (_, i) => h(K.DsDropdownItem, { key: i, props: { icon: 'check' } }, '항목 ' + i)))),
      box('select', h(K.DsSelect, { props: { ariaLabel: '크기 선택', value: this.selection, options: Array.from({ length: 18 }, (_, i) => ({ value: i ? String(i) : 'a', label: '선택 항목 ' + i })) }, on: { input: (v: string) => this.selection = v } })),
      button('기본 패널 열기', () => this.drawer = true), h(K.DsDrawer, { props: { value: this.drawer, title: '기본 크기 패널', position: 'right' }, on: { input: (v: boolean) => this.drawer = v } }, '패널 내용'),
      button('닫기 크기 확인', () => this.modal = true), h(K.DsModal, { props: { value: this.modal, title: '닫기 크기 창' }, on: { input: (v: boolean) => this.modal = v } }, '창 내용'),
      h('output', { attrs: { 'data-testid': 'events' } }, `${this.progress}/${this.removed}/${this.selection}`),
    ]);
  },
});
new Vue({ render: h => h(K.KjunProvider, [h(Cases)]) }).$mount('#root');
