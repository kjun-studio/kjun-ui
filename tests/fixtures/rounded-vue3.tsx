import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as rounded-cases.tsx (React/Native).
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '420px' }}>
  <div data-testid="cards"><K.KjunProvider>
    <K.KjunCard radius="xl" title="XL card"><K.KjunText>XL body</K.KjunText></K.KjunCard>
    <K.KjunCard radius="lg" title="LG card"><K.KjunText>LG body</K.KjunText></K.KjunCard>
  </K.KjunProvider></div>
</div>).mount('#root');
