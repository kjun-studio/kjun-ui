import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunKpiHero, KjunKpiRow, KjunButton } from '@kjun-ui/native';
import { palette, demoDomainColors, demoFont } from './typography-values';
import { hero, hidden, items } from './kpi-design-values';
createRoot(document.getElementById('root')!).render(<KjunProvider colors={palette(false)} domainColors={demoDomainColors} fontFamily={demoFont}><div style={{ padding: 16, display: 'grid', gap: 16 }}>
  <div data-testid="hero"><KjunKpiHero {...hero} aside={<KjunButton size="sm" variant="secondary">입금</KjunButton>} /></div>
  <div data-testid="hero-hidden"><KjunKpiHero {...hidden} aside={<KjunButton size="sm" variant="secondary">숨는 버튼</KjunButton>} /></div>
  <div data-testid="row"><KjunKpiRow items={items} /></div>
</div></KjunProvider>);
