import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { pendingSpan, structureColumns, structureGroups, structureRows } from './table-structure-values';
applyDemoColors('default');
// Same sections and DOM as table-structure-cases.tsx (React/Native).
createApp(defineComponent(() => {
  const events = ref<string[]>([]);
  const record = (text: string) => { events.value = [...events.value, text]; };
  const columns = structureColumns(record) as any;
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', maxWidth: '720px' }}>
    <div data-testid="grouped"><K.KjunTable ariaLabel="실적 표" columns={columns} data={structureRows} rowKey="id" columnGroups={structureGroups}
      cellSpan={pendingSpan} responsive="card" cardTitle="name" onRowClick={(row: any) => record('row:' + row.id)} /></div>
    <output data-testid="events">{events.value.join(' ')}</output>
    <div data-testid="loading"><K.KjunTable ariaLabel="불러오는 표" columns={columns} data={[]} loading skeletonRows={2} columnGroups={structureGroups} responsive="none" /></div>
    <div data-testid="selectable"><K.KjunTable ariaLabel="선택 표" columns={columns} data={structureRows} rowKey="id" columnGroups={structureGroups} cellSpan={pendingSpan} selectable responsive="none" /></div>
  </div> }}</K.KjunProvider>;
})).mount('#root');
