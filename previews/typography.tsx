import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, DsButton, DsInput, DsKpiHero, DsKpiRow } from '@kjun/react';
import { tokens, type InputSize } from '@kjun/tokens';
import { applyDemoColors } from '../shared/demo-colors';

applyDemoColors('default');
const kebab = (value: string) => value.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
function SpecimenInput({ size }: { size: InputSize }) {
  const [value, setValue] = useState('');
  return <DsInput size={size} value={value} onChange={event => setValue(event.target.value)} ariaLabel={size + ' 입력'} placeholder={size + ' 입력 · 16px'} />;
}
createRoot(document.getElementById('root')!).render(<KjunProvider>
  <main style={{ padding: 16, display: 'grid', gap: 24, overflowWrap: 'anywhere' }}>
    {Object.entries(tokens.typography).map(([role, spec]) => <section key={role}>
      <div className="kjun-type-meta">{role} · {spec.fontSizePx}/{spec.lineHeightPx} · {spec.fontWeight}</div>
      <div className={'kjun-type-' + kebab(role)}>{/number|display/.test(role) ? '1,234,567.89' : '읽기 편한 업무 화면 Typography'}</div>
    </section>)}
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {(['xs','sm','md','lg','xl'] as const).map(size => <DsButton key={size} size={size}>{size} 버튼</DsButton>)}
    </section>
    <section style={{ display: 'grid', gap: 12 }}>
      {(['sm','md','lg'] as const).map(size => <SpecimenInput key={size} size={size} />)}
    </section>
    <DsKpiHero label="주요 지표" value={123456789} suffix="원" />
    <DsKpiRow mobileSummary={false} items={[{ label: '주문 수', value: 12345, suffix: '건' }, { label: '평균 금액', value: 67890, suffix: '원' }]} />
  </main>
</KjunProvider>);
