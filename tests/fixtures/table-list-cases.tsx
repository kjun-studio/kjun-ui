// responsive="list" (0.18.0): narrow screens show a title over one meta line with the value and badge at the end.
export const listRows = [
  { id: 'p1', name: '브랜드 웹사이트', owner: '김서연', status: '진행 중', amount: 4800000 },
  { id: 'p2', name: '고객센터 개편', owner: '이도윤', status: '검토 대기', amount: 3200000 },
];
export const listColumns = [
  { key: 'name', label: '프로젝트' },
  { key: 'owner', label: '담당자' },
  { key: 'status', label: '상태', badge: true },
  { key: 'amount', label: '예산', align: 'right', format: (value: unknown) => Number(value).toLocaleString('ko-KR') + '원' },
];
export function TableListCases({ K }: { K: any }) {
  return <div style={{ padding: 8 }}>
    <K.KjunTable ariaLabel="목록형 표" columns={listColumns} data={listRows} responsive="list" expandable renderExpand={(row: any) => '상세 ' + row.name} />
  </div>;
}
