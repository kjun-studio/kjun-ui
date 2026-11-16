import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, KjunInput, KjunTextarea } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
function Page() {
  const [title, setTitle] = useState('3분기 여행 계획'), [empty, setEmpty] = useState(''), [note, setNote] = useState('아침에 다녀옴.'), [draft, setDraft] = useState('보낼 글');
  return <main style={{ padding: 24, width: 480 }}>
    <p data-testid="guide" style={{ margin: 0 }}>작업 공간 / 여행</p>
    <KjunInput variant="plain" ariaLabel="제목" value={title} onValueChange={setTitle} />
    <KjunInput variant="plain" ariaLabel="빈 제목" value={empty} onValueChange={setEmpty} errorMessage="제목을 입력해 주세요." />
    <KjunInput variant="plain" ariaLabel="잠긴 제목" value="잠긴 제목" disabled />
    <KjunInput variant="plain" ariaLabel="검색" prefixIcon="search" clearable value={title} onValueChange={setTitle} />
    <KjunTextarea variant="plain" ariaLabel="본문" value={note} onValueChange={setNote} />
    <KjunTextarea variant="plain" ariaLabel="보낼 글" value={draft} onValueChange={setDraft} showCount maxLength={100} submitLabel="보내기" onSubmit={() => {}} />
    <KjunInput ariaLabel="기본" value={title} onValueChange={setTitle} />
  </main>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
