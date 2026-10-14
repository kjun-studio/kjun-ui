import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunCard, KjunButton, KjunBadge } from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const state = reactive({ actions: 0, body: false });
const button = (label: string) => <KjunButton onClick={() => state.actions++}>{{ default: () => label }}</KjunButton>;
const badge = () => <KjunBadge variant="success">{{ default: () => '검토 완료' }}</KjunBadge>;
const box = (id: string, props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) =>
  <div data-case={id}><KjunCard {...props}>{slots}</KjunCard></div>;
createApp(defineComponent(() => () => (
  <KjunProvider>{{ default: () => [
    <main style={{ display: 'grid', gap: '24px', width: '240px', maxWidth: '100%', background: '#f4f4f4' }}>
      {box('short-header', {}, { header: badge, headerActions: () => button('상세 보기'), default: () => '카드 본문' })}
      {box('title-only', { title: '제목만 있는 카드', dividers: true })}
      {box('media-only', { radius: 'lg' }, { media: () => <div style={{ height: '96px', background: '#7ba796' }} /> })}
      {box('long-action', {}, { header: badge, headerActions: () => button('전체 프로젝트 변경 내역 확인하기'), default: () => '카드 본문' })}
      {box('two-actions', { title: '프로젝트 현황' }, { headerActions: () => [button('문서 추가'), button('전체 보기')], default: () => '카드 본문' })}
      {box('actions-only', {}, { headerActions: () => button('상세 보기'), default: () => '카드 본문' })}
      {box('footer-only', { dividers: true }, { footer: () => button('저장') })}
      {box('header-footer', { title: '카드 제목', dividers: true }, { footer: () => button('저장') })}
      {box('empty-fragment', { title: '제목만 있는 카드' }, { default: () => [null, false, [], '   '] })}
      {box('body-toggle', { title: '카드 제목' }, { default: () => state.body ? '카드 본문' : null })}
      {box('zero', {}, { default: () => '0' })}
    </main>,
    <KjunButton onClick={() => { state.body = !state.body; }}>{{ default: () => '본문 전환' }}</KjunButton>,
    <output data-testid="actions">{String(state.actions)}</output>,
  ] }}</KjunProvider>
))).mount('#root');
