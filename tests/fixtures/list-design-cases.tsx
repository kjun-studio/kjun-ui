import { useState } from 'react';
// ListRow refinements (0.18.0): muted values, word wrapping, first-lines icon, danger icon, static disabled, selection and switch rows.
export function ListDesignCases({ K, native = false }: { K: any; native?: boolean }) {
  const [on, setOn] = useState(true);
  const [lang, setLang] = useState('ko');
  const press = (run: () => void) => ({ [native ? 'onPress' : 'onClick']: run });
  return <div style={{ padding: 16, width: 360 }}>
    <K.KjunListSection title="계정" description="프로필과 보안">
      <K.KjunListRow icon="lock" title="비밀번호" trailing="3개월 전 변경" chevron {...press(() => {})} />
      <K.KjunListRow icon="user" title="모든 기기에서 함께 사용할 프로필 사진과 계정 표시 이름" description="긴 제목과 설명이 여러 줄로 줄바꿈될 때도 아이콘이 제목 옆에 남습니다." />
      <K.KjunListRow icon="trash" title="계정 삭제" destructive {...press(() => {})} />
      <K.KjunListRow icon="bell" title="업무 알림" description="관리자가 꺼 두었습니다." disabled />
      <K.KjunListRow icon="bell" title="알림 받기" checked={on} onCheckedChange={setOn} />
    </K.KjunListSection>
    <K.KjunListSection title="언어" titleVariant="label">
      <K.KjunListRow title="한국어" selected={lang === 'ko'} {...press(() => setLang('ko'))} />
      <K.KjunListRow title="English" selected={lang === 'en'} {...press(() => setLang('en'))} />
    </K.KjunListSection>
    <output data-testid="state">{JSON.stringify({ on, lang })}</output>
  </div>;
}
