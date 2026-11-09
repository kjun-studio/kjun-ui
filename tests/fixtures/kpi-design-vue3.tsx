import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
import { hero, hidden, items } from './kpi-design-values';
cssPalette();
createApp(() => <K.KjunProvider><div style={{ padding: '16px', display: 'grid', gap: '16px' }}>
  <div data-testid="hero"><K.KjunKpiHero {...hero}>{{ aside: () => <K.KjunButton size="sm" variant="secondary">입금</K.KjunButton> }}</K.KjunKpiHero></div>
  <div data-testid="hero-hidden"><K.KjunKpiHero {...hidden}>{{ aside: () => <K.KjunButton size="sm" variant="secondary">숨는 버튼</K.KjunButton> }}</K.KjunKpiHero></div>
  <div data-testid="row"><K.KjunKpiRow items={items} /></div>
</div></K.KjunProvider>).mount('#root');
