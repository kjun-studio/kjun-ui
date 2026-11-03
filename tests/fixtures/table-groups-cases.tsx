import { useLayoutEffect, useState } from 'react';
// Group expansion is independent from row-detail expansion, across every presentation.
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
export const groupConfig = {
  expandedGroups: undefined as unknown[] | undefined, accept: true, expandedRows: [] as (string | number)[],
  responsive: 'none' as 'none' | 'card' | 'list', cardLayout: 'stacked' as 'stacked' | 'rows' | 'tiles',
  groupBy: 'status', data: groupRows, expandable: false,
};
export function TableGroupsCases({ K }: { K: any }) {
  const [config, setConfig] = useState(groupConfig), [changes, setChanges] = useState<unknown[][]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureTableGroups: (next: Partial<typeof groupConfig>) => setConfig(old => ({ ...old, ...next })) }); }, []);
  return <div style={{ padding: 16, maxWidth: 560, boxSizing: 'border-box' }}>
    <K.KjunTable ariaLabel="묶은 표" columns={groupColumns} {...config} summary={groupSummary}
      renderGroupLabel={(value: unknown) => '상태: ' + String(value)} renderExpand={(row: typeof groupRows[number]) => '상세 ' + row.id}
      onExpandedGroupsChange={(values: unknown[]) => {
        setChanges(old => [...old, values]);
        if (config.accept && config.expandedGroups !== undefined) setConfig(old => ({ ...old, expandedGroups: values }));
      }} />
    <output data-testid="group-changes">{JSON.stringify(changes)}</output>
  </div>;
}
