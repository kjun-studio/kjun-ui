import { useLayoutEffect, useState } from 'react';
// HeatmapCell (centre, missing), ProgressCell (valueText, ariaLabel, custom colour) and PriceCell (flash, loading) for React and Native.
export function DataCellsCases({ K }: { K: any }) {
  const [c, setConfig] = useState<any>({ price: 84200 });
  useLayoutEffect(() => { Object.assign(window, { configureCases: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const price = (n: number) => Math.round(n).toLocaleString('en-US');
  return <div style={{ padding: 24, width: 720 }}>
    <div data-testid="heat" style={{ display: 'flex', gap: 6 }}>
      {[-4, -1, 0, 2, 6, 10].map(v => <K.KjunHeatmapCell key={v} value={v} min={-5} max={10} center={0} mode="price">{(v > 0 ? '+' : '') + v + '%'}</K.KjunHeatmapCell>)}
    </div>
    <div data-testid="heat-missing" style={{ display: 'flex', gap: 6 }}>
      <K.KjunHeatmapCell value={NaN} min={-1} max={1} />
      <K.KjunHeatmapCell value={null} min={-1} max={1} />
    </div>
    <div data-testid="progress" style={{ width: 320 }}>
      <K.KjunProgressCell value={12} max={20} valueText="12/20건" ariaLabel="B팀 진척" />
      <K.KjunProgressCell value={80} ariaLabel="기준" />
      <K.KjunProgressCell value={80} color="custom" ariaLabel="색 없는 custom" />
      <K.KjunProgressCell value={80} customColor="rgb(1, 2, 3)" ariaLabel="customColor만" />
    </div>
    <div data-testid="price-text"><K.KjunPriceCell value={c.price} formatter={price} flash /></div>
    <div data-testid="price-bg"><K.KjunPriceCell value={c.price} formatter={price} flash="background" /></div>
    <div data-testid="price-loading"><K.KjunPriceCell value={null} /></div>
  </div>;
}
