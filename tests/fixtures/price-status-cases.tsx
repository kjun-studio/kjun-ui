// Price status slot: the app's KjunBadge after a price cell, before a list row's change and after a table's price.
export const statusRows = [
  { id: 'a', name: '한빛테크', symbol: 'AAA', price: 71200, change: 1.21 },
  { id: 'b', name: '새봄에너지', symbol: 'BBB', price: 182500, change: -0.82, stale: true },
  { id: 'c', name: '푸른바이오', symbol: 'CCC', price: 201000, change: 0 },
];
export const statusColumns = [
  { key: 'name', label: '종목' },
  { key: 'price', label: '현재가', type: 'price', align: 'right' },
  { key: 'change', label: '등락률', type: 'percent', align: 'right' },
];
export const won = (value: number) => value.toLocaleString('ko-KR') + '원';
export function PriceStatusCases({ K }: { K: any }) {
  const badge = (row: any) => row.stale ? <K.KjunBadge variant="warning" size="xs">지연</K.KjunBadge> : null;
  return <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, width: 420 }}>
    <div data-testid="cell"><K.KjunPriceCell value={182500} formatter={won} status={<K.KjunBadge variant="secondary" size="xs">종가</K.KjunBadge>} /></div>
    <div data-testid="bare"><K.KjunPriceCell value={42350} formatter={won} stale /></div>
    <div data-testid="list"><K.KjunMarketSimpleList rows={statusRows} hasLoadedOnce priceValue={(r: any) => r.price} changeValue={(r: any) => r.change}
      priceFormatter={won} primaryLabel={(r: any) => r.name} subMeta={(r: any) => r.symbol} showFooter={false} renderStatus={badge} /></div>
    <div data-testid="table"><K.KjunMarketTable rows={statusRows} columns={statusColumns} hasLoadedOnce priceFormatter={won}
      primaryLabel={(r: any) => r.name} showFooter={false} renderStatus={badge} /></div>
  </div>;
}
