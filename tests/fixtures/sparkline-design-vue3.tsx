import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { caseWidth, marketColumns, marketRows, sparkCases } from './sparkline-design-cases';
applyDemoColors('default');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {sparkCases.map(([id, props]) => <div key={id} data-testid={id} style={{ width: `${caseWidth(id)}px` }}><K.KjunSparkline ariaLabel={id} {...(props as any)} /></div>)}
    <div data-testid="market"><K.KjunMarketTable rows={marketRows} columns={marketColumns} hasLoadedOnce showActions={false} /></div>
  </div>
</K.KjunProvider>)).mount('#root');
