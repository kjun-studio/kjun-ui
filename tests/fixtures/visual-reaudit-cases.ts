import { demoPalettes } from '../../shared/demo-colors';
const query = new URLSearchParams(location.search);
export const initial = { loaded: false, selected: 'a', combo: null, menu: '', sort: '' };
export const palette = query.has('dark') ? 'dark' : 'default';
document.body.style.backgroundColor = demoPalettes[palette].surface;
document.body.style.color = demoPalettes[palette].text;
export const auditColors = query.has('roles') ? { skeleton: '#789abc', skeletonShine: '#abcdef' } : {};
export function renderAudit(h: any, state: typeof initial, set: (key: string, value: any) => void) {
  const section = (id: string, children: any) => h('Section', { id }, children);
  const button = (label: string, run: () => void) => h('KjunButton', { onClick: run }, label);
  const columns = [
    { key: 'name', label: '자산', width: query.has('fixed') ? 280 : undefined },
    { key: 'price', label: '현재가', type: 'price', align: 'right', sortable: true, width: query.has('fixed') ? 120 : query.has('css') ? '120px' : query.has('legacy') ? 'w-[96px]' : undefined },
    { key: 'change', label: '등락률', type: 'percent', align: 'right' },
  ];
  const rows = [{ id: 'a', name: '한빛테크', symbol: 'HBT', price: 1234567, change: 2.35 }, { id: 'b', name: '새봄에너지', symbol: 'SBE', price: 98400, change: -1.25 }];
  const props = { columns, showActions: !query.has('no-actions'), showFooter: false, primaryLabel: (row: any) => row.name, subMeta: (row: any) => row.symbol, priceFormatter: (v: number) => new Intl.NumberFormat('ko-KR').format(v) + '원', onSort: (key: string) => set('sort', key) };
  const options = [{ value: 'a', label: '사과' }, { value: 'b', label: '배', disabled: true }, { value: 'c', label: '체리' }];
  return [
    section('navigation', h('KjunTopNavigation', { title: query.has('identifier') ? 'https://example.com/' + 'identifier'.repeat(15) : '팀과 함께 관리하는 프로젝트의 상세 설정', description: '팀원에게 표시할 내용을 설정합니다.' }, null, { leading: button('뒤로', () => {}), actions: button('저장', () => {}) })),
    ...['sm', 'md', 'lg'].map(size => section('form-' + size, h('KjunFormSkeleton', { size, fields: ['이름'] }))),
    section('form-columns', h('KjunFormSkeleton', { columns: 2, fields: ['첫 번째 필드', '두 번째 필드'] })),
    section('form-override', h('KjunFormSkeleton', { size: 'lg', multiline: true, fields: [{ label: '사용자 지정', height: 40 }] })),
    section('form-multiline', h('KjunFormSkeleton', { multiline: true, fields: ['설명'] })),
    section('skeleton', h('KjunSkeleton', { type: 'block', height: 16, width: 100, animated: true })),
    section('empty', h('KjunEmpty', { text: '항목이 없습니다', description: '조건을 바꾸거나 새 항목을 추가하세요.', icon: 'search' }, button('추가', () => {}))),
    section('loading', h('KjunMarketTableSkeleton', { columns, showActions: props.showActions, rows: 2 })),
    section('loaded', h('KjunMarketTable', { ...props, rows, hasLoadedOnce: true })),
    section('transition', h('KjunMarketTable', { ...props, rows: state.loaded ? rows : [], loading: !state.loaded, hasLoadedOnce: state.loaded })),
    button('조회 완료', () => set('loaded', true)),
    section('select', h('KjunSelect', { value: state.selected, options, ariaLabel: '과일 선택', onValueChange: (v: string) => set('selected', v) })),
    section('combobox', h('KjunCombobox', { value: state.combo, options, ariaLabel: '과일 검색', onValueChange: (v: string) => set('combo', v) })),
    section('dropdown', h('KjunDropdown', {}, [h('KjunDropdownItem', { onClick: () => set('menu', '선택') }, '메뉴 항목'), h('KjunDropdownItem', { disabled: true }, '비활성 메뉴')], { trigger: button('메뉴 열기', () => {}) })),
    h('Output', {}, JSON.stringify(state)),
  ];
}
