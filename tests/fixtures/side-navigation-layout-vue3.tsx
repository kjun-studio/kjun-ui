import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { layoutCase, layoutItems } from './side-navigation-layout-cases';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const value = ref('home'), collapsed = ref(layoutCase.collapsed), navOpen = ref(false);
  return () => <K.KjunSideNavigationLayout collapsed={collapsed.value} railLabels={layoutCase.labels} width={layoutCase.width} sticky={layoutCase.sticky}
    {...(layoutCase.breakpoint !== undefined ? { breakpoint: layoutCase.breakpoint } : {})} navOpen={navOpen.value} {...{ 'onUpdate:navOpen': (next: boolean) => { navOpen.value = next; } }}>
    {{
      nav: ({ collapsed: narrow, drawer }: { collapsed: boolean; drawer: boolean }) => <K.KjunSideNavigation ariaLabel="작업 공간" items={layoutItems as any} value={value.value} collapsed={narrow}
        railLabels={layoutCase.labels} collapseToggle={!drawer} {...{ 'onUpdate:collapsed': (next: boolean) => { collapsed.value = next; } }}
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); value.value = key; navOpen.value = false; }} />,
      default: () => <main data-testid="page" style={{ height: '2000px' }}>
        <button data-testid="open" onClick={() => { navOpen.value = true; }}>메뉴 열기</button>
        <button data-testid="toggle" onClick={() => { collapsed.value = !collapsed.value; }}>접기 전환</button>
        <div data-testid="value">{value.value}</div>
      </main>,
    }}
  </K.KjunSideNavigationLayout>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
