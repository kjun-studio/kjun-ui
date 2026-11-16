import { createApp, defineComponent, onMounted, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { sideCase, sideItems, sideStart, sideWidth } from './side-navigation-cases';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const value = ref(sideStart), log = ref<string[]>([]), collapsed = ref(sideCase.collapsed), expanded = ref<string[]>([]);
  const items = ref<any[]>(sideCase.late ? [] : sideItems);
  onMounted(() => { if (sideCase.late) setTimeout(() => { items.value = sideItems; }, 100); });
  const add = (entry: string) => { log.value = [...log.value, entry]; };
  return () => <div style={{ display: 'flex', gap: '24px', padding: '24px' }}>
    <aside data-testid="side" style={{ width: sideWidth(collapsed.value) + 'px' }}>
      <K.KjunSideNavigation ariaLabel="작업 공간" items={items.value} value={value.value} collapsed={collapsed.value}
        {...{ 'onUpdate:collapsed': (next: boolean) => { collapsed.value = next; add('wide'); } }}
        {...(sideCase.controlled ? { expanded: expanded.value, 'onUpdate:expanded': (next: string[]) => { expanded.value = next; add('open:' + next.join(',')); } } : {})}
        rail={sideCase.rail} {...(sideCase.groups ? { collapsibleGroups: true, 'onUpdate:expandedGroups': (next: string[]) => add('groups:' + next.join(',')) } : {})}
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); value.value = key; add('go:' + key); }} onReselect={(key: string) => add('again:' + key)} />
    </aside>
    <div><button data-testid="to-checkout" onClick={() => { value.value = 'checkout'; }}>결제 화면으로</button><div data-testid="log">{log.value.join(' ')}</div></div>
  </div>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
