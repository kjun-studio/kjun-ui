import { useLayoutEffect, useState } from 'react';
import { navigationConfig, navigationItems } from './bottom-navigation-design-data';
export function NavigationDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(navigationConfig), [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureNavigation: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  // The same destinations drive both navigation components.
  const Navigation = config.floating ? K.KjunFloatingNavigation : K.KjunBottomNavigation;
  // A floating capsule centres itself in a flex column, as in an app screen.
  return <K.KjunProvider safeArea={{ bottom: config.safeAreaBottom }}><main style={{ padding: 16, ...(config.floating ? { display: 'flex', flexDirection: 'column' } : {}) }}>
    <Navigation {...{ ...config, safeAreaBottom: undefined }} items={navigationItems(config)} onNavigate={(key: string, event: any) => {
      event.preventDefault(); setEvents(old => [...old, key]);
      if (config.acceptNavigation) setConfig(old => ({ ...old, value: key }));
    }} onReselect={(key: string) => setEvents(old => [...old, 're:' + key])} />
    <output data-testid="events">{events.join('|')}</output>
  </main></K.KjunProvider>;
}
