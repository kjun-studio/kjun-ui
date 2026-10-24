import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { thumbColor } from './additions-cases';
applyDemoColors('default');
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  <div data-testid="switch-thumb">
    <div style={{ '--kjun-switch-thumb-on': thumbColor }}><K.KjunProvider><K.KjunSwitch modelValue label="Themed thumb" /></K.KjunProvider></div>
    <K.KjunProvider><K.KjunSwitch modelValue label="Default thumb" /></K.KjunProvider>
  </div>
</div>).mount('#root');
