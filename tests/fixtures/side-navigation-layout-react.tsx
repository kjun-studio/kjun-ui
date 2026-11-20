import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { KjunProvider, KjunSideNavigation, KjunSideNavigationLayout } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { layoutCase, layoutItems, panelItems, spaceItems, spacesCase } from './side-navigation-layout-cases';

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
/** The spaces layout: window.__collapse() folds the panel from outside, without moving focus. */
function Spaces() {
  const [space, setSpace] = useState('projects'), [value, setValue] = useState('board'), [closed, setClosed] = useState(spacesCase.closed), [navOpen, setNavOpen] = useState(false);
  (window as any).__collapse = () => setClosed(true);
  return <KjunSideNavigationLayout spaces={<KjunSideNavigation ariaLabel="공간" items={spaceItems as any} value={space} collapsed
      onNavigate={(key, event) => { event.preventDefault(); setSpace(key); }} />}
    spacesTitle={spacesCase.title} panelSurface={spacesCase.surface} panelCollapsed={closed} onPanelCollapsedChange={setClosed}
    collapsed={layoutCase.collapsed} railLabels={layoutCase.labels} width={layoutCase.width} breakpoint={layoutCase.breakpoint} railBreakpoint={layoutCase.railBreakpoint}
    navOpen={navOpen} onNavOpenChange={setNavOpen}
    nav={({ closeDrawer }) => <KjunSideNavigation ariaLabel="메뉴" items={panelItems as any} value={value} density="compact"
      onNavigate={(key, event) => { event.preventDefault(); setValue(key); closeDrawer(); }} />}>
    <main data-testid="page" style={{ height: 2000 }}>
      <button data-testid="open" onClick={() => setNavOpen(true)}>메뉴 열기</button>
      <div data-testid="value">{value}</div>
      <div data-testid="closed">{String(closed)}</div>
    </main>
  </KjunSideNavigationLayout>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider>{spacesCase.on ? <Spaces /> : <Page />}</KjunProvider>);
