import { useState } from 'react';
// 0.13.0 additions on React and Native (Vue 3 mirrors this in additions-vue3.tsx). One section per feature.
export const thumbColor = 'rgb(1, 2, 3)';
export const trackColor = 'rgb(128, 128, 128)';

function DateClear({ K }: { K: any }) {
  const [value, setValue] = useState('2026-10-23');
  return <K.KjunDatePicker value={value} clearable onValueChange={setValue} />;
}

// A switch that is saving: presses change nothing until it ends.
function SavingSwitch({ K }: { K: any }) {
  const [value, setValue] = useState(false), [presses, setPresses] = useState(0);
  return <><K.KjunSwitch value={value} label="Sync" loading onValueChange={(next: boolean) => { setValue(next); setPresses(n => n + 1); }} /><output data-testid="saving-presses">{presses}</output></>;
}

export function AdditionCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const themed = native
    ? <K.KjunProvider {...providerProps} colors={{ ...providerProps.colors, switchThumbOn: thumbColor }}><K.KjunSwitch value label="Themed thumb" onChange={() => {}} /></K.KjunProvider>
    : <div style={{ ['--kjun-switch-thumb-on' as string]: thumbColor }}><K.KjunProvider><K.KjunSwitch value label="Themed thumb" onChange={() => {}} /></K.KjunProvider></div>;
  const track = native
    ? <K.KjunProvider {...providerProps} colors={{ ...providerProps.colors, switchTrack: trackColor }}><K.KjunSwitch value={false} label="Track" onChange={() => {}} /></K.KjunProvider>
    : <div style={{ ['--kjun-switch-track' as string]: trackColor }}><K.KjunProvider><K.KjunSwitch value={false} label="Track" onChange={() => {}} /></K.KjunProvider></div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
    <div data-testid="switch-track">{track}</div>
    <div data-testid="switch-thumb">
      {themed}
      <K.KjunProvider {...providerProps}><K.KjunSwitch value label="Default thumb" onChange={() => {}} /></K.KjunProvider>
    </div>
    <K.KjunProvider {...providerProps}>
    <div data-testid="badge-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 40 }}>
      <K.KjunBadge>Row badge</K.KjunBadge>
    </div>
    <div data-testid="badge-row-default" style={{ display: 'flex', flexDirection: 'row', height: 40 }}>
      <K.KjunBadge>Default row badge</K.KjunBadge>
    </div>
    <div data-testid="badge-column-end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 300 }}>
      <K.KjunBadge style={{ alignSelf: 'flex-end' }}>End badge</K.KjunBadge>
    </div>
    <div data-testid="badge-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 300 }}>
      <K.KjunBadge>Column badge</K.KjunBadge>
    </div>
    <div data-testid="badge-sizes" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      {['xs', 'sm', 'md', 'lg', 'xl'].map(size => <K.KjunBadge key={size} size={size} variant="success" dot>{'Badge ' + size}</K.KjunBadge>)}
    </div>
    <div data-testid="switch-description"><K.KjunSwitch value label="Alerts" description="Sent once a day" onValueChange={() => {}} /></div>
    <div data-testid="switch-saving"><SavingSwitch K={K} /></div>
    <div data-testid="badge-count" style={{ display: 'flex', gap: 8 }}>
      <K.KjunBadge count={0} variant="danger">zero</K.KjunBadge>
      <K.KjunBadge count={120} variant="danger" label="읽지 않은 알림 120개" />
      <K.KjunBadge dot label="새 소식" />
    </div>
    <div data-testid="date-clear"><DateClear K={K} /></div>
    <div data-testid="button-group">
      <K.KjunButtonGroup value="a" options={[{ value: 'a', label: 'Mine' }, { value: 'b', label: 'Ours' }]} onValueChange={() => {}} />
    </div>
    </K.KjunProvider>
    <K.KjunProvider {...providerProps}><div data-testid="circle-buttons" style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <K.KjunButton shape="circle" size="sm" prefixIcon="plus" ariaLabel="Add sm" />
      <K.KjunButton shape="circle" size="md" prefixIcon="plus" ariaLabel="Add md" />
    </div></K.KjunProvider>
    <K.KjunProvider {...providerProps}><div data-testid="compact-list">
      <K.KjunListSection ariaLabel="Upcoming" divider={false} density="compact">
        <K.KjunListRow title="Trip" />
        <K.KjunListRow title="Dinner" />
      </K.KjunListSection>
    </div></K.KjunProvider>
    <K.KjunProvider {...providerProps}><div data-testid="icon-list">
      <K.KjunListSection title="Settings">
        <K.KjunListRow icon="bell" title="Alerts" description="Push and email" />
        <K.KjunListRow leading={<K.KjunAvatar name="Kim" size="sm" />} title="Kim" description="kim@example.com" />
        <K.KjunListRow title="Sign out" />
      </K.KjunListSection>
    </div></K.KjunProvider>
    <K.KjunProvider {...providerProps}><div data-testid="link-button" style={{ display: 'flex', flexDirection: 'row' }}>
      <K.KjunButton variant="link" {...(native ? { onPress: () => {} } : { onClick: () => {} })}>More</K.KjunButton>
    </div></K.KjunProvider>
    <div data-testid="fab-area" style={{ position: 'relative', height: 200, width: 300 }}>
      <K.KjunProvider {...providerProps} {...(native ? { style: { height: 200 } } : {})}>
        <K.KjunFab icon="plus" ariaLabel="Add schedule" safeAreaBottom={20} {...(native ? { onPress: () => {} } : { onClick: () => {} })} />
      </K.KjunProvider>
    </div>
    {native && <div data-testid="font-weights"><K.KjunProvider {...providerProps} fontFamily={{ 400: 'Face-Regular', 500: 'Face-Medium', 700: 'Face-Bold' }}>
      <K.KjunText>Body text</K.KjunText>
      <K.KjunText variant="label">Label text</K.KjunText>
      <K.KjunButton onPress={() => {}}>Control text</K.KjunButton>
      <K.KjunFormGroup label="Field label"><K.KjunInput value="Typed" onChangeText={() => {}} /></K.KjunFormGroup>
    </K.KjunProvider>
    <K.KjunProvider {...providerProps} fontFamily={{ 400: 'Face-Regular', 700: 'Face-Bold' }} numericFontFamily={{ 400: 'Num-Regular', 700: 'Num-Bold' }}>
      <K.KjunAnimatedNumber value={42} prefix="USD" animated={false} />
    </K.KjunProvider></div>}
    <div data-testid="optional-ko"><K.KjunProvider {...providerProps}><K.KjunFormGroup label="Nickname" optional><K.KjunInput value="" onValueChange={() => {}} /></K.KjunFormGroup></K.KjunProvider></div>
    <div data-testid="optional-en"><K.KjunProvider {...providerProps} locale="en-US"><K.KjunFormGroup label="Nickname" optional><K.KjunInput value="" onValueChange={() => {}} /></K.KjunFormGroup></K.KjunProvider></div>
  </div>;
}
