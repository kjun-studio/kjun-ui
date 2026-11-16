import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { edgeProps } from './table-edge-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '20px', width: '420px' }}>
    <div data-testid="title">월별 추이</div>
    <K.KjunTable {...(edgeProps as any)}>{{ expand: ({ row }: { row: any }) => '상세 ' + row.month }}</K.KjunTable>
  </div>
</K.KjunProvider>)).mount('#root');
