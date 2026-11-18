// Table review r1: the expanded panel's span, row selection rules, uncontrolled selection, client search and summary labels.
export const reviewRows = [
  { id: 'a', name: '브랜드 웹사이트', owner: '김서연', amount: 3 },
  { id: 'b', name: '고객센터 개편', owner: '이도윤', amount: 5, locked: true },
  { id: 'c', name: '결제 화면 개선', owner: '박하린', amount: 7 },
];
export const reviewColumns = [
  { key: 'name', label: '프로젝트' },
  { key: 'owner', label: '담당자' },
  { key: 'amount', label: '수량', align: 'right' },
];
export const reviewSelectable = (row: any) => !row.locked;
export function TableReviewCases({ K }: { K: any }) {
  return <div style={{ padding: 8, display: 'grid', gap: 24 }}>
    <div data-testid="expanded"><K.KjunTable ariaLabel="펼침 표" columns={reviewColumns} data={reviewRows} expandable expandedRows={['a']} renderExpand={(row: any) => '상세 ' + row.name} responsive="none" /></div>
    <div data-testid="locked"><K.KjunTable ariaLabel="잠금 표" columns={reviewColumns} data={reviewRows} selectable rowSelectable={reviewSelectable} searchable searchMode="client" searchKeys={['name', 'owner']} responsive="none"
      summary={{ name: 'count', amount: 'sum' }} /></div>
    <div data-testid="list"><K.KjunTable ariaLabel="목록 표" columns={reviewColumns} data={reviewRows} responsive="list" selectable onRowClick={() => {}} /></div>
  </div>;
}
