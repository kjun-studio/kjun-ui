import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { cssPalette } from './typography-values';
import { hero, hidden, items } from './kpi-design-values';
cssPalette();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><div style={{ padding: 16, display: 'grid', gap: 16 }}>
  <div data-testid="hero"><K.KjunKpiHero {...hero} aside={<K.KjunButton size="sm" variant="secondary">입금</K.KjunButton>} /></div>
  <div data-testid="hero-hidden"><K.KjunKpiHero {...hidden} aside={<K.KjunButton size="sm" variant="secondary">숨는 버튼</K.KjunButton>} /></div>
  <div data-testid="row"><K.KjunKpiRow items={items} /></div>
</div></K.KjunProvider>);
