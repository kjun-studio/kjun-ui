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
