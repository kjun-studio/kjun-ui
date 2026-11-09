// The KPI design review cases: a hero with a direction caret, a percent chip, an English secondary label and an aside,
// the same hero with its aside hidden on narrow screens, and a row with a text value, a label badge and a clickable cell.
export const hero = {
  label: '총 평가 금액', value: 123456789, suffix: '원', animated: false,
  deltaAbsolute: 2345678, deltaPercent: 1.9, deltaDescription: '전일 대비', deltaIcon: true,
  secondary: [{ label: 'Cash balance', value: 1250000, suffix: '원' }],
};
export const hidden = { label: '숨김 요약', value: 1000, suffix: '원', animated: false, asideMobile: 'hidden' as const };
export const items = [
  { label: '평가 금액', value: 1234567, suffix: '원' },
  { label: '수익률', value: 2.35, decimals: 2, suffix: '%', semantic: 'price' as const, clickable: true },
  { label: '상태', value: '정상', valueKind: 'text' as const, badge: { text: '연결', variant: 'success' as const } },
];
