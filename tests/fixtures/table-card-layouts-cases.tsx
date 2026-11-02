// cardLayout (0.19.0): "stacked", "rows" and "tiles" cards, grouped, with a highlight, subtitle and totals. ?layout= picks one.
export const layoutRows = [
  { id: 'p1', team: '디자인', name: '브랜드 웹사이트', owner: '김서연', status: '진행 중', amount: 4800000, progress: 72, due: '09.30' },
  { id: 'p2', team: '디자인', name: '고객센터 개편', owner: '이도윤', status: '검토 대기', amount: 3200000, progress: 45, due: '10.12' },
  { id: 'p3', team: '개발', name: '결제 화면 개선', owner: '박하린', status: '완료', amount: 1600000, progress: 100, due: '09.18' },
];
export const layoutColumns = [
  { key: 'name', label: '프로젝트' },
  { key: 'owner', label: '담당자' },
  { key: 'status', label: '상태', badge: true },
  { key: 'amount', label: '예산', align: 'right', format: (value: unknown) => Number(value).toLocaleString('ko-KR') + '원' },
  { key: 'progress', label: '진행률', align: 'right', format: (value: unknown) => value + '%' },
  { key: 'due', label: '마감' },
];
export const cardLayout = (new URLSearchParams(location.search).get('layout') || 'stacked') as 'stacked' | 'rows' | 'tiles';
export const layoutProps = { ariaLabel: '카드형 표', data: layoutRows, responsive: 'card', groupBy: 'team', cardSubtitle: 'owner', cardHighlight: 'amount',
  cardLayout, summary: { amount: 'sum' }, selectable: true, expandable: true };
export function TableCardLayoutCases({ K }: { K: any }) {
  return <div style={{ padding: 8 }}>
    <K.KjunTable {...layoutProps} columns={layoutColumns} renderExpand={(row: any) => '상세 ' + row.name} onRowClick={() => undefined} />
  </div>;
}
