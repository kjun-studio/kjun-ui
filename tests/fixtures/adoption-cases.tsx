// 0.14.0 adoption additions on React and Native (Vue 3 mirrors this in adoption-vue3.tsx). One section per feature.
export function AdoptionCases({ K, native = false, providerProps = {}, feedback, openFromFunction }: { K: any; native?: boolean; providerProps?: Record<string, any>; feedback: any; openFromFunction: () => void }) {
  const press = (handler: () => void) => native ? { onPress: handler } : { onClick: handler };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
    <div data-testid="external-feedback"><K.KjunProvider {...providerProps}><K.KjunFeedbackProvider controller={feedback}>
      <K.KjunButton {...press(openFromFunction)}>open from function</K.KjunButton>
    </K.KjunFeedbackProvider></K.KjunProvider></div>
  </div>;
}
