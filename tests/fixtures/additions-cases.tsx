import { useState } from 'react';
// 0.13.0 additions on React and Native (Vue 3 mirrors this in additions-vue3.tsx). One section per feature.
export const thumbColor = 'rgb(1, 2, 3)';

function DateClear({ K }: { K: any }) {
  const [value, setValue] = useState('2026-10-23');
  return <K.KjunDatePicker value={value} clearable onValueChange={setValue} />;
}

export function AdditionCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const themed = native
    ? <K.KjunProvider {...providerProps} colors={{ ...providerProps.colors, switchThumbOn: thumbColor }}><K.KjunSwitch value label="Themed thumb" onChange={() => {}} /></K.KjunProvider>
    : <div style={{ ['--kjun-switch-thumb-on' as string]: thumbColor }}><K.KjunProvider><K.KjunSwitch value label="Themed thumb" onChange={() => {}} /></K.KjunProvider></div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
    <div data-testid="switch-thumb">
      {themed}
      <K.KjunProvider {...providerProps}><K.KjunSwitch value label="Default thumb" onChange={() => {}} /></K.KjunProvider>
    </div>
    <K.KjunProvider {...providerProps}>
    <div data-testid="badge-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 40 }}>
      <K.KjunBadge>Row badge</K.KjunBadge>
    </div>
    <div data-testid="badge-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 300 }}>
      <K.KjunBadge>Column badge</K.KjunBadge>
    </div>
    <div data-testid="switch-description"><K.KjunSwitch value label="Alerts" description="Sent once a day" onValueChange={() => {}} /></div>
    <div data-testid="date-clear"><DateClear K={K} /></div>
    <div data-testid="button-group">
      <K.KjunButtonGroup value="a" options={[{ value: 'a', label: 'Mine' }, { value: 'b', label: 'Ours' }]} onValueChange={() => {}} />
    </div>
    </K.KjunProvider>
  </div>;
}
