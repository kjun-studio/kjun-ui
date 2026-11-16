import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, KjunFormGroup, KjunFilterGroup, KjunAlert, KjunCard, KjunInput } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const options = [{ label: '전체', value: 'all' }, { label: '진행 중', value: 'open' }];
function Page() {
  const [filter, setFilter] = useState('all'), [name, setName] = useState('');
  return <main style={{ padding: 24, width: 480 }}>
    <style>{'.app-slot { margin-top: 13px; grid-column: span 2; }'}</style>
    <KjunFormGroup label="이름" className="app-slot"><KjunInput value={name} onValueChange={setName} /></KjunFormGroup>
    <KjunFilterGroup className="app-slot" ariaLabel="상태" value={filter} options={options} onValueChange={next => setFilter(String(next))} />
    <KjunAlert className="app-slot" title="알림" closable>닫으면 클래스도 함께 사라집니다.</KjunAlert>
    <KjunCard className="app-slot" title="카드">본문</KjunCard>
  </main>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
