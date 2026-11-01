import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { groupColumns, groupRows, groupSummary } from './table-groups-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '24px', width: '560px' }}>
    <K.KjunTable ariaLabel="묶은 표" columns={groupColumns as any} data={groupRows} groupBy="status" summary={groupSummary} responsive="none">
      {{ group: ({ value }: any) => '상태: ' + String(value) }}
    </K.KjunTable>
  </div>
</K.KjunProvider>)).mount('#root');
