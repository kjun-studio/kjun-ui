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
  <div style={{ padding: '16px', width: '360px', background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <K.KjunListSection radius="lg" title="계정">{{ actions: () => <K.KjunButton variant="secondary" onClick={noop}>편집</K.KjunButton>, default: () => [<K.KjunListRow title="프로필" onClick={noop} />] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="공유" description="함께 보는 사람">{{ actions: () => [<K.KjunButton variant="ghost" size="sm" onClick={noop}>초대</K.KjunButton>, <K.KjunButton variant="ghost" size="sm" onClick={noop}>링크</K.KjunButton>], default: () => [<K.KjunListRow title="공유 대상" onClick={noop} />] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="태그" description="문서 분류">{{ actions: () => <K.KjunButton variant="ghost" size="sm" prefixIcon="plus" ariaLabel="태그 추가" onClick={noop} />, default: () => [<K.KjunListRow title="업무" onClick={noop} />] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="테마" description="화면 색을 고릅니다" selectionMode="single">{{ default: () => [
      <K.KjunListRow title="밝게" selected onClick={noop} />, <K.KjunListRow title="어둡게" selected={false} onClick={noop} />, <K.KjunListRow title="시스템" selected={false} onClick={noop} />] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="최근 항목" description="불러오는 중">{{ loading: () => <K.KjunListSkeleton variant="row" rows={1} />, default: () => [<K.KjunListRow title="불러온 행" onClick={noop} />] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="보관함" description="보관한 문서" density="compact">{{ empty: () => <K.KjunEmpty text="보관한 문서가 없습니다" /> }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="묶음" description="조건부 행">{{ default: () => [<K.KjunListRow title="묶음 1" />, <K.KjunListRow title="묶음 2" />, <K.KjunListRow title="묶음 3" />] }}</K.KjunListSection>
  </div>
</K.KjunProvider>)).mount('#root');
