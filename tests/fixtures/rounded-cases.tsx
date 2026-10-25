// 0.16.0 adopter requests on React and Native (Vue 3 mirrors this in rounded-vue3.tsx). One section per feature.
export function RoundedCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
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
  </div>;
}
