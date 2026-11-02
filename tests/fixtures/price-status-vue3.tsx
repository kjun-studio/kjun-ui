import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { statusColumns, statusRows, won } from './price-status-cases';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Vue fills the same status places through the status slots.
const badge = ({ row }: { row: any }) => row.stale ? [<K.KjunBadge variant="warning" size="xs">지연</K.KjunBadge>] : [];
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', width: '420px' }}>
    <div data-testid="cell"><K.KjunPriceCell value={182500} formatter={won}>{{ status: () => [<K.KjunBadge variant="secondary" size="xs">종가</K.KjunBadge>] }}</K.KjunPriceCell></div>
    <div data-testid="bare"><K.KjunPriceCell value={42350} formatter={won} stale /></div>
    <div data-testid="halted"><K.KjunPriceCell value={null} formatter={won}>{{ status: () => [<K.KjunBadge variant="danger" size="xs">거래정지</K.KjunBadge>] }}</K.KjunPriceCell></div>
    <div data-testid="long" style={{ width: '160px', display: 'flex' }}><K.KjunPriceCell value={182500} formatter={won}>{{ status: () => [<span>시간외 단일가 거래 중인 종목입니다</span>] }}</K.KjunPriceCell></div>
    <div data-testid="list"><K.KjunMarketSimpleList rows={statusRows} hasLoadedOnce priceValue={(r: any) => r.price} changeValue={(r: any) => r.change}
      priceFormatter={won} primaryLabel={(r: any) => r.name} subMeta={(r: any) => r.symbol} showFooter={false}>{{ status: badge }}</K.KjunMarketSimpleList></div>
    <div data-testid="table"><K.KjunMarketTable rows={statusRows} columns={statusColumns} hasLoadedOnce priceFormatter={won}
      primaryLabel={(r: any) => r.name} showFooter={false}>{{ status: badge }}</K.KjunMarketTable></div>
  </div>
</K.KjunProvider>)).mount('#root');
