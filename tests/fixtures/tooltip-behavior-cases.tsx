// Tooltip scroll, touch, warm-up and width cases; React and Native render the same tree.
const long = '긴 설명입니다. 넓은 툴팁은 한 줄에 더 많은 글자를 담아 짧은 줄이 여러 번 꺾이지 않게 합니다.';
export function TooltipBehaviorCases({ K, native = false }: { K: any; native?: boolean }) {
  return <main style={{ padding: 80, display: 'flex', flexDirection: 'column', gap: 48, alignItems: 'flex-start' }}>
    {!native && <div data-testid="scroller" style={{ height: 120, width: 240, overflow: 'auto' }}>
      <div style={{ height: 400, paddingTop: 40 }}>
        <K.KjunTooltip content="스크롤 설명"><K.KjunButton>스크롤 대상</K.KjunButton></K.KjunTooltip>
      </div>
    </div>}
    <div style={{ display: 'flex', flexDirection: 'row', gap: 48 }}>
      <K.KjunTooltip content="첫째 설명" delay={600}><K.KjunButton>첫째</K.KjunButton></K.KjunTooltip>
      <K.KjunTooltip content="둘째 설명" delay={600}><K.KjunButton>둘째</K.KjunButton></K.KjunTooltip>
      <K.KjunTooltip content="탭 설명"><K.KjunButton>탭 대상</K.KjunButton></K.KjunTooltip>
    </div>
    <K.KjunTooltip content={long} width="lg"><K.KjunButton>넓은 툴팁</K.KjunButton></K.KjunTooltip>
  </main>;
}
