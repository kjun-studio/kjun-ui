import { useState } from 'react';
// Table refinements (0.18.0): sort affordance, selected rows, the selection bar in the toolbar's place, a trailing expand column, sticky header line.
export const refineRows = Array.from({ length: 12 }, (_, i) => ({ id: 'r' + i, name: '항목 ' + (i + 1), owner: ['김서연', '이도윤', '박하린'][i % 3], amount: (i + 1) * 1000 }));
export const refineColumns = [
  { key: 'name', label: '이름', sortable: true },
  { key: 'owner', label: '담당자' },
  { key: 'amount', label: '금액', sortable: true, align: 'right', type: 'number' },
];
export function TableRefineCases({ K, native = false }: { K: any; native?: boolean }) {
  const [selected, setSelected] = useState([] as object[]);
  return <div style={{ padding: 24, width: 640 }}>
    <K.KjunTable ariaLabel="정리된 표" columns={refineColumns} data={refineRows} selectable selected={selected} onSelectionChange={setSelected}
      expandable renderExpand={(row: any) => '상세 ' + row.name} searchable striped stickyHeader maxHeight={native ? 320 : 320} responsive="none" />
  </div>;
}
