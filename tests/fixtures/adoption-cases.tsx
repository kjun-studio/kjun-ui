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
  </div>;
}
