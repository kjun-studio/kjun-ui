import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, KjunSideNavigation } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { sideItems, sideStart } from './side-navigation-cases';

applyDemoColors('default');
function Page() {
  const [value, setValue] = useState(sideStart), [log, setLog] = useState<string[]>([]);
  return <div style={{ display: 'flex', gap: 24, padding: 24 }}>
    <aside data-testid="side" style={{ width: 240 }}>
      <KjunSideNavigation ariaLabel="작업 공간" items={sideItems as any} value={value}
        onNavigate={(key, event) => { event.preventDefault(); setValue(key); setLog(old => [...old, 'go:' + key]); }} onReselect={key => setLog(old => [...old, 'again:' + key])} />
    </aside>
    <div data-testid="log">{log.join(' ')}</div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
