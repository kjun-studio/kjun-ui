import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { cssPalette } from './typography-values';
import { deltaFormatter, formatted, hero, items, locale, masked, maskedItems, missing, precise, record } from './kpi-behavior-values';
cssPalette();
createRoot(document.getElementById('root')!).render(<K.KjunProvider locale={locale}><div style={{ padding: 16, display: 'grid', gap: 16 }}>
  <style>{'.app-desc { color: rgb(1, 2, 3); }'}</style>
  <div data-testid="hero"><K.KjunKpiHero {...hero} /></div>
  <div data-testid="missing"><K.KjunKpiHero {...missing} /></div>
  <div data-testid="masked"><K.KjunKpiHero {...masked} /></div>
  <div data-testid="precise"><K.KjunKpiHero {...precise} /></div>
  <div data-testid="formatted"><K.KjunKpiHero {...formatted} deltaFormatter={deltaFormatter} renderSecondary={() => '보조 맞춤'} /></div>
  <div data-testid="row"><K.KjunKpiRow items={items} onItemClick={record} /></div>
  <div data-testid="row-masked"><K.KjunKpiRow items={maskedItems} masked /></div>
</div></K.KjunProvider>);
