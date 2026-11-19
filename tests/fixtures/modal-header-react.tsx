import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { cssPalette } from './typography-values';

cssPalette();
const query = new URLSearchParams(location.search), bare = query.has('bare'), custom = query.has('custom'), long = query.has('long'), wrap = query.has('wrap');
// A Modal whose confirm starts a save (loading) and a body button that ends it; ?bare drops the title, ?custom puts a
// button in the header slot, ?long overflows the body, ?wrap puts one wrapper in the footer.
function App() {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [edits, setEdits] = useState(0);
  return <K.KjunProvider>
    <K.KjunButton onClick={() => setOpen(true)}>열기</K.KjunButton>
    <output data-testid="state">{open ? 'open' : 'closed'}</output><output data-testid="edits">{edits}</output>
    <K.KjunModal open={open} onOpenChange={setOpen} showFooter confirmText="저장" loading={loading} onConfirm={() => setLoading(true)}
      title={bare || custom ? '' : '편집'}
      footer={wrap ? <div data-testid="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>3개 선택</span><K.KjunButton>보내기</K.KjunButton></div> : undefined}
      header={custom ? <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>맞춤 제목<K.KjunButton variant="ghost" size="sm" onClick={() => setEdits(n => n + 1)}>이름 바꾸기</K.KjunButton></span> : undefined}>
      <K.KjunButton variant="secondary" onClick={() => setLoading(false)}>진행 끝</K.KjunButton>
      {long && Array.from({ length: 40 }, (_, i) => <p key={i}>본문 {i + 1}</p>)}
    </K.KjunModal>
  </K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
