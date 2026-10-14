import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setupTabsColors, tabsConfig } from './tabs-design-data';
setupTabsColors();
const s = reactive({ config: tabsConfig() as any, events: [] as string[] });
Object.assign(window, { configureTabs: (next: object) => { s.config = { ...s.config, ...next }; s.events = []; } });
createApp(defineComponent(() => () => {
  const config = s.config;
  return <K.KjunProvider><main style={{ padding: '16px' }}>
    <div data-testid="frame" style={{ width: typeof config.width === 'number' ? config.width + 'px' : config.width, maxWidth: '100%' }}>
      <K.KjunTabs modelValue={config.value} variant={config.variant} density={config.density} items={config.items}
        onUpdate:modelValue={(value: string) => { s.events.push(value); if (s.config.accept) s.config = { ...s.config, value }; }}>
        {config.items.map((item: any) => <K.KjunTabPane key={item.name} {...item}><div data-testid={'content-' + item.name}>본문 {item.label}</div></K.KjunTabPane>)}
      </K.KjunTabs>
    </div>
    <output data-testid="value">{config.value}</output><output data-testid="events">{s.events.join('|')}</output>
  </main></K.KjunProvider>;
})).mount('#root');
