import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette, demoDomainColors, demoFont } from './typography-values';

export const connectionSizes = ['sm', 'md', 'lg'] as const;
export const modalSizes = ['sm', 'md', 'lg', 'xl'] as const;
export const connectionRows = [{ label: '주요 값', value: 100 }, { label: '보조 값', value: 20, mobileSecondary: true,
  valueSegments: [{ text: '10', label: '첫 조각' }, { text: '/', separator: true }, { text: '20', label: '둘째 조각' }] }];

export function mountTokenConnections(K: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [dot, setDot] = useState(true), [open, setOpen] = useState(false), [size, setSize] = useState('md');
    const [drawer, setDrawer] = useState(false), [page, setPage] = useState(1), [events, setEvents] = useState(0);
    const [values, setValues] = useState<Record<string, any>>({});
    const change = (id: string) => (value: any) => setValues(old => ({ ...old, [id]: value }));
    const box = (id: string, children: any) => h('div', { key: id, 'data-testid': id, style: { marginBottom: 16, minWidth: 0 } }, children);
    const button = (label: string, action?: () => void) => h(K.DsButton, { [native ? 'onPress' : 'onClick']: action }, label);
    return h('div', { style: { padding: 16 } }, [
      box('badge', h(K.DsBadge, { dot }, '점 있는 배지')), button('점 전환', () => setDot(value => !value)),
      box('empty', h(K.DsEmpty, { icon: 'inbox', text: '연결 빈 상태' })),
      box('tooltip', h(K.DsTooltip, { content: '연결 도움말', delay: 0 }, button('도움말 연결'))),
      box('menu', h(K.DsMenuButton, { label: '메뉴 연결' }, h(K.DsDropdownItem, null, '연결 메뉴 항목'))),
      box('alert', h(K.DsAlert, { title: '연결 안내', closable: true, onClose: () => setEvents(value => value + 1) }, '연결 설명')),
      box('actions', h(K.DsFormActions, { cancelText: '취소 연결', confirmText: '승인 연결', onConfirm: () => setEvents(value => value + 1) })),
      ...connectionSizes.flatMap(size => [
        box('input-' + size, h(K.DsInput, { size, prefixIcon: 'search', suffix: '단위', value: values['input-' + size] ?? '입력', ariaLabel: '필드 ' + size,
          ...(native ? { onChangeText: change('input-' + size) } : { onChange: (event: any) => change('input-' + size)(event.target.value) }) })),
        box('textarea-' + size, h(K.DsTextarea, { size, rows: 2, value: '여러 줄', ariaLabel: '메모 ' + size })),
        box('select-' + size, h(K.DsSelect, { size, value: 'a', options: [{ value: 'a', label: '선택된 값 ' + size }], ariaLabel: '선택 ' + size })),
        box('quantity-' + size, h(K.DsQuantityStepper, { size, value: values['quantity-' + size] ?? 2, ariaLabel: '수량 ' + size, onValueChange: change('quantity-' + size) })),
      ]),
      ...modalSizes.map(value => button('창 ' + value, () => { setSize(value); setOpen(true); })),
      h(K.DsModal, { size, open, onOpenChange: setOpen, title: '연결 창 제목', showFooter: true }, '창 본문'),
      button('연결 패널 열기', () => setDrawer(true)),
      h(K.DsDrawer, { open: drawer, onOpenChange: setDrawer, title: '연결 패널', position: 'right' }, '패널 본문'),
      box('table', h(K.DsTable, { loading: true, data: [], columns: [{ key: 'actions', label: '작업' }], responsive: 'scroll' })),
      box('pagination', h(K.DsPagination, { currentPage: page, totalPages: 3, onPageChange: setPage })),
      box('segments', h(K.DsKpiRow, { items: connectionRows, mobileSummary: true })),
      box('error', h(K.DsDataState, { error: '연결 오류 메시지' })),
      h('output', { 'data-testid': 'events', key: 'events' }, `${events}/${page}`),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(K.KjunProvider, native ? { colors: palette(), domainColors: demoDomainColors, fontFamily: demoFont } : null, h(Cases)));
}
