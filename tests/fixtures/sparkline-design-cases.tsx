// Sparkline (0.18.0): flat series centred, gaps broken, empty dotted, end dot, baseline and fixed range, bar variant.
export const sparkCases: [string, Record<string, unknown>][] = [
  ['flat', { data: [5, 5, 5, 5] }],
  ['gaps', { data: [3, 4, NaN, NaN, 6, 5, 7] }],
  ['empty', { data: [] }],
  ['baseline', { data: [101, 99, 98], baseline: 100 }],
  ['range', { data: [100, 100.4], baseline: 100, min: 98, max: 102 }],
  ['bars', { data: [2, 4, 3, 8], variant: 'bar' }],
];
export function SparklineDesignCases({ K }: { K: any }) {
  return <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {sparkCases.map(([id, props]) => <div key={id} data-testid={id} style={{ width: 72 }}><K.KjunSparkline ariaLabel={id} {...props} /></div>)}
  </div>;
}
