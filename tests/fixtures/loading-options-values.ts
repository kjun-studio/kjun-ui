// Loading presentation options: spinner instead of skeleton, a delayed loading display, and flat KPI surfaces.
export const columns = [{ key: 'name', label: 'Name', type: 'text' }, { key: 'price', label: 'Price', type: 'price' }];
export const marketProps = {
  columns, metricConfig: { price: { label: 'Price', format: 'price' } }, storageNamespace: 'loading-options',
  primaryLabel: (row: any) => row.name, priceValue: () => 100, changeValue: () => 1, priceFormatter: (value: number) => String(value),
  showActions: false, emitSortOnMount: false, rows: [] as object[],
};
export const texts = {
  delayed: '지연 로딩 안내', table: '표 로딩 안내', marketTable: '시세표 로딩 안내',
  marketCards: '카드 로딩 안내', marketList: '목록 로딩 안내', skeletonTable: '기본 표 안내',
};
export const loadingDelay = 300;
export const kpiRowItems = [{ label: '평가 금액', value: 1200 }, { label: '수익률', value: 3.4, suffix: '%' }];
