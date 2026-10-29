// 0.17.0 fixes and additions on React and Native (Vue 3 mirrors this in surfaces-vue3.tsx). One section per feature.
export function SurfacesCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const tabs = [{ value: 'wish', label: 'Wishlist 3' }, { value: 'done', label: 'Achieved 1' }];
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, width: 360, background: 'rgb(240, 240, 240)' }}>
    <div data-testid="bars"><K.KjunProvider {...providerProps}>
      <K.KjunTopNavigation title="Plain header" surface={false} />
      <K.KjunTopNavigation title="Card header" />
      <K.KjunBottomNavigation ariaLabel="Plain tabs" surface={false} value="home" items={[{ key: 'home', label: 'Plain home', href: '#home' }]} />
      <K.KjunBottomActionBar description="Plain actions" surface={false}><K.KjunButton>Save</K.KjunButton></K.KjunBottomActionBar>
    </K.KjunProvider></div>
    <div data-testid="avatars"><K.KjunProvider {...providerProps}>
      <K.KjunAvatar name="Xavier" size="xs" />
      <K.KjunAvatar name="Lee" size="xl" />
      <K.KjunAvatar size="xl" />
    </K.KjunProvider></div>
    {native && <div data-testid="group-fonts">
      {/* The unselected weight (500) is drawn with a wide face and the selected weight with a narrow one. */}
      <K.KjunProvider {...providerProps} fontFamily={{ 400: 'serif', 500: 'monospace', 600: 'serif', 700: 'serif' }}>
        <K.KjunButtonGroup ariaLabel="Goals" value="wish" options={tabs} fullWidth />
        <K.KjunFilterGroup ariaLabel="Goal filter" value="wish" options={tabs} />
      </K.KjunProvider>
    </div>}
  </div>;
}
