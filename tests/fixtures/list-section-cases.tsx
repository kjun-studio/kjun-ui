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
