import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors, fabConfig, fabFrame } from './fab-cases';
applyDemoColors('default');
const state = reactive({ config: { ...fabConfig } as any, presses: 0 });
Object.assign(window, { configureFab: (next: object) => { state.config = { ...state.config, ...next }; } });
createApp(defineComponent(() => () => <K.KjunProvider>{{ default: () => (
  <div style={{ padding: '24px' }}>
    <div data-testid="frame" style={{ ...fabFrame, width: fabFrame.width + 'px', height: fabFrame.height + 'px' }}>
      <K.KjunFab icon="plus" safeArea={false} avoidBottomBar={false} {...state.config} onClick={() => state.presses++} />
    </div>
    <output data-testid="presses">{state.presses}</output>
    <output data-testid="config" hidden>{JSON.stringify(state.config)}</output>
  </div>
) }}</K.KjunProvider>)).mount('#root');
