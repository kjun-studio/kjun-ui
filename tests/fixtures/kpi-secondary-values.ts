// Four secondary metrics with realistic widths: a currency amount, two percents and a count.
export const secondary = [
  { label: '평가 손익', value: 1234567, prefix: '₩' }, { label: '수익률', value: 12.34, suffix: '%' },
  { label: '보유 종목', value: 128, suffix: '개' }, { label: '현금 비중', value: 34.5, suffix: '%' },
];
export const hero = { label: '총 평가 금액', value: 123456789, prefix: '₩', secondary, animated: false };
