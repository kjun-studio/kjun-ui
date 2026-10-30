import { useLayoutEffect, useState } from 'react';
// 0.17.0 platform parity: options one platform had, now on all three (Vue 3 mirrors this in parity-vue3.tsx).
export const parityConfig = { all: false, mixed: true, value: null as number | null, indeterminate: false, max: 100, kpi: null as number | null, loading: true, sticky: true };
export function ParityCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [config, setConfig] = useState(parityConfig);
  const [changes, setChanges] = useState<unknown[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureParity: (next: object) => setConfig(old => ({ ...old, ...next })) }); }, []);
  const progress = (shape: string) => <div data-testid={shape}>
    <K.KjunProgress shape={shape} label="Upload" showLabel value={config.value} max={config.max} indeterminate={config.indeterminate} />
    <K.KjunProgress shape={shape} label="Default zero" />
  </div>;
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, width: 900 }}>
    <div data-testid="checkbox">
      <K.KjunCheckbox label="Select all" value={config.all} indeterminate={config.mixed}
        onValueChange={(value: boolean) => { setChanges(old => [...old, value]); setConfig(old => ({ ...old, all: value, mixed: false })); }} />
      <output data-testid="changes">{JSON.stringify(changes)}</output>
    </div>
    {progress('bar')}
    {progress('circle')}
    <div data-testid="kpi">
      <K.KjunKpiRow items={[
        { label: 'Missing', value: config.kpi, prefix: '$', suffix: '%' },
        { label: 'Invalid', value: Number.NaN, semantic: 'price' },
        { label: 'Custom', value: null, missingText: 'n/a' },
        { label: 'Zero', value: 0 },
        { label: 'Loading', loading: config.loading },
      ]} />
    </div>
    {!native && <div data-testid="scroll" style={{ height: 200, overflow: 'auto', background: 'rgb(240, 240, 240)' }}>
      <div style={{ height: 40 }} />
      <K.KjunTabs value="first" stickyHeader={config.sticky} stickyOffset={12} ariaLabel="Sections">
        <K.KjunTabPane name="first" label="First"><div style={{ height: 600 }}>First panel</div></K.KjunTabPane>
        <K.KjunTabPane name="second" label="Second"><div style={{ height: 600 }}>Second panel</div></K.KjunTabPane>
      </K.KjunTabs>
    </div>}
  </div></K.KjunProvider>;
}
