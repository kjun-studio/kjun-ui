import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { layoutColumns, layoutProps } from './table-card-layouts-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '8px' }}>
    <K.KjunTable {...layoutProps as any} columns={layoutColumns as any} onRowClick={() => undefined}>{{ expand: ({ row }: any) => '상세 ' + row.name }}</K.KjunTable>
  </div>
</K.KjunProvider>)).mount('#root');
