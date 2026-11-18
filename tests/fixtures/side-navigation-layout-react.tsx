import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, KjunSideNavigation, KjunSideNavigationLayout } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { layoutCase, layoutItems } from './side-navigation-layout-cases';

applyDemoColors('default');
function Page() {
  const [value, setValue] = useState('home'), [collapsed, setCollapsed] = useState(layoutCase.collapsed), [navOpen, setNavOpen] = useState(false);
  return <KjunSideNavigationLayout collapsed={collapsed} railLabels={layoutCase.labels} width={layoutCase.width} sticky={layoutCase.sticky} breakpoint={layoutCase.breakpoint}
    railBreakpoint={layoutCase.railBreakpoint} stickyOffset={layoutCase.stickyOffset} onCollapsedChange={setCollapsed} navOpen={navOpen} onNavOpenChange={setNavOpen}
    nav={({ collapsed: narrow, drawer, closeDrawer }) => <KjunSideNavigation ariaLabel="작업 공간" items={layoutItems as any} value={value} collapsed={narrow} railLabels={layoutCase.labels}
      onCollapsedChange={setCollapsed} collapseToggle={!drawer} onNavigate={(key, event) => { event.preventDefault(); setValue(key); closeDrawer(); }} />}>
    <main data-testid="page" style={{ height: 2000 }}>
      <button data-testid="open" onClick={() => setNavOpen(true)}>메뉴 열기</button>
      <button data-testid="toggle" onClick={() => setCollapsed(next => !next)}>접기 전환</button>
      <div data-testid="value">{value}</div>
      <div data-testid="nav-open">{String(navOpen)}</div>
    </main>
  </KjunSideNavigationLayout>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
