import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunCard, KjunButton, KjunImage, type KjunCardProps } from '@kjun-ui/native';
import { applyDemoColors, demoPalettes, demoFont } from '../../shared/demo-colors';
import { cardMediaSource } from '../../previews/catalog/example-tools';
applyDemoColors('default');
function App() {
  const [options, setOptions] = useState<KjunCardProps>({});
  const [actions, setActions] = useState(0);
  const [parts, setParts] = useState({ title: true, custom: false, media: false });
  Object.assign(window, { setCardContract: (next: KjunCardProps, content = {}) => { setOptions(next); setParts(p => ({ ...p, ...content })); } });
  return <KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><div data-testid="contract-card" style={{ width: 280, maxWidth: '100%' }}>
    <KjunCard {...options} title={parts.title ? '카드 제목' : undefined} subtitle={parts.title ? '카드 설명' : undefined}
      header={parts.custom ? '사용자 헤더' : undefined} headerActions={<KjunButton size="sm" onPress={() => setActions(n => n + 1)}>실행</KjunButton>}
      media={parts.media ? <KjunImage src={cardMediaSource} alt="카드 이미지" aspectRatio={2.5} /> : undefined} footer="카드 푸터">카드 본문</KjunCard>
  </div><output data-testid="actions">{actions}</output></KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
