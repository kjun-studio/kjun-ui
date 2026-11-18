import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { cssPalette } from './typography-values';

cssPalette();
const query = new URLSearchParams(location.search), custom = query.has('custom'), side = query.has('side');
// A bottom drawer with handle, header actions, a description and a focus target for after the close.
function App() {
  const [open, setOpen] = useState(false), [resets, setResets] = useState(0);
  return <K.KjunProvider>
    <K.KjunButton onClick={() => setOpen(true)}>열기</K.KjunButton>
    <button id="after-close" type="button">다른 곳</button>
    <output data-testid="state">{open ? 'open' : 'closed'}</output><output data-testid="resets">{resets}</output>
    <K.KjunDrawer open={open} onOpenChange={setOpen} position={side ? "right" : "bottom"} width={340} handle {...(custom ? { header: <strong>맞춤 제목</strong> } : { title: '필터' })}
      ariaDescribedBy="drawer-desc" returnFocus={() => document.getElementById('after-close')}
      headerActions={<K.KjunButton variant="ghost" size="sm" onClick={() => setResets(n => n + 1)}>초기화</K.KjunButton>}
      footer={<><K.KjunButton variant="secondary" onClick={() => setOpen(false)}>취소</K.KjunButton><K.KjunButton onClick={() => setOpen(false)}>적용</K.KjunButton></>}>
      <p id="drawer-desc">조건을 고르면 목록이 바뀝니다.</p>
    </K.KjunDrawer>
  </K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
