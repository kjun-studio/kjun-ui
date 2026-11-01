import { createApp, defineComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const noop = () => {};
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '16px', width: '360px', background: '#F4F4F4' }}>
    <K.KjunListGroup>{{ default: () => [
      <K.KjunListSection title="최근 문서" description="지난 7일 동안 수정한 문서" headingLevel={2}>{{ actions: () => <K.KjunButton variant="ghost" size="sm" onClick={noop}>전체 보기</K.KjunButton>, default: () => [<K.KjunListRow title="회의 메모" chevron onClick={noop} />] }}</K.KjunListSection>,
      <K.KjunListSection title="알림">{{ default: () => [<K.KjunListRow title="푸시 알림" checked />], footer: () => '푸시 알림은 이 기기에서만 적용됩니다.' }}</K.KjunListSection>,
      <K.KjunListSection title="즐겨찾기" description="자주 여는 문서">{{ empty: () => <K.KjunEmpty text="아직 즐겨찾기한 문서가 없습니다" /> }}</K.KjunListSection>,
    ] }}</K.KjunListGroup>
  </div>
</K.KjunProvider>)).mount('#root');
