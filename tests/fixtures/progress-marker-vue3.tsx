import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
createApp(() => <K.KjunProvider><div style={{ padding: '24px', width: '400px' }}>
  <div data-testid="budget" style={{ marginBottom: '20px' }}><K.KjunProgress value={62} marker={53} markerLabel="오늘 기준 53%" label="식비" subLabel="오늘 기준 53%" /></div>
  <div data-testid="scaled" style={{ marginBottom: '20px' }}><K.KjunProgress value={60000} max={200000} marker={106000} size="sm" /></div>
  <div data-testid="start" style={{ marginBottom: '20px' }}><K.KjunProgress value={40} marker={0} size="lg" /></div>
  <div data-testid="end" style={{ marginBottom: '20px' }}><K.KjunProgress value={40} marker={500} /></div>
  <div data-testid="none" style={{ marginBottom: '20px' }}><K.KjunProgress value={40} /></div>
  <div data-testid="busy" style={{ marginBottom: '20px' }}><K.KjunProgress indeterminate marker={53} /></div>
  <div data-testid="circle" style={{ marginBottom: '20px' }}><K.KjunProgress value={40} marker={53} shape="circle" /></div>
  <div data-testid="cell" style={{ marginBottom: '20px' }}><K.KjunProgressCell value={62} marker={53} markerLabel="오늘 기준 53%" /></div>
  <div data-testid="cell-none" style={{ marginBottom: '20px' }}><K.KjunProgressCell value={62} /></div>
</div></K.KjunProvider>).mount('#root');
