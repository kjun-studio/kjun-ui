import { useState } from 'react';
import { flushSync } from 'react-dom';
import { tabsConfig } from './tabs-design-data';
export function TabsDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(tabsConfig), [events, setEvents] = useState<string[]>([]);
  Object.assign(window, { configureTabs: (next: object) => flushSync(() => { setConfig(old => ({ ...old, ...next })); setEvents([]); }) });
  return <main style={{ padding: 16 }}>
    <div data-testid="frame" style={{ width: config.width, maxWidth: '100%' }}>
      <K.DsTabs value={config.value} variant={config.variant} density={config.density} items={config.items}
        onValueChange={(value: string) => { setEvents(old => [...old, value]); if (config.accept) setConfig(old => ({ ...old, value })); }}>
        {config.items.map(item => <K.DsTabPane key={item.name} {...item}><div data-testid={'content-' + item.name}>본문 {item.label}</div></K.DsTabPane>)}
      </K.DsTabs>
    </div>
    <output data-testid="value">{config.value}</output><output data-testid="events">{events.join('|')}</output>
  </main>;
}
