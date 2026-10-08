import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, DsCard, DsButton, DsAlert, DsIconToggle, DsCopyButton } from '@kjun/react';
import { demoDomainColors, demoFont } from './typography-values';
import { applyCardPalette, cardPalette, longCardTitle, type CardPaletteMode } from './card-review-values';
applyCardPalette();
function App() {
  const [mode, setMode] = useState<CardPaletteMode>('initial');
  const [active, setActive] = useState(false), [actions, setActions] = useState(0);
  Object.assign(window, { setCardPalette: (next: CardPaletteMode) => { applyCardPalette(next); setMode(next); } });
  return <KjunProvider ><div style={{ padding: 16, minWidth: 0 }}>
    <div data-testid="responsive-card"><DsCard padding="lg" title="반응형 제목">반응형 본문</DsCard></div>
    <div data-testid="primary-card"><DsCard surface="brand" title="강조 제목" subtitle="강조 설명" footer="강조 하단">강조 본문</DsCard></div>
    <div data-testid="nested-card"><DsCard surface="brand"><DsCard title="내부 제목">내부 본문</DsCard></DsCard></div>
    <div data-testid="glass-card"><DsCard surface="glass" title="유리 제목" subtitle="유리 설명">유리 본문</DsCard></div>
    <div data-testid="narrow-card" style={{ width: 240, maxWidth: '100%' }}><DsCard title={longCardTitle} headerActions={<DsButton size="sm" onClick={()=>setActions(value=>value+1)}>상세 보기</DsButton>}>긴 카드 본문</DsCard></div>
    <span data-testid="card-actions">{actions}</span>
    {(['sm','md','lg'] as const).map(size=><div key={'alert-'+size} data-testid={'alert-'+size}><DsAlert size={size} title="알림 제목" closable>알림 설명</DsAlert></div>)}
    {(['xs','sm','md','lg','xl'] as const).map(size=><div key={'icon-'+size} data-testid={'icon-'+size}><DsIconToggle size={size} activeIcon="heart" ariaLabel={'아이콘 '+size} active={active} onToggle={()=>setActive(value=>!value)}/></div>)}
    {(['xs','sm','md'] as const).map(size=><div key={'copy-'+size} data-testid={'copy-'+size}><DsCopyButton value="복사 값" size={size} ariaLabel={'복사 '+size} copyText={async()=>{}}/></div>)}
  </div></KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
