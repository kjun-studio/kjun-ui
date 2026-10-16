import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { columns, kpiRowItems, loadingDelay, marketProps, texts } from './loading-options-values';
applyDemoColors('default');
const loading = ref(true);
Object.assign(window, { setLoading: (value: boolean) => { loading.value = value; } });
createApp(defineComponent(() => () => {
  const query = { loading: loading.value, hasLoadedOnce: !loading.value };
  return <K.KjunProvider><div style={{ padding: '16px', width: '360px' }}>
    <div data-testid="delayed"><K.KjunDataState {...query} loadingDelay={loadingDelay} loadingText={texts.delayed}><K.KjunCard title="결과" /></K.KjunDataState></div>
    <K.KjunTable columns={columns} data={[]} {...query} skeleton={false} loadingText={texts.table} />
    <K.KjunTable columns={columns} data={[]} {...query} loadingText={texts.skeletonTable} />
    <K.KjunMarketTable {...marketProps} {...query} skeleton={false} loadingText={texts.marketTable} />
    <K.KjunMarketCards {...marketProps} {...query} skeleton={false} loadingText={texts.marketCards} />
    <K.KjunMarketSimpleList {...marketProps} {...query} skeleton={false} loadingText={texts.marketList} />
    <div data-testid="kpi-hero-flat"><K.KjunKpiHero label="총 평가 금액" value={1234} surface="none" animated={false} /></div>
    <div data-testid="kpi-row-flat"><K.KjunKpiRow items={kpiRowItems} surface="none" /></div>
  </div></K.KjunProvider>;
})).mount('#root');
