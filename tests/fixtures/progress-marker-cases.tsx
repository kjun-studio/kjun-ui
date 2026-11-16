import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
export { applyDemoColors, demoFont, demoPalettes };

// One page for every platform; `K` is the platform package and `Box` its block element.
export function ProgressMarkerCases({ K, Box }: { K: any; Box: any }) {
  const row = (id: string, node: unknown) => <Box data-testid={id} testID={id} style={{ marginBottom: 20 }}>{node}</Box>;
  return <Box style={{ padding: 24, width: 400 }}>
    {row('budget', <K.KjunProgress value={62} marker={53} markerLabel="오늘 기준 53%" label="식비" subLabel="오늘 기준 53%" />)}
    {row('scaled', <K.KjunProgress value={60000} max={200000} marker={106000} size="sm" />)}
    {row('start', <K.KjunProgress value={40} marker={0} size="lg" />)}
    {row('end', <K.KjunProgress value={40} marker={500} />)}
    {row('none', <K.KjunProgress value={40} />)}
    {row('busy', <K.KjunProgress indeterminate marker={53} />)}
    {row('circle', <K.KjunProgress value={40} marker={53} shape="circle" />)}
    {row('cell', <K.KjunProgressCell value={62} marker={53} markerLabel="오늘 기준 53%" />)}
    {row('cell-none', <K.KjunProgressCell value={62} />)}
  </Box>;
}
