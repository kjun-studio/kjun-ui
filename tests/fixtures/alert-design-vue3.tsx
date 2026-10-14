import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { alertConfig } from './alert-design-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const state = reactive({ config: { ...alertConfig } as any, closed: 0, actions: 0 });
Object.assign(window, { configureAlert: (next: object) => { state.config = { ...state.config, ...next }; } });
createApp(defineComponent(() => () => {
  const c = state.config;
  const button = () => <K.KjunButton size="sm" variant="secondary" onClick={() => state.actions++}>{{ default: () => 'Retry' }}</K.KjunButton>;
  const action = () => <K.KjunButton variant="secondary" {...(c.actionSize ? { size: c.actionSize } : {})} onClick={() => state.actions++}>{{ default: () => 'Slot action' }}</K.KjunButton>;
  return <K.KjunProvider>{{ default: () => (
    <div style={{ padding: '24px', display: 'grid', gap: '24px', justifyItems: 'start' }}>
      <button data-testid="before">Before</button>
      <div data-testid="alert" style={{ width: c.width + 'px' }}>
        <K.KjunAlert key={c.generation} variant={c.variant} size={c.size} title={c.emptyFragment ? ' ' : String(c.title ?? '')}
          closable={c.closable} onClose={() => state.closed++}>
          {{ default: () => c.action ? button() : c.emptyFragment ? null : String(c.body ?? ''),
            ...(c.actions ? { actions: () => action() } : {}) }}
        </K.KjunAlert>
      </div>
      <div data-testid="reference">{button()}</div>
      <output data-testid="events">{state.closed + '/' + state.actions}</output>
    </div>
  ) }}</K.KjunProvider>;
})).mount('#root');
