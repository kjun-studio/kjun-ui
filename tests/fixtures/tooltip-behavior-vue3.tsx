import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
const tooltipLong = '긴 설명입니다. 넓은 툴팁은 한 줄에 더 많은 글자를 담아 짧은 줄이 여러 번 꺾이지 않게 합니다.';
applyDemoColors('default');
const tip = (content: string, label: string, extra: object = {}) =>
  <K.KjunTooltip content={content} {...extra}>{{ default: () => <K.KjunButton>{{ default: () => label }}</K.KjunButton> }}</K.KjunTooltip>;
createApp(defineComponent(() => () => <K.KjunProvider>{{ default: () => (
  <main style={{ padding: '80px', display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'flex-start' }}>
    <div data-testid="scroller" style={{ height: '120px', width: '240px', overflow: 'auto' }}>
      <div style={{ height: '400px', paddingTop: '40px' }}>{tip('스크롤 설명', '스크롤 대상')}</div>
    </div>
    <div style={{ display: 'flex', gap: '48px' }}>
      {tip('첫째 설명', '첫째', { delay: 600 })}{tip('둘째 설명', '둘째', { delay: 600 })}{tip('탭 설명', '탭 대상')}
    </div>
    {tip(tooltipLong, '넓은 툴팁', { width: 'lg' })}
  </main>
) }}</K.KjunProvider>)).mount('#root');
