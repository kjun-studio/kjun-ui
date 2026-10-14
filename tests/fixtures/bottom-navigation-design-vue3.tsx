import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { navigationConfig, navigationItems, setupNavigationColors } from './bottom-navigation-design-data';
setupNavigationColors();
const s = reactive({ config: { ...navigationConfig } as typeof navigationConfig, events: [] as string[] });
Object.assign(window, { configureNavigation: (next: object) => { s.config = { ...s.config, ...next }; s.events = []; } });
createApp(defineComponent(() => () => <K.KjunProvider><main style={{ padding: '16px' }}>
  <K.KjunBottomNavigation value={s.config.value} safeAreaBottom={s.config.safeAreaBottom} keyboardVisible={s.config.keyboardVisible}
    hideOnKeyboard={s.config.hideOnKeyboard} items={navigationItems(s.config)} onNavigate={(key: string, event: MouseEvent) => {
    event.preventDefault(); s.events.push(key);
    if (s.config.acceptNavigation) s.config = { ...s.config, value: key };
  }} />
  <output data-testid="events">{s.events.join('|')}</output>
</main></K.KjunProvider>)).mount('#root');
