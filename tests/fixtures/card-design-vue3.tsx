import { createApp, defineComponent, ref } from 'vue';
import { KjunProvider, KjunCard, KjunButton, KjunBadge, KjunListSection, KjunListRow, KjunText } from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const longTitle = '분기별 프로젝트 운영 현황과 다음 단계 계획서';
const longSubtitle = '팀 전체가 함께 관리하는 문서와 최근 활동 기록을 모았습니다';
const presses = ref(0), nested = ref(false);
Object.assign(window, { addNestedControl: () => { nested.value = true; } });
const press = () => { presses.value++; };
const button = (label: string, variant = 'secondary') => <KjunButton variant={variant as any} onClick={press}>{{ default: () => label }}</KjunButton>;
const badge = (label: string, variant?: string) => () => <KjunBadge variant={variant as any}>{{ default: () => label }}</KjunBadge>;
const box = (id: string, width: number, props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) =>
  <div data-case={id} style={{ width: width + 'px' }}><KjunCard {...props}>{{ default: () => '본문', ...slots }}</KjunCard></div>;
createApp(defineComponent(() => () => (
  <KjunProvider>{{ default: () => [
    <main style={{ display: 'grid', gap: '24px', padding: '24px', background: '#f2f2f2', justifyItems: 'start' }}>
      {box('wide', 520, { title: '3분기 운영 현황', subtitle: '팀 전체가 함께 관리하는 문서', footerAlign: 'end' },
        { headerActions: badge('진행 중', 'success'), footer: () => [button('나중에'), button('프로젝트 보기', 'primary')], default: () => '이번 분기 문서를 검토했습니다.' })}
      {box('narrow', 300, { title: longTitle, subtitle: longSubtitle }, { headerActions: badge('진행 중', 'success') })}
      {box('narrow-button', 300, { title: '프로젝트 현황' }, { headerActions: () => button('전체 프로젝트 내역 보기') })}
      {box('success', 300, { surface: 'success', title: '완료된 작업' }, { headerActions: badge('완료', 'success') })}
      {box('muted', 300, { surface: 'muted', title: '보조 정보' }, { headerActions: badge('보조') })}
      {box('accent', 300, { surface: 'accent', title: '강조' })}
      {box('heading4', 300, { title: '네 번째 수준 제목', headingLevel: 4 })}
      {box('no-heading', 300, { title: '제목 아님', headingLevel: false })}
      {box('pressable', 300, { title: '눌리는 카드', pressable: true, onClick: press }, { default: () => nested.value ? <a href="#x">안쪽 링크</a> : '본문' })}
      {box('tint-list', 300, { surface: 'muted', title: '목록 카드' }, { default: () => <KjunListSection>{{ default: () => <KjunListRow title="목록 행">{{ badge: badge('새 항목', 'success') }}</KjunListRow> }}</KjunListSection> })}
      {box('two-line', 260, { title: '두 줄로 넘어가는 아주 긴 카드 제목' }, { headerActions: badge('진행', 'success') })}
      {box('side-media', 420, { mediaPosition: 'start', title: '가로 카드' }, { media: () => <div data-testid="side-media" style={{ background: '#7ba796' }} />, footer: () => button('열기'), default: () => '썸네일 옆 본문' })}
      {box('aspect', 320, { mediaAspect: 'wide', title: '비율 카드' }, { media: () => <div data-testid="aspect-media" style={{ background: '#7ba796' }} /> })}
      {box('node-title', 300, {}, { title: () => <KjunText>{{ default: () => '노드 제목 12' }}</KjunText> })}
      {box('link', 300, { title: '링크 카드', href: '#card-link', onClick: press })}
      {box('link-disabled', 300, { title: '막힌 링크 카드', href: '#card-link', disabled: true, onClick: press })}
      {box('guarded', 300, { title: '막는 카드', pressable: true, onClick: press, onKeydown: (event: KeyboardEvent) => { if (event.key === 'Enter') event.preventDefault(); } })}
      <div data-case="side-footer" style={{ width: '420px' }}><KjunCard mediaPosition="start" dividers>{{ media: () => <div style={{ background: '#7ba796' }} />, footer: () => <span>푸터만</span> }}</KjunCard></div>
    </main>,
    <output data-testid="presses">{String(presses.value)}</output>,
  ] }}</KjunProvider>
))).mount('#root');
