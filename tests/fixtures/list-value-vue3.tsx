import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const rows = [['식비', '이번 달 예산의 82%를 썼어요', '412,300원'], ['교통', '예산의 35%', '52,000원'], ['주거·관리비', '고정 지출, 매달 25일 자동이체', '1,250,000원']];
const section = (position: 'side' | 'title') => <div data-testid={position} style={{ width: '360px' }}>
  <K.KjunListSection title={position}>
    {rows.map(([title, description, value]) =>
      <K.KjunListRow key={title} title={title} description={description} trailingPosition={position} chevron onClick={() => {}}>
        {{ trailing: () => value, default: () => <div data-bar="" style={{ height: '6px', background: '#888' }} /> }}
      </K.KjunListRow>)}
  </K.KjunListSection>
</div>;
createApp(() => <K.KjunProvider><div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>{section('side')}{section('title')}</div></K.KjunProvider>).mount('#root');
