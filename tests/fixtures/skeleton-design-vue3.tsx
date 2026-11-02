import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { tableColumns } from './skeleton-design-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '360px' }}>
    <div data-testid="line-caption"><K.KjunSkeleton type="line" role="caption" width={80} /></div>
    <div data-testid="row"><K.KjunListSkeleton variant="row" rows={2} /></div>
    <div data-testid="row-avatar"><K.KjunListSkeleton variant="row" rows={2} avatar trailing="switch" description={false} /></div>
    <div data-testid="status"><K.KjunListSkeleton variant="row" rows={1} loadingText="목록을 불러오는 중" /></div>
    <div data-testid="table-cards"><K.KjunTable ariaLabel="표" data={[]} columns={tableColumns} loading skeletonRows={1} responsive="card" /></div>
  </div>
</K.KjunProvider>)).mount('#root');
