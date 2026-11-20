import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KjunProvider, KjunSideNavigation, KjunSideNavigationLayout } from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';
import { layoutCase, layoutItems, panelItems, spaceItems, spacesCase } from './side-navigation-layout-cases';

applyDemoColors('default');
function Page() {
  const [value, setValue] = useState('home'), [collapsed, setCollapsed] = useState(layoutCase.collapsed), [navOpen, setNavOpen] = useState(false);
  return <KjunSideNavigationLayout collapsed={collapsed} railLabels={layoutCase.labels} width={layoutCase.width} breakpoint={layoutCase.breakpoint}
    railBreakpoint={layoutCase.railBreakpoint} onCollapsedChange={setCollapsed} navOpen={navOpen} onNavOpenChange={setNavOpen}
    nav={({ collapsed: narrow, closeDrawer }) => <KjunSideNavigation ariaLabel="작업 공간" items={layoutItems as any} value={value} collapsed={narrow} railLabels={layoutCase.labels}
      onCollapsedChange={setCollapsed} onNavigate={key => { setValue(key); closeDrawer(); }} />}>
    <View>
      <Pressable testID="open" onPress={() => setNavOpen(true)}><Text>메뉴 열기</Text></Pressable>
      <Pressable testID="toggle" onPress={() => setCollapsed(next => !next)}><Text>접기 전환</Text></Pressable>
      <Text testID="value">{value}</Text>
      <Text testID="nav-open">{String(navOpen)}</Text>
    </View>
  </KjunSideNavigationLayout>;
}
function Spaces() {
  const [space, setSpace] = useState('projects'), [value, setValue] = useState('board'), [closed, setClosed] = useState(spacesCase.closed), [navOpen, setNavOpen] = useState(false);
  return <KjunSideNavigationLayout spaces={<KjunSideNavigation ariaLabel="공간" items={spaceItems as any} value={space} collapsed onNavigate={key => setSpace(key)} />}
    spacesTitle={spacesCase.title} panelSurface={spacesCase.surface} panelCollapsed={closed} onPanelCollapsedChange={setClosed} breakpoint={layoutCase.breakpoint}
    navOpen={navOpen} onNavOpenChange={setNavOpen}
    nav={({ closeDrawer }) => <KjunSideNavigation ariaLabel="메뉴" items={panelItems as any} value={value} density="compact" onNavigate={key => { setValue(key); closeDrawer(); }} />}>
    <View>
      <Pressable testID="open" onPress={() => setNavOpen(true)}><Text>메뉴 열기</Text></Pressable>
      <Text testID="value">{value}</Text>
      <Text testID="closed">{String(closed)}</Text>
    </View>
  </KjunSideNavigationLayout>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}>{spacesCase.on ? <Spaces /> : <Page />}</KjunProvider>);
