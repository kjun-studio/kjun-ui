import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunCard, KjunButton, KjunImage } from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { cardMediaSource } from '../../previews/catalog/example-tools';
applyDemoColors('default');
const state = reactive({ options: {} as Record<string, any>, parts: { title: true, custom: false, media: false }, actions: 0 });
Object.assign(window, { setCardContract: (next: Record<string, any>, content = {}) => { state.options = next; state.parts = { ...state.parts, ...content }; } });
createApp(defineComponent(() => () => (
  <KjunProvider>{{ default: () => [
    <div data-testid="contract-card" style={{ width: '280px', maxWidth: '100%' }}>
      <KjunCard {...state.options} title={state.parts.title ? '카드 제목' : undefined} subtitle={state.parts.title ? '카드 설명' : undefined}>{{
        default: () => '카드 본문',
        footer: () => '카드 푸터',
        headerActions: () => <KjunButton size="sm" onClick={() => state.actions++}>{{ default: () => '실행' }}</KjunButton>,
        ...(state.parts.custom ? { header: () => '사용자 헤더' } : {}),
        ...(state.parts.media ? { media: () => <KjunImage src={cardMediaSource} alt="카드 이미지" aspectRatio={2.5} /> } : {}),
      }}</KjunCard>
    </div>,
    <output data-testid="actions">{String(state.actions)}</output>,
  ] }}</KjunProvider>
))).mount('#root');
