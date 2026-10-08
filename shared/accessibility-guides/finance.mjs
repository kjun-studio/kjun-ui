export default [
  ['DsCollectionMark', 'decorative', 'kind active', '즐겨찾기·관심 상태의 장식 마크: 의미는 부모의 텍스트로 제공', {}],
  ['DsDeviation', 'text', 'value', '편차의 부호와 수치 텍스트', { text: '1.25' }],
  ['DsExecutionStatusBadge', 'text', 'status label', '실행 상태의 텍스트 배지', { text: '대기' }],
  ['DsFreshness', 'text', 'stale source', '오래된 데이터의 기준 시점 설명', { text: '종가' }],
  ['DsMarketCards', 'market', 'rows sortKey', '시세 카드의 정렬 선택과 행 컨트롤', {}],
  ['DsMarketListPanel', 'market', '', '패널에 공급한 필터와 시세 목록', { children: true }],
  ['DsMarketSimpleList', 'market', 'rows', '시세 목록의 행 실행과 페이지 컨트롤', {}],
  ['DsMarketTable', 'market', 'rows showActions', '시세 표의 정렬·관심·즐겨찾기 컨트롤', {}],
  ['DsMarketTableSkeleton', 'decorative', 'rows columns', '시세 표의 비대화형 로딩 자리표시자', {}],
  ['DsPriceCell', 'text', 'value formatter', '가격 수치와 단위', { text: '1,234,567' }],
  ['DsSignedValue', 'text', 'value format showSign', '등락률의 부호·수치·단위', { text: '1.25' }],
];
