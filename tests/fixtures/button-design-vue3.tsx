import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunButton } from '@kjun-ui/vue3';
import { buttonItems, setButtonColors } from './button-design-cases';
setButtonColors();
const state = reactive({ config: { size: 'md', variant: 'primary', disabled: false, loading: location.search.includes('loading'), block: false } as Record<string, unknown>, count: 0 });
Object.assign(window, { configureButton: (next: object) => { state.config = { ...state.config, ...next }; } });
createApp(defineComponent(() => () => (
  <KjunProvider>
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {buttonItems.map(item => <div key={item.id} data-testid={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '300px', maxWidth: '100%' }}>
        <KjunButton {...state.config} {...item.props} onClick={() => state.count++}>{{ default: () => item.label }}</KjunButton>
        {!state.config.block && <KjunButton variant="ghost" size={state.config.size as never}>{{ default: () => '취소' }}</KjunButton>}
      </div>)}
      <output data-testid="events">{state.count}</output>
      <output data-testid="config" hidden>{JSON.stringify(state.config)}</output>
    </div>
  </KjunProvider>
))).mount('#root');
