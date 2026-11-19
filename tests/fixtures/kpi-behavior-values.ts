// KPI behavior cases, rendered under a de-DE provider: locale digits, deltas that round to zero, missing values, masking,
// percent precision, the app's own delta text and secondary render, value segments, link and button cells.
export const locale = 'de-DE';
export const hero = {
  label: '총액', value: 1234567.5, decimals: 1, suffix: '원', animated: false,
  deltaAbsolute: 0.04, deltaPercent: 0.04, deltaDescription: '전일 대비', deltaIcon: true,
  secondary: [{ label: '결측', value: NaN }, { label: '설명', value: 5, desc: '앱 색', descClass: 'app-desc' }],
};
export const missing = { label: '미집계', value: null, missingText: '집계 중', animated: false };
export const masked = { label: '가린 금액', value: 1000, suffix: '원', animated: false, masked: true, deltaAbsolute: 50, deltaPercent: 2, deltaDescription: '기준',
  secondary: [{ label: '가린 보조', value: 77, suffix: '원' }] };
export const precise = { label: '금리', value: 3.5, decimals: 2, animated: false, deltaPercent: 0.04, deltaPercentDecimals: 2 };
export const formatted = { label: '맞춤', value: 1, animated: false, deltaPercent: 2, secondary: [{ label: '맞춤 보조', value: 1 }] };
export const deltaFormatter = (value: number, kind: 'absolute' | 'percent') => (kind === 'percent' ? value + 'pt' : String(value));
export const items = [
  { label: '링크', value: 10, href: '#kpi-link' },
  { label: '버튼', value: 3, clickable: true },
  { label: '진행', valueSegments: [{ text: '3', label: '완료' }, { text: '/', separator: true }, { text: '5' }] },
];
export const maskedItems = [
  { label: '잔액', value: 1000, suffix: '원' },
  { label: '상태', value: '정상', valueKind: 'text' as const },
];
declare global { interface Window { kpiClicks: string[] } }
window.kpiClicks = [];
export const record = (item: { label?: string }) => { window.kpiClicks.push(item.label ?? ''); };
// Three display numbers in a 480px column of a wide page: each cell steps down by its own width, never splitting digits.
export const narrowItems = [
  { label: '방문자', value: 12480, suffix: '명' },
  { label: '전환율', value: 3.4, decimals: 1, suffix: '%' },
  { label: '매출', value: 4820000, suffix: '원' },
];
// A label aside in a clickable cell: its own clicks never open the cell.
export const asideItems = [{ label: '방문', value: 7, clickable: true }, { label: '이탈', value: 2 }];
export const asideHero = { label: '총 평가 금액', value: 1000, suffix: '원', animated: false };
// The phone grid: a full first cell, two side by side, and a last cell alone that takes the whole line.
export const gridItems = [
  { label: '헤드', value: 1, mobileFull: true },
  { label: '왼쪽', value: 2 },
  { label: '오른쪽', value: 3 },
  { label: '혼자', value: 4 },
];
