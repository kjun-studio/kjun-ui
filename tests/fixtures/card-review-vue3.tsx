import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunCard, KjunButton, KjunAlert, KjunIconToggle, KjunCopyButton } from '@kjun-ui/vue3';
import { applyCardPalette, longCardTitle, type CardPaletteMode } from './card-review-values';
applyCardPalette();
const state = reactive({ active: false, actions: 0 });
Object.assign(window, { setCardPalette: (next: CardPaletteMode) => applyCardPalette(next) });
createApp(defineComponent(() => () => <KjunProvider><div style={{ padding: '16px', minWidth: 0 }}>
  <div data-testid="responsive-card"><KjunCard padding="lg" title="반응형 제목">반응형 본문</KjunCard></div>
  <div data-testid="primary-card"><KjunCard surface="brand" title="강조 제목" subtitle="강조 설명">{{ default: () => '강조 본문', footer: () => '강조 하단' }}</KjunCard></div>
  <div data-testid="nested-card"><KjunCard surface="brand"><KjunCard title="내부 제목">내부 본문</KjunCard></KjunCard></div>
  <div data-testid="glass-card"><KjunCard surface="glass" title="유리 제목" subtitle="유리 설명">유리 본문</KjunCard></div>
  <div data-testid="narrow-card" style={{ width: '240px', maxWidth: '100%' }}><KjunCard title={longCardTitle}>{{
    default: () => '긴 카드 본문',
    headerActions: () => <KjunButton size="sm" onClick={() => { state.actions++; }}>상세 보기</KjunButton>,
  }}</KjunCard></div>
  <span data-testid="card-actions">{String(state.actions)}</span>
  {(['sm', 'md', 'lg'] as const).map(size => <div key={'alert-' + size} data-testid={'alert-' + size}><KjunAlert size={size} title="알림 제목" closable>알림 설명</KjunAlert></div>)}
  {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <div key={'icon-' + size} data-testid={'icon-' + size}><KjunIconToggle size={size} activeIcon="heart" ariaLabel={'아이콘 ' + size} active={state.active} onToggle={() => { state.active = !state.active; }} /></div>)}
  {(['xs', 'sm', 'md'] as const).map(size => <div key={'copy-' + size} data-testid={'copy-' + size}><KjunCopyButton value="복사 값" size={size} ariaLabel={'복사 ' + size} copyText={async () => {}} /></div>)}
</div></KjunProvider>)).mount('#root');
