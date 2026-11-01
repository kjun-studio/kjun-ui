import { useState } from 'react';
// 0.18.0: Breadcrumb links a last item that has `to`; ScrollFade fades vertically (Vue 3 mirrors this in trail-vue3.tsx).
export const trailRows = Array.from({ length: 12 }, (_, i) => `Row ${i + 1}`);
export function TrailCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [visited, setVisited] = useState<string[]>([]);
  const nav = native ? { onNavigate: (item: { label: string }) => setVisited(old => [...old, item.label]) } : {};
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, width: 600 }}>
    <div data-testid="ancestors"><K.KjunBreadcrumb ariaLabel="Ancestors" items={[{ label: 'Notes', to: '#notes' }, { label: 'Work', to: '#work' }]} {...nav} /></div>
    <div data-testid="current"><K.KjunBreadcrumb ariaLabel="Current" items={[{ label: 'Notes', to: '#notes' }, { label: 'Minutes' }]} {...nav} /></div>
    <output data-testid="visited">{JSON.stringify(visited)}</output>
    <div data-testid="vertical"><K.KjunScrollFade direction="vertical" style={{ maxHeight: 120 }}>
      {trailRows.map(row => native ? <K.KjunText key={row}>{row}</K.KjunText> : <div key={row} style={{ height: 30 }}>{row}</div>)}
    </K.KjunScrollFade></div>
  </div></K.KjunProvider>;
}
