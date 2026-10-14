import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette, demoDomainColors, demoFont } from './typography-values';

export const displaySizes = ['xs', 'sm', 'md', 'lg', 'xl'];
export const coreSizes = ['sm', 'md', 'lg'];
export const skeletonKinds = ['text', 'avatar', 'card', 'table', 'chart', 'stat', 'block'];

export function mountSizeContracts(K: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [progress, setProgress] = useState(25), [removed, setRemoved] = useState(false), [drawer, setDrawer] = useState(false);
    const [modal, setModal] = useState(false), [selection, setSelection] = useState('a');
    const box = (id: string, child: any) => h('div', { key: id, 'data-testid': id, style: { marginBottom: 12, minWidth: 0 } }, child);
    const button = (label: string, action?: () => void) => h(K.KjunButton, { [native ? 'onPress' : 'onClick']: action }, label);
    return h('div', { style: { padding: 16, maxWidth: 900 } }, [
      ...displaySizes.map(size => box('spinner-' + size, h(K.KjunSpinner, { size, text: size }))),
      ...coreSizes.map(size => box('progress-' + size, h(K.KjunProgress, { size, value: progress, showLabel: true, label: '진행 ' + size }))),
      button('진행 변경', () => setProgress(75)),
      box('chip', !removed && h(K.KjunChip, { label: '크기 칩', icon: 'check', removable: true, onRemove: () => setRemoved(true) })),
      box('image', h(K.KjunImage, { src: '', alt: '크기 이미지' })),
      box('avatar-fallback', h(K.KjunAvatar, { name: '' })),
      box('breadcrumb', h(K.KjunBreadcrumb, { items: [{ label: '첫 위치', icon: 'home', to: '/' }, { label: '현재 위치' }] })),
      box('form-error', h(K.KjunFormGroup, { label: '오류 필드', error: '오류 메시지' }, h(K.KjunInput, { ariaLabel: '오류 입력' }))),
      box('alert', h(K.KjunAlert, { title: '크기 안내', closable: true }, '크기 설명')),
      box('selection', h(K.KjunFilterGroup, { value: selection, options: [{ value: 'a', label: '선택 A', dot: '#246' }, { value: 'b', label: '선택 B', icon: 'check' }], onChange: setSelection, onValueChange: setSelection })),
      ...skeletonKinds.map(type => box('skeleton-' + type, h(K.KjunSkeleton, { type, rows: 1, columns: 1, animated: false }))),
      box('list-skeleton', h(K.KjunListSkeleton, { rows: 1 })),
      box('form-skeleton', h(K.KjunFormSkeleton, { fields: [''], multiline: true })),
      box('chart-skeleton', h(K.KjunChartSkeleton, { kind: 'donut' })),
      box('price', h(K.KjunPriceCell, { value: null })),
      box('signed', h(K.KjunSignedValue, { value: 1, loading: true })),
      box('sparkline', h(K.KjunSparkline, { data: [1, 3, 2] })),
      box('progress-cell', h(K.KjunProgressCell, { value: 30, showLabel: true })),
      box('market-card', h(K.KjunMarketCards, { rows: [{ id: 'one', name: '가격 대기', current_price: null }], columns: [{ key: 'current_price', label: '가격' }], metricConfig: { current_price: { label: '가격', format: 'price' } }, storageNamespace: 'size-contracts', showFooter: false })),
      box('market-skeleton', h(K.KjunMarketTableSkeleton, { rows: 1, showActions: true, columns: [{ key: 'price', label: '가격' }] })),
      box('kpi-hero', h(K.KjunKpiHero, { label: '로딩 요약', value: 10, deltaAbsolute: 1, loading: true, secondary: [{ label: '보조 값', value: 2, desc: '보조 설명' }] })),
      box('kpi-row', h(K.KjunKpiRow, { loading: true, items: [{ value: 10, desc: '설명' }, { value: 2, valueSegments: [{ text: '값' }] }] })),
      box('kpi-dot', h(K.KjunKpiRow, { items: [{ label: '점 규격', value: 10, badge: { text: '표식', variant: 'success' } }] })),
      box('tooltip', h(K.KjunTooltip, { content: '크기 도움말', delay: 0 }, button('크기 도움말 열기'))),
      box('menu', h(K.KjunMenuButton, { label: '크기 메뉴' }, Array.from({ length: 18 }, (_, i) => h(K.KjunDropdownItem, { key: i, icon: 'check' }, '항목 ' + i)))),
      box('select', h(K.KjunSelect, { ariaLabel: '크기 선택', value: selection, options: Array.from({ length: 18 }, (_, i) => ({ value: i ? String(i) : 'a', label: '선택 항목 ' + i })), onValueChange: setSelection })),
      button('기본 패널 열기', () => setDrawer(true)), h(K.KjunDrawer, { open: drawer, onOpenChange: setDrawer, title: '기본 크기 패널', position: 'right' }, '패널 내용'),
      button('닫기 크기 확인', () => setModal(true)), h(K.KjunModal, { open: modal, onOpenChange: setModal, title: '닫기 크기 창' }, '창 내용'),
      h('output', { 'data-testid': 'events' }, `${progress}/${removed}/${selection}`),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(K.KjunProvider, native ? { colors: palette(), domainColors: demoDomainColors, fontFamily: demoFont } : null, h(Cases)));
}
