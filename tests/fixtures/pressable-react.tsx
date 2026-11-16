import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, KjunPressable } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
function Page() {
  const [presses, setPresses] = useState(0);
  const press = () => setPresses(count => count + 1);
  return <div style={{ padding: 24, width: 360, display: 'grid', gap: 16 }}>
    <KjunPressable ariaLabel="추억 지도에서 보기" onClick={press} style={{ borderRadius: 16, overflow: 'hidden' }}><div data-testid="map" style={{ height: 120, background: '#CFE4F7' }} /></KjunPressable>
    <KjunPressable onClick={press} pressEffect="none" style={{ padding: 12 }}>표시 없는 영역</KjunPressable>
    <KjunPressable ariaLabel="잠긴 영역" onClick={press} disabled style={{ padding: 12 }}>잠긴 영역</KjunPressable>
    <KjunPressable ariaLabel="꽉 찬 영역" onClick={press} focusRingInset style={{ padding: 12 }}>꽉 찬 영역</KjunPressable>
    <div data-testid="presses">{presses}</div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
