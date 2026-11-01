import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { listColumns, listRows } from './table-list-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '8px' }}>
    <K.KjunTable ariaLabel="목록형 표" columns={listColumns as any} data={listRows} responsive="list" expandable>{{ expand: ({ row }: any) => '상세 ' + row.name }}</K.KjunTable>
  </div>
</K.KjunProvider>)).mount('#root');
