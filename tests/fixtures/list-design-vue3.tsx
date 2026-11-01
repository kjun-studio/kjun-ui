import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const s = reactive({ on: true, lang: 'ko' });
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
</K.KjunProvider>)).mount('#root');
