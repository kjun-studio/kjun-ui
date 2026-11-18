import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const noop = () => {};
const fruit = ref<string | null>('apple'), tags = ref<string[]>(['work']), mode = ref<'single' | 'none'>('single'), loading = ref(false);
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
  <div style={{ padding: '16px', width: '360px', background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <K.KjunListSection radius="lg" title="과일 고르기" description="하나를 고릅니다" selectionMode="single" modelValue={fruit.value} {...{ 'onUpdate:modelValue': (value: string) => { fruit.value = value; } }}>{{ default: () => [<K.KjunListRow title="사과" value="apple" />, <K.KjunListRow title="배" value="pear" />], footer: () => '고른 과일은 오늘만 적용됩니다.' }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="태그 고르기" selectionMode="multiple" modelValue={tags.value} {...{ 'onUpdate:modelValue': (value: string[]) => { tags.value = value; } }}>{{ default: () => [<K.KjunListRow title="업무 태그" value="work" />, <K.KjunListRow title="개인 태그" value="home" />] }}</K.KjunListSection>
    <K.KjunButton variant="secondary" onClick={() => { mode.value = mode.value === 'single' ? 'none' : 'single'; }}>선택 모드 전환</K.KjunButton>
    <K.KjunButton variant="secondary" onClick={() => { loading.value = !loading.value; }}>다시 불러오기</K.KjunButton>
    <K.KjunListSection radius="lg" title="정렬" selectionMode={mode.value}>{{ ...(loading.value ? { loading: () => <K.KjunListSkeleton variant="row" rows={1} /> } : {}), default: () => [<K.KjunListRow title="이름순" selected onClick={noop} />, <K.KjunListRow title="날짜순" selected={false} onClick={noop} />] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="동기화" description="다른 기기와 맞춥니다">{{ actions: () => <button type="button" style={{ height: '48px', padding: '0 12px' }}>설정</button>, default: () => [<K.KjunListRow title="동기화 기록" onClick={noop} />] }}</K.KjunListSection>
  </div>
  <div style={{ padding: '16px', width: '360px', background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <K.KjunListGroup id="tx-group" class="app-tx-group" style={{ marginTop: '4px' }}>{{ default: () => [
      <K.KjunListSection id="tx-label" class="app-tx-label" style={{ marginTop: '4px' }} title="최근 거래">{{ badge: () => <K.KjunBadge count={12} />, actions: () => <K.KjunButton variant="ghost" size="sm" onClick={noop}>모두</K.KjunButton>, default: () => [<K.KjunListRow title="스타벅스 강남">{{ trailing: () => '-5,600원' }}</K.KjunListRow>] }}</K.KjunListSection>,
      <K.KjunListSection title="예약 거래" description="이번 달 예약한 이체">{{ badge: () => <K.KjunBadge count={3} />, default: () => [<K.KjunListRow title="관리비">{{ trailing: () => '-180,000원' }}</K.KjunListRow>] }}</K.KjunListSection>,
    ] }}</K.KjunListGroup>
    <K.KjunListSection title="관심 종목" reorderable order={['a', 'b']} reorderDisabled reorderDisabledText="가격순으로 정렬하는 동안은 옮길 수 없습니다.">{{ default: () => [<K.KjunListRow title="종목 가" value="a" />, <K.KjunListRow title="종목 나" value="b" />], footer: () => '순서는 이 기기에만 저장됩니다.' }}</K.KjunListSection>
  </div>
</K.KjunProvider>)).mount('#root');
