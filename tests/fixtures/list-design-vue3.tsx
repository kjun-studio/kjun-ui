import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const s = reactive({ on: true, lang: 'ko', theme: 'light' as string | number | null, tags: ['work'] as (string | number)[], plain: ['red'] as (string | number)[], presses: 0 });
const noop = () => {}, tile = 'var(--kjun-secondary)';
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '16px', width: '360px' }}>
    <K.KjunListSection title="계정" description="프로필과 보안">{{ default: () => [
      <K.KjunListRow icon="lock" title="비밀번호" chevron onClick={() => {}}>{{ trailing: () => '3개월 전 변경' }}</K.KjunListRow>,
      <K.KjunListRow icon="user" title="모든 기기에서 함께 사용할 프로필 사진과 계정 표시 이름" description="긴 제목과 설명이 여러 줄로 줄바꿈될 때도 아이콘이 제목 옆에 남습니다." />,
      <K.KjunListRow icon="trash" title="계정 삭제" destructive onClick={() => {}} />,
      <K.KjunListRow icon="bell" title="업무 알림" description="관리자가 꺼 두었습니다." disabled />,
      <K.KjunListRow icon="bell" title="알림 받기" checked={s.on} onUpdate:checked={(v: boolean) => { s.on = v; }} />,
    ] }}</K.KjunListSection>
    <K.KjunListSection title="언어" titleVariant="label">{{ default: () => [
      <K.KjunListRow title="한국어" selected={s.lang === 'ko'} onClick={() => { s.lang = 'ko'; }} />,
      <K.KjunListRow title="English" selected={s.lang === 'en'} onClick={() => { s.lang = 'en'; }} />,
    ] }}</K.KjunListSection>
    <output data-testid="state">{JSON.stringify({ on: s.on, lang: s.lang })}</output>
  </div>
  <div style={{ padding: '16px', width: '360px', background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <K.KjunListSection radius="lg" title="높이">{{ default: () => [
      <K.KjunListRow icon="lock" iconBackground={tile} title="비밀번호 행" chevron onClick={noop}>{{ trailing: () => '3개월' }}</K.KjunListRow>,
      <K.KjunListRow icon="moon" title="다크 모드 행" checked onUpdate:checked={noop} />,
      <K.KjunListRow title="프로필 행" description="이름과 사진" onClick={noop}>{{ actions: () => <K.KjunButton variant="secondary" size="sm" onClick={noop}>공유</K.KjunButton> }}</K.KjunListRow>,
      <K.KjunListRow icon="receipt" iconBackground={tile} title="11월 카드 결제 예정 금액과 할부 내역 전체 보기" description="결제일 전에 잔액이 부족하면 알림을 보냅니다." chevron onClick={noop}>{{ trailing: () => '1,234,567원' }}</K.KjunListRow>,
      <K.KjunListRow title="저장 위치">{{ trailing: () => '내 파일 / 다운로드 / 문서 보관함' }}</K.KjunListRow>,
      <K.KjunListRow title="아바타 행" onClick={noop}>{{ leading: () => <K.KjunAvatar name="김하늘" size="sm" /> }}</K.KjunListRow>,
      <K.KjunListRow icon="cloud" title="저장 중 행" checked busy onUpdate:checked={() => { s.presses++; }} />,
    ] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="기본 여러 개" selectionMode="multiple" modelValue={s.plain} onUpdate:modelValue={(v: any) => { s.plain = v; }}>{{ default: () => [
      <K.KjunListRow title="빨강 태그" value="red" />, <K.KjunListRow title="파랑 태그" value="blue" />,
    ] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="촘촘한 로딩" density="compact">{{ loading: () => <K.KjunListSkeleton variant="row" rows={1} description={false} /> }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="처리 중">{{ default: () => [
      <K.KjunListRow icon="send" title="보내는 중 행" chevron busy onClick={() => { s.presses++; }} />,
      <K.KjunListRow title="이동 중 행" href="#moved" busy chevron />,
      <K.KjunListRow title="배지 행" description="배지 설명" onClick={noop}>{{ badge: () => <K.KjunBadge>새 기능</K.KjunBadge>, trailing: () => '3개' }}</K.KjunListRow>,
    ] }}</K.KjunListSection>
    <K.KjunListSection radius="lg" title="촘촘하게" density="compact">{{ default: () => [
      <K.KjunListRow icon="wifi" title="와이파이 행" checked onUpdate:checked={noop} />,
      <K.KjunListRow icon="receipt" iconBackground={tile} title="영수증 행" chevron onClick={noop} />,
    ] }}</K.KjunListSection>
    <K.KjunListGroup variant="open">{{ default: () => [
      <K.KjunListSection title="화면 테마" selectionMode="single" modelValue={s.theme} onUpdate:modelValue={(v: any) => { s.theme = v; }}>{{ default: () => [
        <K.KjunListRow icon="sun" title="밝게" value="light" />,
        <K.KjunListRow icon="moon" title="어둡게" value="dark" />,
        <K.KjunListRow icon="device-desktop" title="시스템 설정" description="기기 설정을 따릅니다." value="system" />,
      ] }}</K.KjunListSection>,
      <K.KjunListSection title="관심 태그" selectionMode="multiple" modelValue={s.tags} onUpdate:modelValue={(v: any) => { s.tags = v; }}>{{ default: () => [
        <K.KjunListRow title="업무 태그" value="work" />, <K.KjunListRow title="여행 태그" value="trip" />,
      ] }}</K.KjunListSection>,
      <K.KjunListSection selectionMode="single">{{ default: () => [
        <K.KjunListRow title="잠긴 선택" selected disabled onClick={noop} />,
        <K.KjunListItem>{{ default: () => <K.KjunText>안내 항목</K.KjunText> }}</K.KjunListItem>,
      ] }}</K.KjunListSection>,
      <K.KjunListSection>{{ default: () => [<K.KjunListRow icon="trash" title="탈퇴하기 행" destructive onClick={noop} />] }}</K.KjunListSection>,
      <K.KjunListSection title="불러오는 중">{{ loading: () => <K.KjunListSkeleton variant="row" rows={1} avatar /> }}</K.KjunListSection>,
    ] }}</K.KjunListGroup>
    <output data-testid="open-state">{JSON.stringify({ theme: s.theme, tags: s.tags, plain: s.plain, presses: s.presses })}</output>
  </div>
</K.KjunProvider>)).mount('#root');
