import { useLayoutEffect, useState } from 'react';
import { navigationConfig, navigationItems } from './bottom-navigation-design-data';
export function NavigationDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(navigationConfig), [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureNavigation: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  return <main style={{ padding: 16 }}>
    <K.DsBottomNavigation {...config} items={navigationItems(config)} onNavigate={(key: string, event: any) => {
      event.preventDefault(); setEvents(old => [...old, key]);
      if (config.acceptNavigation) setConfig(old => ({ ...old, value: key }));
    }} />
    <output data-testid="events">{events.join('|')}</output>
  </main>;
}
