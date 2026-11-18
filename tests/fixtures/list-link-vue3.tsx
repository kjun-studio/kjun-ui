import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
createApp(() => <K.KjunProvider><main style={{ padding: '24px', width: '360px' }}>
  <K.KjunListSection title="출처">
    <K.KjunListRow title="새 탭 링크" href="https://example.com/a" target="_blank" chevron />
    <K.KjunListRow title="직접 준 rel" href="https://example.com/b" target="_blank" rel="noopener" chevron />
    <K.KjunListRow title="같은 창 링크" href="#same" chevron />
    <K.KjunListRow title="비활성 링크" href="#off" disabled chevron />
    <K.KjunListRow title="현재 페이지" href="#here" current chevron />
    <K.KjunListRow title="현재 메시지" current onClick={() => {}} chevron />
    <K.KjunListRow title="다른 메시지" onClick={() => {}} chevron />
  </K.KjunListSection>
</main></K.KjunProvider>).mount('#root');
