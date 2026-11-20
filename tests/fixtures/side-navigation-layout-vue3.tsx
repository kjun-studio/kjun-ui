import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { layoutCase, layoutItems, panelItems, spaceItems, spacesCase } from './side-navigation-layout-cases';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const value = ref('home'), collapsed = ref(layoutCase.collapsed), navOpen = ref(false);
  return () => <K.KjunSideNavigationLayout collapsed={collapsed.value} railLabels={layoutCase.labels} width={layoutCase.width} sticky={layoutCase.sticky}
    {...(layoutCase.breakpoint !== undefined ? { breakpoint: layoutCase.breakpoint } : {})} railBreakpoint={layoutCase.railBreakpoint} stickyOffset={layoutCase.stickyOffset}
    navOpen={navOpen.value} {...{ 'onUpdate:navOpen': (next: boolean) => { navOpen.value = next; }, 'onUpdate:collapsed': (next: boolean) => { collapsed.value = next; } }}>
    {{
      nav: ({ collapsed: narrow, drawer, closeDrawer }: { collapsed: boolean; drawer: boolean; closeDrawer: () => void }) => <K.KjunSideNavigation ariaLabel="작업 공간" items={layoutItems as any} value={value.value} collapsed={narrow}
        railLabels={layoutCase.labels} collapseToggle={!drawer} {...{ 'onUpdate:collapsed': (next: boolean) => { collapsed.value = next; } }}
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); value.value = key; closeDrawer(); }} />,
      default: () => <main data-testid="page" style={{ height: '2000px' }}>
        <button data-testid="open" onClick={() => { navOpen.value = true; }}>메뉴 열기</button>
        <button data-testid="toggle" onClick={() => { collapsed.value = !collapsed.value; }}>접기 전환</button>
        <div data-testid="value">{value.value}</div>
        <div data-testid="nav-open">{String(navOpen.value)}</div>
      </main>,
    }}
  </K.KjunSideNavigationLayout>;
} });
/** The spaces layout: window.__collapse() folds the panel from outside, without moving focus. */
const Spaces = defineComponent({ setup() {
  const space = ref('projects'), value = ref('board'), closed = ref(spacesCase.closed), navOpen = ref(false);
  (window as any).__collapse = () => { closed.value = true; };
  return () => <K.KjunSideNavigationLayout spacesTitle={spacesCase.title} panelSurface={spacesCase.surface} sticky={layoutCase.sticky} panelCollapsed={closed.value}
    collapsed={layoutCase.collapsed} railLabels={layoutCase.labels} width={layoutCase.width} {...(layoutCase.breakpoint !== undefined ? { breakpoint: layoutCase.breakpoint } : {})}
    railBreakpoint={layoutCase.railBreakpoint} navOpen={navOpen.value}
    {...{ 'onUpdate:navOpen': (next: boolean) => { navOpen.value = next; }, 'onUpdate:panelCollapsed': (next: boolean) => { closed.value = next; } }}>
    {{
      spaces: () => <K.KjunSideNavigation ariaLabel="공간" items={spaceItems as any} value={space.value} collapsed
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); space.value = key; }} />,
      nav: ({ closeDrawer }: { closeDrawer: () => void }) => <K.KjunSideNavigation ariaLabel="메뉴" items={panelItems as any} value={value.value} density="compact"
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); value.value = key; closeDrawer(); }} />,
      default: () => <main data-testid="page" style={{ height: '2000px' }}>
        <button data-testid="open" onClick={() => { navOpen.value = true; }}>메뉴 열기</button>
        <div data-testid="value">{value.value}</div>
        <div data-testid="closed">{String(closed.value)}</div>
      </main>,
    }}
  </K.KjunSideNavigationLayout>;
} });
createApp(() => <K.KjunProvider>{spacesCase.on ? <Spaces /> : <Page />}</K.KjunProvider>).mount('#root');
