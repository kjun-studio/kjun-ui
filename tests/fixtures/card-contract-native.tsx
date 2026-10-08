import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, DsCard, DsButton, DsImage, type DsCardProps } from '@kjun/native';
import { applyDemoColors, demoPalettes, demoFont } from '../../shared/demo-colors';
import { cardMediaSource } from '../../previews/catalog/example-tools';
applyDemoColors('default');
function App() {
  const [options, setOptions] = useState<DsCardProps>({});
  const [actions, setActions] = useState(0);
  const [parts, setParts] = useState({ title: true, custom: false, media: false });
  Object.assign(window, { setCardContract: (next: DsCardProps, content = {}) => { setOptions(next); setParts(p => ({ ...p, ...content })); } });
  return <KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><div data-testid="contract-card" style={{ width: 280, maxWidth: '100%' }}>
    <DsCard {...options} title={parts.title ? '카드 제목' : undefined} subtitle={parts.title ? '카드 설명' : undefined}
      header={parts.custom ? '사용자 헤더' : undefined} headerActions={<DsButton size="sm" onPress={() => setActions(n => n + 1)}>실행</DsButton>}
      media={parts.media ? <DsImage src={cardMediaSource} alt="카드 이미지" aspectRatio={2.5} /> : undefined} footer="카드 푸터">카드 본문</DsCard>
  </div><output data-testid="actions">{actions}</output></KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
