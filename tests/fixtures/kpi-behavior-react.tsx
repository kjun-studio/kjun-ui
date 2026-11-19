import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { cssPalette } from './typography-values';
import { asideHero, asideItems, deltaFormatter, formatted, gridItems, hero, items, locale, masked, maskedItems, missing, narrowItems, precise, record } from './kpi-behavior-values';
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
  <div data-testid="narrow" style={{ width: 480 }}><K.KjunKpiRow items={narrowItems} /></div>
  <div data-testid="aside-hero"><K.KjunKpiHero {...asideHero} labelAside={<button type="button" onClick={() => record({ label: '가리기' })}>가리기</button>} /></div>
  <div data-testid="aside-row"><K.KjunKpiRow onItemClick={record}
    items={asideItems.map((item, i) => (i ? item : { ...item, labelAside: <button type="button" onClick={() => record({ label: '설명' })}>설명</button> }))} /></div>
  <div data-testid="grid"><K.KjunKpiRow items={gridItems} mobileSummary={false} /></div>
</div></K.KjunProvider>);
