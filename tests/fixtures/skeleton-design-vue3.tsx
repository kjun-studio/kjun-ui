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
    <div data-testid="text-caption"><K.KjunSkeleton type="text" rows={3} role="caption" /></div>
    <div data-testid="table-unbounded"><K.KjunSkeleton type="table" rows={Infinity} columns={1e9} /></div>
    <div data-testid="form-actions"><K.KjunFormSkeleton fields={['']} actions={2} /></div>
    <div data-testid="market-status"><K.KjunMarketTableSkeleton columns={[{ key: 'name', label: '이름' }]} rows={Infinity} loadingText="표를 불러오는 중" /></div>
    <div data-testid="stat"><K.KjunSkeleton type="stat" animated={false} /></div>
    <div data-testid="styled"><K.KjunSkeleton type="block" height={20} style={{ marginTop: 12 }} /></div>
  </div>
</K.KjunProvider>)).mount('#root');
