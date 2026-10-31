import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { trailRows } from './trail-cases';
applyDemoColors('default');
// Same sections and DOM as trail-cases.tsx (React/Native).
createApp(() => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '600px' }}>
  <div data-testid="ancestors"><K.KjunBreadcrumb ariaLabel="Ancestors" items={[{ label: 'Notes', to: '#notes' }, { label: 'Work', to: '#work' }]} /></div>
  <div data-testid="current"><K.KjunBreadcrumb ariaLabel="Current" items={[{ label: 'Notes', to: '#notes' }, { label: 'Minutes' }]} /></div>
  <output data-testid="visited">[]</output>
  <div data-testid="vertical"><K.KjunScrollFade direction="vertical" style={{ maxHeight: '120px' }}>
    {{ default: () => trailRows.map(row => <div key={row} style={{ height: '30px' }}>{row}</div>) }}
  </K.KjunScrollFade></div>
</div> }}</K.KjunProvider>).mount('#root');
