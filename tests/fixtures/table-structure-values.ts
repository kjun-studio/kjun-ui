// Shared by the React/Native cases and the Vue 3 mirror: a grouped header, a merged cell and a pressable cell.
export const structureRows = [
  { id: 'a', name: '가나전자', sales: 1240, profit: 182, target: 82000, pending: false },
  { id: 'b', name: '다라화학', sales: null, profit: null, target: null, pending: true },
  { id: 'c', name: '마바물산', sales: 860, profit: -24, target: 31500, pending: false },
];
export const structureGroups = [{ label: '실적', columns: ['sales', 'profit'] }];
export const pendingSpan = (row: any, column: any) => row.pending && column.key === 'sales' ? 2 : undefined;
export const pendingText = '실적 발표 전';
export function structureColumns(record: (text: string) => void) {
  return [
    { key: 'name', label: '종목' },
    { key: 'sales', label: '매출', align: 'right', sortable: true, render: (value: unknown, row: any) => row.pending ? pendingText : String(value) },
    { key: 'profit', label: '영업이익', align: 'right', sortable: true },
    { key: 'target', label: '목표가', align: 'right',
      onCellPress: (row: any) => record('cell:' + row.id), cellLabel: (row: any) => row.name + ' 목표가, 근거 보기',
      cellProps: (row: any) => ({ 'data-target-cell': row.id, title: row.name + ' 목표가', style: { fontStyle: 'italic' } }) },
  ];
}
