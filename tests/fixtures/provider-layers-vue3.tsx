import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
const s = reactive({ outer: false, inner: false, drawer: false, present: true, changed: false, events: [] as string[] });
Object.assign(window, { providerLayers: { unmount: () => s.present = false, changeStyle: () => s.changed = true } });
const button = (name: string, action?: () => void) => <K.KjunButton onClick={action}>{name}</K.KjunButton>;
const change = (key: 'outer' | 'inner' | 'drawer') => (v: boolean) => { s[key] = v; if (!v) s.events.push(key); };
const popup = (label: string, name: string, action: string) => <K.KjunPopover ariaLabel={label}>{{ trigger: () => button(name), default: () => button(action) }}</K.KjunPopover>;
createApp(defineComponent(() => () => (
  <K.KjunProvider>
    <div style={{ padding: '20px' }}>
      {button('Open outer', () => s.outer = true)}<output data-testid="events">{s.events.join(',')}</output>
      <K.KjunModal open={s.outer} onUpdate:open={change('outer')} title="Outer dialog">
        {button('Outer action')}
        {s.present && <K.KjunProvider style={{ '--kjun-surface': s.changed ? '#ddeeff' : '#fff4dd', '--kjun-font': 'monospace' }}>
          <div>
            {button('Open inner', () => s.inner = true)}{button('Open drawer', () => s.drawer = true)}
            {popup('Scoped popup', 'Open popup', 'Popup action')}
            <K.KjunModal open={s.inner} onUpdate:open={change('inner')} title="Inner dialog">
              {button('Inner action')}<K.KjunInput ariaLabel="Inner input" />{popup('Inner popup', 'Open inner popup', 'Inner popup action')}
            </K.KjunModal>
            <K.KjunDrawer open={s.drawer} onUpdate:open={change('drawer')} title="Inner drawer">{button('Drawer action')}</K.KjunDrawer>
          </div>
        </K.KjunProvider>}
      </K.KjunModal>
    </div>
  </K.KjunProvider>
))).mount('#root');
