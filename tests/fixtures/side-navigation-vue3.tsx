import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { sideItems, sideStart } from './side-navigation-cases';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const value = ref(sideStart), log = ref<string[]>([]);
  return () => <div style={{ display: 'flex', gap: '24px', padding: '24px' }}>
    <aside data-testid="side" style={{ width: '240px' }}>
      <K.KjunSideNavigation ariaLabel="작업 공간" items={sideItems as any} value={value.value}
        onNavigate={(key: string, event: MouseEvent) => { event.preventDefault(); value.value = key; log.value = [...log.value, 'go:' + key]; }} onReselect={(key: string) => { log.value = [...log.value, 'again:' + key]; }} />
    </aside>
    <div data-testid="log">{log.value.join(' ')}</div>
  </div>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
