import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { navigationConfig, navigationItems, pageRows, setupNavigationColors } from './bottom-navigation-design-data';
setupNavigationColors();
const s = reactive({ config: { ...navigationConfig } as typeof navigationConfig, events: [] as string[] });
Object.assign(window, { configureNavigation: (next: object) => { s.config = { ...s.config, ...next }; s.events = []; } });
// The same destinations drive both navigation components.
createApp(defineComponent(() => () => { const Navigation = s.config.floating ? K.KjunFloatingNavigation : K.KjunBottomNavigation; return <K.KjunProvider safeArea={{ bottom: s.config.safeAreaBottom }}><main style={{ padding: s.config.sticky ? '16px 16px 0' : '16px', ...(s.config.floating ? { display: 'flex', flexDirection: 'column' } : {}) }}>
  {pageRows(s.config.page).map(row => <div key={row} data-testid="page-row" style={{ height: '120px' }}>{row}</div>)}
  {s.config.sticky && <output data-testid="events">{s.events.join('|')}</output>}
  <Navigation value={s.config.value} sticky={s.config.sticky} keyboardVisible={s.config.keyboardVisible} {...(s.config.floating ? {} : { iconStyle: s.config.iconStyle, showLabels: s.config.showLabels, surface: s.config.surface })}
    hideOnKeyboard={s.config.hideOnKeyboard} items={navigationItems(s.config)} onNavigate={(key: string, event: MouseEvent) => {
    event.preventDefault(); s.events.push(key);
    if (s.config.acceptNavigation) s.config = { ...s.config, value: key };
  }} onReselect={(key: string) => { s.events.push('re:' + key); }} />
  {!s.config.sticky && <output data-testid="events">{s.events.join('|')}</output>}
</main></K.KjunProvider>; })).mount('#root');
