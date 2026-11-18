import { createApp, defineComponent, onMounted, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { sideCase, sideColumn, sideItems, sideStart } from './side-navigation-cases';

applyDemoColors('default');
// A stand-in for RouterLink (link=1): it takes the destination as `to` and renders the <a> with the attributes it is given.
const RouterLink = defineComponent({ props: { to: { type: String, required: true } }, setup(props, { slots }) {
  return () => <a href={props.to} data-router-link="">{slots.default?.()}</a>;
} });
const Page = defineComponent({ setup() {
  const value = ref(sideStart), log = ref<string[]>([]), collapsed = ref(sideCase.collapsed), expanded = ref<string[]>([]);
  const items = ref<any[]>(sideCase.late ? [] : sideItems);
  onMounted(() => { if (sideCase.late) setTimeout(() => { items.value = sideItems; }, 100); });
  const add = (entry: string) => { log.value = [...log.value, entry]; };
  return () => <div style={{ display: 'flex', gap: '24px', padding: '24px' }}>
    <aside data-testid="side" style={sideColumn(collapsed.value)}>
      <K.KjunSideNavigation ariaLabel="작업 공간" items={items.value} value={value.value} collapsed={collapsed.value}
        {...{ 'onUpdate:collapsed': (next: boolean) => { collapsed.value = next; add('wide'); } }}
        {...(sideCase.controlled ? { expanded: expanded.value, 'onUpdate:expanded': (next: string[]) => { expanded.value = next; add('open:' + next.join(',')); } } : {})}
        rail={sideCase.rail} railLabels={sideCase.labels} railDividers={sideCase.dividers} density={sideCase.density} {...(sideCase.groups ? { collapsibleGroups: true, 'onUpdate:expandedGroups': (next: string[]) => add('groups:' + next.join(',')) } : {})}
        groupCounts={sideCase.counts} collapsedParent={sideCase.flyout ? 'flyout' : 'widen'} collapseToggle={sideCase.chrome}
        {...(sideCase.link ? { linkAs: RouterLink, linkProp: 'to' } : {})}
        onAction={(key: string, action: string) => add('act:' + key + ':' + action)}
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); value.value = key; add('go:' + key); }} onReselect={(key: string) => add('again:' + key)}>
        {sideCase.chrome ? { header: ({ collapsed: narrow }: { collapsed: boolean }) => <div data-testid="header">{narrow ? 'K' : 'KJ Studio'}</div>, footer: () => <div data-testid="footer">KJ</div> } : {}}
      </K.KjunSideNavigation>
    </aside>
    <div><button data-testid="to-checkout" onClick={() => { value.value = 'checkout'; }}>결제 화면으로</button><button data-testid="to-billing" onClick={() => { value.value = 'settings'; }}>설정으로</button><div data-testid="log">{log.value.join(' ')}</div></div>
  </div>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
