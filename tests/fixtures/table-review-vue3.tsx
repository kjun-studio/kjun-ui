import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { reviewColumns, reviewRows, reviewSelectable } from './table-review-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '8px', display: 'grid', gap: '24px' }}>
    <div data-testid="expanded"><K.KjunTable ariaLabel="펼침 표" columns={reviewColumns as any} data={reviewRows} expandable expandedRows={['a']} responsive="none">{{ expand: ({ row }: any) => '상세 ' + row.name }}</K.KjunTable></div>
    <div data-testid="locked"><K.KjunTable ariaLabel="잠금 표" columns={reviewColumns as any} data={reviewRows} selectable rowSelectable={reviewSelectable} searchable searchMode="client" searchKeys={['name', 'owner']} responsive="none"
      summary={{ name: 'count', amount: 'sum' }} /></div>
    <div data-testid="list"><K.KjunTable ariaLabel="목록 표" columns={reviewColumns as any} data={reviewRows} responsive="list" selectable onRowClick={() => {}} /></div>
  </div>
</K.KjunProvider>)).mount('#root');
