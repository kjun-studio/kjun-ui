import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { opinions, times, zones } from './distribution-values';
applyDemoColors('default');
// Same sections and DOM as distribution-cases.tsx (React/Native).
const box = (id: string, node: any) => <div data-testid={id} style={{ width: '600px' }}>{node}</div>;
const App = defineComponent(() => () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
  {box('gauge', <K.KjunZoneGauge label="PER 백분위" value={72} zones={zones} />)}
  {box('gauge-zero', <K.KjunZoneGauge label="PER 백분위" value={0} zones={zones} />)}
  {box('gauge-missing', <K.KjunZoneGauge label="PER 백분위" value={null} zones={zones} />)}
  {box('gauge-custom', <K.KjunZoneGauge ariaLabel="밸류" value={15} min={10} max={20} zones={[{ to: 15, label: '낮음' }, { to: 20, label: '높음' }]} formatValue={times} showValue={false} zoneLabels={false} size="sm" />)}
  {box('stacked', <K.KjunStackedBar label="애널리스트 의견" items={opinions(12, 6, 2)} />)}
  {box('stacked-summary', <K.KjunStackedBar label="애널리스트 의견" valueText="20명 · 강세 우위" items={opinions(12, 6, 2)} />)}
  <div data-testid="gauge-tinted" style={{ width: '600px', background: 'rgb(238, 240, 246)', padding: '8px' }}><K.KjunZoneGauge label="PER 백분위" value={71.5} zones={zones} /></div>
  {box('stacked-small', <K.KjunStackedBar label="애널리스트 의견" items={opinions(990, 5, 5)} />)}
  {box('stacked-fractions', <K.KjunStackedBar ariaLabel="비중" items={opinions(0.3, 0, 0.1)} legend={false} />)}
  {box('stacked-zero-item', <K.KjunStackedBar label="애널리스트 의견" items={opinions(7, 3, 0)} />)}
  {box('stacked-empty', <K.KjunStackedBar label="애널리스트 의견" items={opinions(0, 0, 0)} />)}
  {box('stacked-missing', <K.KjunStackedBar label="애널리스트 의견" items={null} />)}
  {box('stacked-part-missing', <K.KjunStackedBar ariaLabel="의견" items={opinions(3, null, 1)} legend={false} size="sm" />)}
</div> }}</K.KjunProvider>);
createApp(App).mount('#root');
