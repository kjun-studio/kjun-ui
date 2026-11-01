import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { sparkCases } from './sparkline-design-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {sparkCases.map(([id, props]) => <div key={id} data-testid={id} style={{ width: '72px' }}><K.KjunSparkline ariaLabel={id} {...(props as any)} /></div>)}
  </div>
</K.KjunProvider>)).mount('#root');
