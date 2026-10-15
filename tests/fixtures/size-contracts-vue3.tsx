import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
// Same lists as size-contracts-common.tsx, which imports React.
const displaySizes = ['xs', 'sm', 'md', 'lg', 'xl'] as any[];
const coreSizes = ['sm', 'md', 'lg'] as any[];
const skeletonKinds = ['text', 'avatar', 'card', 'table', 'chart', 'stat', 'block'] as any[];
const Cases = defineComponent(() => {
  const state = reactive({ progress: 25, removed: false, drawer: false, modal: false, selection: 'a' });
  const box = (id: string, child: any) => <div key={id} data-testid={id} style={{ marginBottom: '12px', minWidth: 0 }}>{child}</div>;
  const button = (label: string, action?: () => void) => <K.KjunButton onClick={action}>{label}</K.KjunButton>;
  const select = (value: any) => { state.selection = value; };
  return () => <div style={{ padding: '16px', maxWidth: '900px' }}>
    {displaySizes.map(size => box('spinner-' + size, <K.KjunSpinner size={size} text={size} />))}
    {coreSizes.map(size => box('progress-' + size, <K.KjunProgress size={size} value={state.progress} showLabel label={'진행 ' + size} />))}
    {button('진행 변경', () => { state.progress = 75; })}
    {box('chip', !state.removed && <K.KjunChip label="크기 칩" icon="check" removable onRemove={() => { state.removed = true; }} />)}
    {box('image', <K.KjunImage src="" alt="크기 이미지" />)}
    {box('avatar-fallback', <K.KjunAvatar name="" />)}
    {box('breadcrumb', <K.KjunBreadcrumb items={[{ label: '첫 위치', icon: 'home', to: '/' }, { label: '현재 위치' }]} />)}
    {box('form-error', <K.KjunFormGroup label="오류 필드" error="오류 메시지"><K.KjunInput ariaLabel="오류 입력" /></K.KjunFormGroup>)}
    {box('alert', <K.KjunAlert title="크기 안내" closable>크기 설명</K.KjunAlert>)}
    {box('selection', <K.KjunFilterGroup modelValue={state.selection} options={[{ value: 'a', label: '선택 A', dot: '#246' }, { value: 'b', label: '선택 B', icon: 'check' }]}
      onUpdate:modelValue={select} />)}
    {skeletonKinds.map(type => box('skeleton-' + type, <K.KjunSkeleton type={type} rows={1} columns={1} animated={false} />))}
    {box('list-skeleton', <K.KjunListSkeleton rows={1} />)}
    {box('form-skeleton', <K.KjunFormSkeleton fields={['']} multiline />)}
    {box('chart-skeleton', <K.KjunChartSkeleton kind="donut" />)}
    {box('price', <K.KjunPriceCell value={null} />)}
    {box('signed', <K.KjunSignedValue value={1} loading />)}
    {box('sparkline', <K.KjunSparkline data={[1, 3, 2]} />)}
    {box('progress-cell', <K.KjunProgressCell value={30} showLabel />)}
    {box('market-card', <K.KjunMarketCards rows={[{ id: 'one', name: '가격 대기', current_price: null }]} columns={[{ key: 'current_price', label: '가격' }]}
      metricConfig={{ current_price: { label: '가격', format: 'price' } }} storageNamespace="size-contracts" showFooter={false} />)}
    {box('market-skeleton', <K.KjunMarketTableSkeleton rows={1} showActions columns={[{ key: 'price', label: '가격' }]} />)}
    {box('kpi-hero', <K.KjunKpiHero label="로딩 요약" value={10} deltaAbsolute={1} loading secondary={[{ label: '보조 값', value: 2, desc: '보조 설명' }]} />)}
    {box('kpi-row', <K.KjunKpiRow loading items={[{ value: 10, desc: '설명' }, { value: 2, valueSegments: [{ text: '값' }] }] as any} />)}
    {box('kpi-dot', <K.KjunKpiRow items={[{ label: '점 규격', value: 10, badge: { text: '표식', variant: 'success' } }]} />)}
    {box('tooltip', <K.KjunTooltip content="크기 도움말" delay={0}>{button('크기 도움말 열기')}</K.KjunTooltip>)}
    {box('menu', <K.KjunMenuButton label="크기 메뉴">{Array.from({ length: 18 }, (_, i) => <K.KjunDropdownItem key={i} icon="check">{'항목 ' + i}</K.KjunDropdownItem>)}</K.KjunMenuButton>)}
    {box('select', <K.KjunSelect ariaLabel="크기 선택" modelValue={state.selection} options={Array.from({ length: 18 }, (_, i) => ({ value: i ? String(i) : 'a', label: '선택 항목 ' + i }))}
      onUpdate:modelValue={select} />)}
    {button('기본 패널 열기', () => { state.drawer = true; })}
    <K.KjunDrawer open={state.drawer} onUpdate:open={(open: boolean) => { state.drawer = open; }} title="기본 크기 패널" position="right">패널 내용</K.KjunDrawer>
    {button('닫기 크기 확인', () => { state.modal = true; })}
    <K.KjunModal open={state.modal} onUpdate:open={(open: boolean) => { state.modal = open; }} title="닫기 크기 창">창 내용</K.KjunModal>
    <output data-testid="events">{`${state.progress}/${state.removed}/${state.selection}`}</output>
  </div>;
});
createApp(defineComponent(() => () => <K.KjunProvider><Cases /></K.KjunProvider>)).mount('#root');
