import { createApp, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { parityConfig } from './parity-cases';
applyDemoColors('default');
// Same sections and DOM as parity-cases.tsx (React/Native).
const config = reactive({ ...parityConfig });
const changes = ref<unknown[]>([]);
Object.assign(window, { configureParity: (next: object) => Object.assign(config, next) });
const progress = (shape: 'bar' | 'circle') => <div data-testid={shape}>
  <K.KjunProgress shape={shape} label="Upload" showLabel value={config.value} max={config.max} indeterminate={config.indeterminate} />
  <K.KjunProgress shape={shape} label="Default zero" />
</div>;
createApp(() => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '900px' }}>
  <div data-testid="checkbox">
    <K.KjunCheckbox label="Select all" modelValue={config.all} indeterminate={config.mixed}
      onUpdate:modelValue={(value: any) => { changes.value = [...changes.value, value]; config.all = value; config.mixed = false; }} />
    <output data-testid="changes">{JSON.stringify(changes.value)}</output>
  </div>
  {progress('bar')}
  {progress('circle')}
  <div data-testid="kpi">
    <K.KjunKpiRow items={[
      { label: 'Missing', value: config.kpi, prefix: '$', suffix: '%' },
      { label: 'Invalid', value: Number.NaN, semantic: 'price' },
      { label: 'Custom', value: null, missingText: 'n/a' },
      { label: 'Zero', value: 0 },
      { label: 'Loading', loading: config.loading },
    ]} />
  </div>
  <div data-testid="scroll" style={{ height: '200px', overflow: 'auto', background: 'rgb(240, 240, 240)' }}>
    <div style={{ height: '40px' }} />
    <K.KjunTabs modelValue="first" stickyHeader={config.sticky} stickyOffset={12} ariaLabel="Sections">
      <K.KjunTabPane name="first" label="First"><div style={{ height: '600px' }}>First panel</div></K.KjunTabPane>
      <K.KjunTabPane name="second" label="Second"><div style={{ height: '600px' }}>Second panel</div></K.KjunTabPane>
    </K.KjunTabs>
  </div>
</div> }}</K.KjunProvider>).mount('#root');
