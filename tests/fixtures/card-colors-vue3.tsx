import { createApp, defineComponent, reactive } from 'vue';
import Kjun, { KjunProvider, KjunButton, KjunCard, type KjunCardProps } from '@kjun-ui/vue3';
import { cardColors, cssValues } from './card-colors-values';
const state = reactive({ surface: 'default' as KjunCardProps['surface'], changed: false, override: false, glass: false });
const button = (label: string, click: () => void) => <KjunButton onClick={click}>{{ default: () => label }}</KjunButton>;
createApp(defineComponent(() => () => (
  <KjunProvider style={cssValues(cardColors(state.changed, state.override))}>{{ default: () => [
    button('Toggle accent', () => { state.surface = state.surface === 'default' ? 'accent' : 'default'; }),
    button('Use subtle', () => { state.surface = 'subtle'; }),
    button('Toggle colors', () => { state.changed = !state.changed; }),
    button('Toggle overrides', () => { state.override = !state.override; }),
    button('Toggle glass', () => { state.glass = !state.glass; }),
    <div data-testid="card" style={{ width: '320px' }}>
      <KjunCard surface={state.glass ? 'glass' : state.surface} border>{{ default: () => 'Project card' }}</KjunCard>
    </div>,
  ] }}</KjunProvider>
))).use(Kjun).mount('#root');
