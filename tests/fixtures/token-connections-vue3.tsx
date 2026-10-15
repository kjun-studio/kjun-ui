import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
// Same constants as token-connections-common.tsx, which imports React.
const connectionSizes = ['sm', 'md', 'lg'] as const;
const modalSizes = ['sm', 'md', 'lg', 'xl'] as const;
const connectionRows = [{ label: '주요 값', value: 100 }, { label: '보조 값', value: 20, mobileSecondary: true,
  valueSegments: [{ text: '10', label: '첫 조각' }, { text: '/', separator: true }, { text: '20', label: '둘째 조각' }] }];
const Cases = defineComponent(() => {
  const state = reactive({ dot: true, open: false, size: 'md' as any, drawer: false, page: 1, events: 0, values: {} as Record<string, any> });
  const change = (id: string) => (value: any) => { state.values[id] = value; };
  const box = (id: string, child: any) => <div key={id} data-testid={id} style={{ marginBottom: '16px', minWidth: 0 }}>{child}</div>;
  const button = (label: string, action?: () => void) => <K.KjunButton onClick={action}>{label}</K.KjunButton>;
  return () => <div style={{ padding: '16px' }}>
    {box('badge', <K.KjunBadge dot={state.dot}>점 있는 배지</K.KjunBadge>)}{button('점 전환', () => { state.dot = !state.dot; })}
    {box('empty', <K.KjunEmpty icon="inbox" text="연결 빈 상태" />)}
    {box('tooltip', <K.KjunTooltip content="연결 도움말" delay={0}>{button('도움말 연결')}</K.KjunTooltip>)}
    {box('menu', <K.KjunMenuButton label="메뉴 연결"><K.KjunDropdownItem>연결 메뉴 항목</K.KjunDropdownItem></K.KjunMenuButton>)}
    {box('alert', <K.KjunAlert title="연결 안내" closable onClose={() => { state.events++; }}>연결 설명</K.KjunAlert>)}
    {box('actions', <K.KjunFormActions cancelText="취소 연결" confirmText="승인 연결" onConfirm={() => { state.events++; }} />)}
    {connectionSizes.flatMap(size => [
      box('input-' + size, <K.KjunInput size={size} prefixIcon="search" suffix="단위" modelValue={state.values['input-' + size] ?? '입력'} ariaLabel={'필드 ' + size}
        onUpdate:modelValue={change('input-' + size)} />),
      box('textarea-' + size, <K.KjunTextarea size={size} rows={2} modelValue="여러 줄" ariaLabel={'메모 ' + size} />),
      box('select-' + size, <K.KjunSelect size={size} modelValue="a" options={[{ value: 'a', label: '선택된 값 ' + size }]} ariaLabel={'선택 ' + size} />),
      box('quantity-' + size, <K.KjunQuantityStepper size={size} modelValue={state.values['quantity-' + size] ?? 2} ariaLabel={'수량 ' + size}
        onUpdate:modelValue={change('quantity-' + size)} />),
    ])}
    {modalSizes.map(size => button('창 ' + size, () => { state.size = size; state.open = true; }))}
    <K.KjunModal size={state.size} open={state.open} onUpdate:open={(open: boolean) => { state.open = open; }} title="연결 창 제목" showFooter>창 본문</K.KjunModal>
    {button('연결 패널 열기', () => { state.drawer = true; })}
    <K.KjunDrawer open={state.drawer} onUpdate:open={(open: boolean) => { state.drawer = open; }} title="연결 패널" position="right">패널 본문</K.KjunDrawer>
    {box('table', <K.KjunTable loading data={[]} columns={[{ key: 'actions', label: '작업' }]} responsive="scroll" />)}
    {box('pagination', <K.KjunPagination currentPage={state.page} totalPages={3} onUpdate:page={(page: number) => { state.page = page; }} />)}
    {box('segments', <K.KjunKpiRow items={connectionRows} mobileSummary />)}
    {box('error', <K.KjunDataState error="연결 오류 메시지" />)}
    <output data-testid="events">{`${state.events}/${state.page}`}</output>
  </div>;
});
createApp(defineComponent(() => () => <K.KjunProvider><Cases /></K.KjunProvider>)).mount('#root');
