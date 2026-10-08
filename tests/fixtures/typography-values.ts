import { demoPalettes, demoDomainColors, demoFont } from '../../shared/demo-colors';
export { demoDomainColors, demoFont };
export const palette = (changed = false) => ({ ...demoPalettes.default,
  brand: '#123456', focusRing: changed ? '#007700' : '#ff00ff',
  onBrand: changed ? '#ffffff' : '#aabbcc', onDanger: '#bbccdd', onSuccess: '#ccddee', onWarning: '#112233',
  brandSubtleBg: '#ddeeff', selectedBg: '#eeddee',
});
export function cssPalette(changed = false) {
  for (const [role,value] of Object.entries({ ...palette(changed), ...demoDomainColors }))
    document.documentElement.style.setProperty('--kjun-' + role.replace(/[A-Z]/g,c => '-'+c.toLowerCase()), value);
  document.documentElement.style.setProperty('--kjun-font',demoFont);
  document.body.style.margin = '0';
}

export const summaryItems = [
  { label: '요약 주요 지표', value: 54321, prefix: 'USD', mobileSecondary: false },
  { label: '요약 보조 지표', value: 678, suffix: '개', mobileSecondary: true },
  { label: '요약 텍스트', value: '전체 내역', valueKind: 'text' as const, prefix: '항목', mobileSecondary: true },
];

export const marketProps = {
  columns: [{key:'metric',label:'선택 지표'}],
  metricConfig: {metric:{label:'선택 지표'}},
  storageNamespace: 'typography-market', rows: [], showFooter: false,
};
