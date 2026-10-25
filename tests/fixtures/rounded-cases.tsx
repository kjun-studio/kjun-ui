import { useState } from 'react';
// 0.16.0 adopter requests on React and Native (Vue 3 mirrors this in rounded-vue3.tsx). One section per feature.
export function RoundedCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [tip, setTip] = useState<string | null>(null);
  const press = (handler: () => void) => native ? { onPress: handler } : { onClick: handler };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, width: 420 }}>
    <div data-testid="cards"><K.KjunProvider {...providerProps}>
      <K.KjunCard radius="xl" title="XL card"><K.KjunText>XL body</K.KjunText></K.KjunCard>
      <K.KjunCard radius="lg" title="LG card"><K.KjunText>LG body</K.KjunText></K.KjunCard>
    </K.KjunProvider></div>
    <div data-testid="lists"><K.KjunProvider {...providerProps}>
      <K.KjunText>Lists start</K.KjunText>
      <K.KjunListSection title="Rounded" radius="xl">
        <K.KjunListRow title="First row" {...(native ? { onPress: () => {} } : { onClick: () => {} })} />
        <K.KjunListRow title="Second row" />
      </K.KjunListSection>
      <K.KjunListSection title="Square">
        <K.KjunListRow title="Square row" {...(native ? { onPress: () => {} } : { onClick: () => {} })} />
      </K.KjunListSection>
    </K.KjunProvider></div>
    <div data-testid="tooltips" style={{ paddingTop: 120 }}><K.KjunProvider {...providerProps}>
      <K.KjunButton {...press(() => setTip('path'))}>show path</K.KjunButton>
      <K.KjunButton {...press(() => setTip('title'))}>show title</K.KjunButton>
      <K.KjunButton {...press(() => setTip('empty'))}>show empty</K.KjunButton>
      <K.KjunTooltip open={tip === 'path'} title="File path" content='/Users/me/projects/kjun/packages/react/src/components/very-long-file-name.tsx' width="sm" align="center"><K.KjunButton>Path trigger</K.KjunButton></K.KjunTooltip>
      <K.KjunTooltip open={tip === 'title'} title="Only title"><K.KjunButton>Title trigger</K.KjunButton></K.KjunTooltip>
      <K.KjunTooltip open={tip === 'empty'}><K.KjunButton>Empty trigger</K.KjunButton></K.KjunTooltip>
    </K.KjunProvider></div>
    <div data-testid="filters">
      <K.KjunProvider {...providerProps}>
        <K.KjunFilterGroup ariaLabel="Default filters" value="all" options={[{ value: 'all', label: 'All' }, { value: 'up', label: 'Up' }]} />
      </K.KjunProvider>
      <div style={{ ['--kjun-filter-selected-bg' as string]: 'rgb(10, 20, 200)', ['--kjun-filter-selected-text' as string]: 'rgb(250, 250, 10)' }}>
        <K.KjunProvider {...providerProps} {...(native ? { colors: { ...providerProps.colors, filterSelectedBg: 'rgb(10, 20, 200)', filterSelectedText: 'rgb(250, 250, 10)' } } : {})}>
          <K.KjunFilterGroup ariaLabel="Brand filters" value="all" options={[{ value: 'all', label: 'Every' }, { value: 'up', label: 'Rising' }]} />
        </K.KjunProvider>
      </div>
    </div>
  </div>;
}
