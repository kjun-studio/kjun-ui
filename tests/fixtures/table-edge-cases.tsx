// edgeInset="none": a table inside a sheet, whose text has to meet the sheet's own left and right edges.
export const edgeRows = [
  { id: 'm9', month: '9월', income: 3200000, spend: 2140000 },
  { id: 'm10', month: '10월', income: 3200000, spend: 2480000 },
  { id: 'm11', month: '11월', income: 3350000, spend: 1620000 },
];
const won = (value: unknown) => Number(value).toLocaleString('ko-KR');
export const edgeColumns = [
  // Shares that leave room for a checkbox or expand column, so the grid fits its container and never scrolls sideways.
  { key: 'month', label: '월', width: '30%' },
  { key: 'income', label: '수입', align: 'right', format: won, width: '30%' },
  { key: 'spend', label: '지출', align: 'right', format: won, width: '25%' },
];
const query = new URLSearchParams(location.search);
// ?mode=default keeps the inset, ?mode=select adds a checkbox column, ?mode=empty has no rows.
export const edgeMode = query.get('mode') || 'none';
export const edgeProps = { ariaLabel: '월별 추이', responsive: 'none', hoverable: false, columns: edgeColumns,
  data: edgeMode === 'empty' ? [] : edgeRows, edgeInset: edgeMode === 'default' ? 'default' : 'none',
  ...(edgeMode === 'select' ? { selectable: true, selected: [] } : {}), ...(edgeMode === 'expand' ? { expandable: true } : {}) };
export function TableEdgeCases({ K }: { K: any }) {
  return <div style={{ padding: 20, width: 420 }}>
    <div data-testid="title">월별 추이</div>
    <K.KjunTable {...edgeProps} renderExpand={(row: any) => '상세 ' + row.month} />
  </div>;
}
