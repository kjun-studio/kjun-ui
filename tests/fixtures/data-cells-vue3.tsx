import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// The same cases as data-cells-cases.tsx, in Vue.
const s = reactive({ c: { price: 84200 } as any });
Object.assign(window, { configureCases: (next: object) => { s.c = { ...s.c, ...next }; } });
const price = (n: number) => Math.round(n).toLocaleString('en-US');
createApp(defineComponent(() => () => <K.KjunProvider><div style={{ padding: '24px', width: '720px' }}>
  <div data-testid="heat" style={{ display: 'flex', gap: '6px' }}>
    {[-4, -1, 0, 2, 6, 10].map(v => <K.KjunHeatmapCell key={v} value={v} min={-5} max={10} center={0} mode="price">{(v > 0 ? '+' : '') + v + '%'}</K.KjunHeatmapCell>)}
  </div>
  <div data-testid="heat-missing" style={{ display: 'flex', gap: '6px' }}>
    <K.KjunHeatmapCell value={NaN} min={-1} max={1} />
    <K.KjunHeatmapCell value={null} min={-1} max={1} />
  </div>
  <div data-testid="progress" style={{ width: '320px' }}>
    <K.KjunProgressCell value={12} max={20} valueText="12/20건" ariaLabel="B팀 진척" />
    <K.KjunProgressCell value={80} ariaLabel="기준" />
    <K.KjunProgressCell value={80} color="custom" ariaLabel="색 없는 custom" />
    <K.KjunProgressCell value={80} customColor="rgb(1, 2, 3)" ariaLabel="customColor만" />
  </div>
  <div data-testid="price-text"><K.KjunPriceCell value={s.c.price} formatter={price} flash /></div>
  <div data-testid="price-bg"><K.KjunPriceCell value={s.c.price} formatter={price} flash="background" /></div>
  <div data-testid="price-loading"><K.KjunPriceCell value={null} /></div>
</div></K.KjunProvider>)).mount('#root');
