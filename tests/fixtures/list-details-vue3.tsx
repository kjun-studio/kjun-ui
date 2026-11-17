import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { belowRow, detailRows, totalRow } from './list-details-cases';

applyDemoColors('default');
const row = (title: string, value: string, extra: Record<string, unknown> = {}) =>
  <K.KjunListRow key={title} title={title} {...extra}>{{ trailing: () => value }}</K.KjunListRow>;
createApp(() => <K.KjunProvider><div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
  <div data-testid="details" style={{ width: '360px' }}>
    <K.KjunListSection title="주문 정보" variant="details">
      {detailRows.map(([title, value]) => row(title, value))}
      {row(belowRow[0], belowRow[1], { trailingPosition: 'below' })}
      {row(totalRow[0], totalRow[1], { emphasized: true })}
    </K.KjunListSection>
  </div>
  <div data-testid="default" style={{ width: '360px' }}>
    <K.KjunListSection title="기본">{detailRows.slice(0, 2).map(([title, value]) => row(title, value))}</K.KjunListSection>
  </div>
</div></K.KjunProvider>).mount('#root');
