import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunKpiHero, KjunKpiRow, KjunText } from '@kjun-ui/native';
import { palette, demoDomainColors, demoFont } from './typography-values';
import { deltaFormatter, formatted, hero, items, locale, masked, maskedItems, missing, precise, record } from './kpi-behavior-values';
// Native colours a description with descColor rather than a class.
const nativeHero = { ...hero, secondary: hero.secondary.map(({ descClass, ...item }) => (descClass ? { ...item, descColor: 'rgb(1, 2, 3)' } : item)) };
createRoot(document.getElementById('root')!).render(<KjunProvider colors={palette(false)} domainColors={demoDomainColors} fontFamily={demoFont} locale={locale}>
  <div style={{ padding: 16, display: 'grid', gap: 16 }}>
    <div data-testid="hero"><KjunKpiHero {...nativeHero} /></div>
    <div data-testid="missing"><KjunKpiHero {...missing} /></div>
    <div data-testid="masked"><KjunKpiHero {...masked} /></div>
    <div data-testid="precise"><KjunKpiHero {...precise} /></div>
    <div data-testid="formatted"><KjunKpiHero {...formatted} deltaFormatter={deltaFormatter} renderSecondary={() => <KjunText>보조 맞춤</KjunText>} /></div>
    <div data-testid="row"><KjunKpiRow items={items} onItemClick={record} /></div>
    <div data-testid="row-masked"><KjunKpiRow items={maskedItems} masked /></div>
  </div>
</KjunProvider>);
