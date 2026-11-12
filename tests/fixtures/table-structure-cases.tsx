import { useState } from 'react';
import { pendingSpan, structureColumns, structureGroups, structureRows } from './table-structure-values';
// KjunTable structure cases for React and Native (Vue 3 mirrors this in table-structure-vue3.tsx).
export function TableStructureCases({ K, providerProps = {} }: { K: any; providerProps?: Record<string, any> }) {
  const [events, setEvents] = useState<string[]>([]);
  const record = (text: string) => setEvents(old => [...old, text]);
  const columns = structureColumns(record);
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, maxWidth: 720 }}>
    <div data-testid="grouped"><K.KjunTable ariaLabel="실적 표" columns={columns} data={structureRows} rowKey="id" columnGroups={structureGroups}
      cellSpan={pendingSpan} responsive="card" cardTitle="name" onRowClick={(row: any) => record('row:' + row.id)} /></div>
    <output data-testid="events">{events.join(' ')}</output>
    <div data-testid="loading"><K.KjunTable ariaLabel="불러오는 표" columns={columns} data={[]} loading skeletonRows={2} columnGroups={structureGroups} responsive="none" /></div>
    <div data-testid="selectable"><K.KjunTable ariaLabel="선택 표" columns={columns} data={structureRows} rowKey="id" columnGroups={structureGroups} cellSpan={pendingSpan} selectable responsive="none" /></div>
  </div></K.KjunProvider>;
}
