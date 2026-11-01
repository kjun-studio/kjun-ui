// Table groups and summaries (0.18.0): status groups that collapse, subtotals per group and one total.
export const groupRows = [
  { id: 'p1', name: '브랜드 웹사이트', status: '진행 중', amount: 4800000 },
  { id: 'p2', name: '고객센터 개편', status: '검토 대기', amount: 3200000 },
  { id: 'p3', name: '결제 화면 개선', status: '완료', amount: 1600000 },
  { id: 'p4', name: '앱 온보딩', status: '진행 중', amount: 2400000 },
];
export const groupColumns = [
  { key: 'name', label: '프로젝트' },
  { key: 'amount', label: '예산', align: 'right', format: (value: unknown) => Number(value).toLocaleString('ko-KR') + '원' },
];
export const groupSummary = { amount: 'sum' } as const;
export function TableGroupsCases({ K }: { K: any }) {
  return <div style={{ padding: 24, width: 560 }}>
    <K.KjunTable ariaLabel="묶은 표" columns={groupColumns} data={groupRows} groupBy="status" summary={groupSummary} responsive="none"
      renderGroupLabel={(value: unknown) => '상태: ' + String(value)} />
  </div>;
}
