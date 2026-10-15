import { createApp, defineComponent } from 'vue';
import { KjunProvider, KjunTable, KjunButton, KjunInput } from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const columns = [{ key: 'name', label: '이름' }], data = [{ id: 1, name: '문서' }];
createApp(defineComponent(() => () => <KjunProvider>
  {[false, true].map(compact => <div key={String(compact)} data-testid={compact ? 'compact' : 'regular'}><KjunTable columns={columns} data={data} compact={compact} responsive="none" /></div>)}
  <div data-testid="button"><KjunButton>확인</KjunButton></div>
  <div data-testid="input"><KjunInput ariaLabel="입력" /></div>
</KjunProvider>)).mount('#root');
