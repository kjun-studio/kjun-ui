import { createApp, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { trailRows } from './trail-cases';
applyDemoColors('default');
// Same sections and DOM as trail-cases.tsx (React/Native).
const routed = ref<string[]>([]);
const route = (item: { label: string }, event?: MouseEvent) => { event?.preventDefault(); routed.value = [...routed.value, item.label + (event ? '+event' : '')]; };
createApp(() => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '600px' }}>
  <div data-testid="ancestors"><K.KjunBreadcrumb ariaLabel="Ancestors" items={[{ label: 'Notes', to: '#notes' }, { label: 'Work', to: '#work' }]} /></div>
  <div data-testid="current"><K.KjunBreadcrumb ariaLabel="Current" items={[{ label: 'Notes', to: '#notes' }, { label: 'Minutes' }]} /></div>
  <div data-testid="long"><K.KjunBreadcrumb ariaLabel="Long" maxItems={3} items={[{ label: 'Home', to: '#home' }, { label: 'Docs', to: '#docs' }, { label: '2026', to: '#year' }, { label: 'November', to: '#month' }, { label: 'Report' }]} /></div>
  <output data-testid="visited">[]</output>
  <div data-testid="routed"><K.KjunBreadcrumb ariaLabel="Routed" maxItems={3} items={[{ label: 'Home', to: '#home' }, { label: 'Docs', to: '#docs' }, { label: '2026', to: '#year' }, { label: 'November', to: '#month' }, { label: 'Report' }]} onNavigate={route} /></div>
  <output data-testid="routed-log">{JSON.stringify(routed.value)}</output>
  <div data-testid="horizontal"><K.KjunScrollFade ariaLabel="Chips" style={{ width: '200px' }}>
    {{ default: () => <div style={{ display: 'flex', width: '600px' }}>{trailRows.slice(0, 6).map(row => <span key={row} style={{ width: '100px', flex: 'none' }}>{row}</span>)}</div> }}
  </K.KjunScrollFade></div>
  <div data-testid="vertical"><K.KjunScrollFade direction="vertical" style={{ maxHeight: '120px' }}>
    {{ default: () => trailRows.map(row => <div key={row} style={{ height: '30px' }}>{row}</div>) }}
  </K.KjunScrollFade></div>
</div> }}</K.KjunProvider>).mount('#root');
