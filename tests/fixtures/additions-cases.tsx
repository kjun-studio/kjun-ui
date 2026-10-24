// 0.13.0 additions on React and Native (Vue 3 mirrors this in additions-vue3.tsx). One section per feature.
export const thumbColor = 'rgb(1, 2, 3)';

export function AdditionCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const themed = native
    ? <K.KjunProvider {...providerProps} colors={{ ...providerProps.colors, switchThumbOn: thumbColor }}><K.KjunSwitch value label="Themed thumb" onChange={() => {}} /></K.KjunProvider>
    : <div style={{ ['--kjun-switch-thumb-on' as string]: thumbColor }}><K.KjunProvider><K.KjunSwitch value label="Themed thumb" onChange={() => {}} /></K.KjunProvider></div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
    <div data-testid="switch-thumb">
      {themed}
      <K.KjunProvider {...providerProps}><K.KjunSwitch value label="Default thumb" onChange={() => {}} /></K.KjunProvider>
    </div>
  </div>;
}
