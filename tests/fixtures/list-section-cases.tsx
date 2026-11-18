import { useState } from 'react';

// ListSection refinements and KjunListGroup (0.18.0): labels and footers outside rounded cards, title-line actions, empty state, heading level.
export function ListSectionCases({ K, native = false }: { K: any; native?: boolean }) {
  const press = { [native ? 'onPress' : 'onClick']: () => {} };
  return <div style={{ padding: 16, width: 360, background: '#F4F4F4' }}>
    <K.KjunListGroup>
      <K.KjunListSection title="최근 문서" description="지난 7일 동안 수정한 문서" headingLevel={2} actions={<K.KjunButton variant="ghost" size="sm" {...press}>전체 보기</K.KjunButton>}>
        <K.KjunListRow title="회의 메모" chevron {...press} />
      </K.KjunListSection>
      <K.KjunListSection title="알림" footer="푸시 알림은 이 기기에서만 적용됩니다.">
        <K.KjunListRow title="푸시 알림" checked onCheckedChange={() => {}} />
      </K.KjunListSection>
      <K.KjunListSection title="즐겨찾기" description="자주 여는 문서" empty={<K.KjunEmpty text="아직 즐겨찾기한 문서가 없습니다" />} />
    </K.KjunListGroup>
  </div>;
}

// Review fixes (0.21.0): tall and paired heading buttons, icon-only ghost, single choice, loading, compact empty, fragments.
export function ListSectionReviewCases({ K, native = false }: { K: any; native?: boolean }) {
  const press = { [native ? 'onPress' : 'onClick']: () => {} };
  return <div style={{ padding: 16, width: 360, background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: 24 }}>
    <K.KjunListSection radius="lg" title="계정" actions={<K.KjunButton variant="secondary" {...press}>편집</K.KjunButton>}><K.KjunListRow title="프로필" {...press} /></K.KjunListSection>
    <K.KjunListSection radius="lg" title="공유" description="함께 보는 사람" actions={<><K.KjunButton variant="ghost" size="sm" {...press}>초대</K.KjunButton><K.KjunButton variant="ghost" size="sm" {...press}>링크</K.KjunButton></>}><K.KjunListRow title="공유 대상" {...press} /></K.KjunListSection>
    <K.KjunListSection radius="lg" title="태그" description="문서 분류" actions={<K.KjunButton variant="ghost" size="sm" prefixIcon="plus" ariaLabel="태그 추가" {...press} />}><K.KjunListRow title="업무" {...press} /></K.KjunListSection>
    <K.KjunListSection radius="lg" title="테마" description="화면 색을 고릅니다" selectionMode="single">
      <K.KjunListRow title="밝게" selected {...press} /><K.KjunListRow title="어둡게" selected={false} {...press} /><K.KjunListRow title="시스템" selected={false} {...press} />
    </K.KjunListSection>
    <K.KjunListSection radius="lg" title="최근 항목" description="불러오는 중" loading={<K.KjunListSkeleton variant="row" rows={1} />}><K.KjunListRow title="불러온 행" {...press} /></K.KjunListSection>
    <K.KjunListSection radius="lg" title="보관함" description="보관한 문서" density="compact" empty={<K.KjunEmpty text="보관한 문서가 없습니다" />} />
    <K.KjunListSection radius="lg" title="묶음" description="조건부 행">
      <><K.KjunListRow title="묶음 1" /><K.KjunListRow title="묶음 2" /></>
      <><K.KjunListRow title="묶음 3" /></>
    </K.KjunListSection>
  </div>;
}

// Second review (0.21.0): a section that owns single and multiple selections, footer description, switching the
// selection mode off, a list drawn again after loading and a heading action that is not a KjunButton.
export function ListSectionSelectionCases({ K, native = false }: { K: any; native?: boolean }) {
  const [fruit, setFruit] = useState<string | null>('apple'), [tags, setTags] = useState<string[]>(['work']);
  const [mode, setMode] = useState<'single' | 'none'>('single'), [loading, setLoading] = useState(false);
  const on = (handler: () => void) => ({ [native ? 'onPress' : 'onClick']: handler }), press = on(() => {});
  return <div style={{ padding: 16, width: 360, background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: 24 }}>
    <K.KjunListSection radius="lg" title="과일 고르기" description="하나를 고릅니다" footer="고른 과일은 오늘만 적용됩니다." selectionMode="single" value={fruit} onValueChange={setFruit}>
      <K.KjunListRow title="사과" value="apple" /><K.KjunListRow title="배" value="pear" />
    </K.KjunListSection>
    <K.KjunListSection radius="lg" title="태그 고르기" selectionMode="multiple" value={tags} onValueChange={setTags}>
      <K.KjunListRow title="업무 태그" value="work" /><K.KjunListRow title="개인 태그" value="home" />
    </K.KjunListSection>
    <K.KjunButton variant="secondary" {...on(() => setMode(current => current === 'single' ? 'none' : 'single'))}>선택 모드 전환</K.KjunButton>
    <K.KjunButton variant="secondary" {...on(() => setLoading(current => !current))}>다시 불러오기</K.KjunButton>
    <K.KjunListSection radius="lg" title="정렬" selectionMode={mode} loading={loading ? <K.KjunListSkeleton variant="row" rows={1} /> : undefined}>
      <K.KjunListRow title="이름순" selected {...press} /><K.KjunListRow title="날짜순" selected={false} {...press} />
    </K.KjunListSection>
    {!native && <K.KjunListSection radius="lg" title="동기화" description="다른 기기와 맞춥니다" actions={<button type="button" style={{ height: 48, padding: '0 12px' }}>설정</button>}>
      <K.KjunListRow title="동기화 기록" {...press} />
    </K.KjunListSection>}
  </div>;
}

// Third review (0.22.0): a count badge after the title, id/class/style (Native style/testID) on the section and group,
// and a reorder note stacked on the footer of a section without a card.
export function ListSectionBadgeCases({ K, native = false }: { K: any; native?: boolean }) {
  const press = { [native ? 'onPress' : 'onClick']: () => {} };
  const root = (id: string) => native ? { testID: id, style: { marginTop: 4 } } : { id, className: 'app-' + id, style: { marginTop: 4 } };
  return <div style={{ padding: 16, width: 360, background: '#F4F4F4', display: 'flex', flexDirection: 'column', gap: 24 }}>
    <K.KjunListGroup {...root('tx-group')}>
      <K.KjunListSection {...root('tx-label')} title="최근 거래" badge={<K.KjunBadge count={12} />} actions={<K.KjunButton variant="ghost" size="sm" {...press}>모두</K.KjunButton>}>
        <K.KjunListRow title="스타벅스 강남" trailing="-5,600원" />
      </K.KjunListSection>
      <K.KjunListSection title="예약 거래" description="이번 달 예약한 이체" badge={<K.KjunBadge count={3} />}>
        <K.KjunListRow title="관리비" trailing="-180,000원" />
      </K.KjunListSection>
    </K.KjunListGroup>
    <K.KjunListSection title="관심 종목" reorderable order={['a', 'b']} reorderDisabled reorderDisabledText="가격순으로 정렬하는 동안은 옮길 수 없습니다." footer="순서는 이 기기에만 저장됩니다.">
      <K.KjunListRow title="종목 가" value="a" /><K.KjunListRow title="종목 나" value="b" />
    </K.KjunListSection>
  </div>;
}
