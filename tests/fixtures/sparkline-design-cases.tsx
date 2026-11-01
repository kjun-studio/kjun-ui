// Sparkline (0.18.0): flat series centred, gaps broken, empty dotted, end dot, baseline and fixed range, bar variant,
// stretched dots, negative bars and a market column with a baseline field and a shared range.
export const sparkCases: [string, Record<string, unknown>][] = [
  ['flat', { data: [5, 5, 5, 5] }],
  ['gaps', { data: [3, 4, NaN, NaN, 6, 5, 7] }],
  ['empty', { data: [] }],
  ['baseline', { data: [101, 99, 98], baseline: 100 }],
  ['range', { data: [100, 100.4], baseline: 100, min: 98, max: 102 }],
  ['bars', { data: [2, 4, 3, 8], variant: 'bar' }],
  ['stretch', { data: [1, 3, NaN, 2, NaN, 4, 5], stretch: true }],
  ['negative', { data: [-5, 3], variant: 'bar' }],
];
export const marketRows = [{ id: 1, name: '가', trend: [1, 2, 3], prev: 2 }, { id: 2, name: '나', trend: [-4, -2, 6], prev: 0 }];
export const marketColumns = [{ key: 'name', label: '종목' }, { key: 'trend', label: '추이', type: 'sparkline', baselineKey: 'prev', sharedRange: true }];
export const caseWidth = (id: string) => id === 'stretch' ? 240 : 72;
export function SparklineDesignCases({ K }: { K: any }) {
  return <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {sparkCases.map(([id, props]) => <div key={id} data-testid={id} style={{ width: caseWidth(id) }}><K.KjunSparkline ariaLabel={id} {...props} /></div>)}
    <div data-testid="market"><K.KjunMarketTable rows={marketRows} columns={marketColumns} hasLoadedOnce showActions={false} /></div>
  </div>;
}
