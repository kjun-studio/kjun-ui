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

// Visual review (0.21.0): one-line rows keep their minimum height, ends center on a described row's band, wrapped values
// end-align, the whole row takes the hover fill, and the open variant with its choice marks.
export function ListOpenCases({ K, native = false }: { K: any; native?: boolean }) {
  const [theme, setTheme] = useState<string | number | null>('light'), [tags, setTags] = useState<(string | number)[]>(['work']);
  const press = { [native ? 'onPress' : 'onClick']: () => {} }, tile = native ? '#EEEEEE' : 'var(--kjun-secondary)';
  return <div style={{ padding: 16, width: 360, background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: 24 }}>
    <K.KjunListSection radius="lg" title="높이">
      <K.KjunListRow icon="lock" iconBackground={tile} title="비밀번호 행" trailing="3개월" chevron {...press} />
      <K.KjunListRow icon="moon" title="다크 모드 행" checked onCheckedChange={() => {}} />
      <K.KjunListRow title="프로필 행" description="이름과 사진" {...press} actions={<K.KjunButton variant="secondary" size="sm" {...press}>공유</K.KjunButton>} />
      <K.KjunListRow icon="receipt" iconBackground={tile} title="11월 카드 결제 예정 금액과 할부 내역 전체 보기" description="결제일 전에 잔액이 부족하면 알림을 보냅니다." trailing="1,234,567원" chevron {...press} />
      <K.KjunListRow title="저장 위치" trailing="내 파일 / 다운로드 / 문서 보관함" />
    </K.KjunListSection>
    <K.KjunListSection radius="lg" title="촘촘하게" density="compact">
      <K.KjunListRow icon="wifi" title="와이파이 행" checked onCheckedChange={() => {}} />
      <K.KjunListRow icon="receipt" iconBackground={tile} title="영수증 행" chevron {...press} />
    </K.KjunListSection>
    <K.KjunListGroup variant="open">
      <K.KjunListSection title="화면 테마" selectionMode="single" value={theme} onValueChange={setTheme}>
        <K.KjunListRow icon="sun" title="밝게" value="light" />
        <K.KjunListRow icon="moon" title="어둡게" value="dark" />
        <K.KjunListRow icon="device-desktop" title="시스템 설정" description="기기 설정을 따릅니다." value="system" />
      </K.KjunListSection>
      <K.KjunListSection title="관심 태그" selectionMode="multiple" value={tags} onValueChange={setTags}>
        <K.KjunListRow title="업무 태그" value="work" /><K.KjunListRow title="여행 태그" value="trip" />
      </K.KjunListSection>
      <K.KjunListSection>
        <K.KjunListRow icon="trash" title="탈퇴하기 행" destructive {...press} />
      </K.KjunListSection>
    </K.KjunListGroup>
    <output data-testid="open-state">{JSON.stringify({ theme, tags })}</output>
  </div>;
}
