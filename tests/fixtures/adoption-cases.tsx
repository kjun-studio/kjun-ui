import { useState } from 'react';
// 0.14.0 adoption additions on React and Native (Vue 3 mirrors this in adoption-vue3.tsx). One section per feature.
export function AdoptionCases({ K, native = false, providerProps = {}, feedback, openFromFunction }: { K: any; native?: boolean; providerProps?: Record<string, any>; feedback: any; openFromFunction: () => void }) {
  const press = (handler: () => void) => native ? { onPress: handler } : { onClick: handler };
  const [presses, setPresses] = useState(0);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
    <div data-testid="external-feedback"><K.KjunProvider {...providerProps}><K.KjunFeedbackProvider controller={feedback}>
      <K.KjunButton {...press(openFromFunction)}>open from function</K.KjunButton>
    </K.KjunFeedbackProvider></K.KjunProvider></div>
    <div data-testid="cards"><K.KjunProvider {...providerProps}>
      <K.KjunCard pressable title="Question card" {...press(() => setPresses(n => n + 1))}><K.KjunText>Today's question</K.KjunText></K.KjunCard>
      {!native && <K.KjunCard title="Plain card" onClick={() => {}}><K.KjunText>Plain body</K.KjunText></K.KjunCard>}
      <K.KjunCard pressable disabled title="Disabled card" {...press(() => setPresses(n => n + 1))}><K.KjunText>Disabled body</K.KjunText></K.KjunCard>
      <K.KjunText>{'presses ' + presses}</K.KjunText>
    </K.KjunProvider></div>
    <div data-testid="tones"><K.KjunProvider {...providerProps}>
      {['brand', 'danger', 'success', 'warning', 'inverse'].map(tone => <K.KjunText key={tone} tone={tone}>{'tone ' + tone}</K.KjunText>)}
    </K.KjunProvider></div>
    <div data-testid="settings-list"><K.KjunProvider {...providerProps}>
      <K.KjunListSection ariaLabel="Settings" surface={false}>
        <K.KjunListRow title="Profile" chevron {...press(() => {})} />
        <K.KjunListItem><K.KjunText>Theme switcher</K.KjunText></K.KjunListItem>
        <K.KjunListRow title="Delete account" destructive {...press(() => {})} />
      </K.KjunListSection>
    </K.KjunProvider></div>
    <div data-testid="avatars"><K.KjunProvider {...providerProps}>
      <K.KjunAvatar name="Kim" color="rgb(10, 20, 30)" textColor="rgb(250, 240, 230)" />
      <K.KjunAvatar color="rgb(10, 20, 30)" textColor="rgb(250, 240, 230)" />
    </K.KjunProvider></div>
    <div data-testid="circle-progress"><K.KjunProvider {...providerProps}>
      <K.KjunProgress shape="circle" value={40} showLabel label="Weekly goal" subLabel="4 of 10" />
      <K.KjunProgress shape="circle" size="sm" value={70} showLabel label="Small goal" />
    </K.KjunProvider></div>
    <div data-testid="alignment"><K.KjunProvider {...providerProps}>
      <div data-testid="align-center"><K.KjunStack align="center">
        <K.KjunButton {...press(() => {})}>Centered</K.KjunButton>
        <K.KjunBadge>Centered badge</K.KjunBadge>
      </K.KjunStack></div>
      <div data-testid="align-default"><K.KjunStack>
        <K.KjunButton {...press(() => {})}>Default</K.KjunButton>
      </K.KjunStack></div>
      <div data-testid="align-end"><K.KjunInline align="end">
        <K.KjunProgress shape="circle" size="lg" value={10} label="Tall" />
        <K.KjunButton {...press(() => {})}>Bottom</K.KjunButton>
      </K.KjunInline></div>
    </K.KjunProvider></div>
  </div>;
}
