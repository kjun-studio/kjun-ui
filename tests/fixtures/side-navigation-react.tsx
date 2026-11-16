import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { KjunProvider, KjunSideNavigation } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { sideCase, sideItems, sideStart, sideWidth } from './side-navigation-cases';

applyDemoColors('default');
function Page() {
  const [value, setValue] = useState(sideStart), [log, setLog] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(sideCase.collapsed), [expanded, setExpanded] = useState<string[]>([]);
  const [items, setItems] = useState(sideCase.late ? [] : sideItems);
  useEffect(() => { if (sideCase.late) setTimeout(() => setItems(sideItems), 100); }, []);
  const add = (entry: string) => setLog(old => [...old, entry]);
  return <div style={{ display: 'flex', gap: 24, padding: 24 }}>
    <aside data-testid="side" style={{ width: sideWidth(collapsed) }}>
      <KjunSideNavigation ariaLabel="작업 공간" items={items as any} value={value} collapsed={collapsed}
        onCollapsedChange={next => { setCollapsed(next); add('wide'); }}
        {...(sideCase.controlled ? { expanded, onExpandedChange: (next: string[]) => { setExpanded(next); add('open:' + next.join(',')); } } : {})}
        rail={sideCase.rail} railLabels={sideCase.labels} density={sideCase.density} {...(sideCase.groups ? { collapsibleGroups: true, onExpandedGroupsChange: (next: string[]) => add('groups:' + next.join(',')) } : {})}
        onNavigate={(key, event) => { event.preventDefault(); setValue(key); add('go:' + key); }} onReselect={key => add('again:' + key)} />
    </aside>
    <div><button data-testid="to-checkout" onClick={() => setValue('checkout')}>결제 화면으로</button><div data-testid="log">{log.join(' ')}</div></div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
