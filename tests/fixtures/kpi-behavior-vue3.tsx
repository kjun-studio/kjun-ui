import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
import { deltaFormatter, formatted, hero, items, locale, masked, maskedItems, missing, precise, record } from './kpi-behavior-values';
cssPalette();
const style = document.createElement('style');
style.textContent = '.app-desc { color: rgb(1, 2, 3); }';
document.head.append(style);
createApp(() => <K.KjunProvider locale={locale}><div style={{ padding: '16px', display: 'grid', gap: '16px' }}>
  <div data-testid="hero"><K.KjunKpiHero {...hero} /></div>
  <div data-testid="missing"><K.KjunKpiHero {...missing} /></div>
  <div data-testid="masked"><K.KjunKpiHero {...masked} /></div>
  <div data-testid="precise"><K.KjunKpiHero {...precise} /></div>
  <div data-testid="formatted"><K.KjunKpiHero {...formatted} deltaFormatter={deltaFormatter}>{{ secondary: () => '보조 맞춤' }}</K.KjunKpiHero></div>
  <div data-testid="row"><K.KjunKpiRow items={items} onItemClick={record} /></div>
  <div data-testid="row-masked"><K.KjunKpiRow items={maskedItems} masked /></div>
</div></K.KjunProvider>).mount('#root');
