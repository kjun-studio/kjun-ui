import { createRoot } from 'react-dom/client';
import { forwardRef, useEffect, useState, type AnchorHTMLAttributes } from 'react';
import { KjunProvider, KjunSideNavigation } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { sideCase, sideColumn, sideItems, sideStart } from './side-navigation-cases';

applyDemoColors('default');
// A stand-in for a router's link (link=1): it renders the <a> it is given and marks it, as Next.js Link would add prefetching.
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>((props, ref) => <a ref={ref} data-router-link="" {...props} />);
function Page() {
  const [value, setValue] = useState(sideStart), [log, setLog] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(sideCase.collapsed), [expanded, setExpanded] = useState<string[]>([]);
  const [items, setItems] = useState(sideCase.late ? [] : sideItems);
  useEffect(() => { if (sideCase.late) setTimeout(() => setItems(sideItems), 100); }, []);
  const add = (entry: string) => setLog(old => [...old, entry]);
  return <div style={{ display: 'flex', gap: 24, padding: 24 }}>
    <aside data-testid="side" style={sideColumn(collapsed)}>
      <KjunSideNavigation ariaLabel="작업 공간" items={items as any} value={value} collapsed={collapsed}
        onCollapsedChange={next => { setCollapsed(next); add('wide'); }}
        {...(sideCase.controlled ? { expanded, onExpandedChange: (next: string[]) => { setExpanded(next); add('open:' + next.join(',')); } } : {})}
        rail={sideCase.rail} railLabels={sideCase.labels} density={sideCase.density} {...(sideCase.groups ? { collapsibleGroups: true, onExpandedGroupsChange: (next: string[]) => add('groups:' + next.join(',')) } : {})}
        groupCounts={sideCase.counts} collapsedParent={sideCase.flyout ? 'flyout' : 'widen'} linkAs={sideCase.link ? RouterLink : undefined}
        onAction={(key, action) => add('act:' + key + ':' + action)}
        {...(sideCase.chrome ? { collapseToggle: true, header: (narrow: boolean) => <div data-testid="header">{narrow ? 'K' : 'KJ Studio'}</div>, footer: <div data-testid="footer">KJ</div> } : {})}
        onNavigate={(key, event) => { event.preventDefault(); setValue(key); add('go:' + key); }} onReselect={key => add('again:' + key)} />
    </aside>
    <div><button data-testid="to-checkout" onClick={() => setValue('checkout')}>결제 화면으로</button><button data-testid="to-billing" onClick={() => setValue('settings')}>설정으로</button><div data-testid="log">{log.join(' ')}</div></div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
