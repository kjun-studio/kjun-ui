import { formLabels, longSentence, narrowNumber, toneProbes, toneTexts, tones, variants } from './layout-primitives-values';
const boxes = (count: number, wide = false) => Array.from({ length: count }, (_, i) =>
  <div key={i} className={'app-box' + (wide ? ' app-wide' : '')} />);
export function LayoutCases({ K, native = false }: { K: any; native?: boolean }) {
  const field = (label: string) => <K.KjunFormGroup key={label} label={label}><K.KjunInput value="" onValueChange={() => {}} /></K.KjunFormGroup>;
  return <div style={{ padding: 16 }}>
    <div data-testid="text-variants">{variants.map(v => <K.KjunText key={v} variant={v}>{v}</K.KjunText>)}</div>
    <div data-testid="text-tones">{tones.map(t => <K.KjunText key={t} tone={t}>{toneTexts[t]}</K.KjunText>)}</div>
    {Object.entries(toneProbes).map(([tone, value]) => <span key={tone} data-testid={'probe-' + tone} style={{ color: `var(${value})` }}>probe</span>)}
    <div data-testid="text-features">
      <K.KjunText variant="sectionTitle">이번 달 <K.KjunText variant="inherit" tone="danger">3건</K.KjunText> 실패</K.KjunText>
      <K.KjunText numeric>{'1111'}</K.KjunText>
      <K.KjunText decoration="lineThrough">할인 전 가격</K.KjunText>
      {!native && <dl><K.KjunText as="dt" variant="caption" title="결제 수단 전체 이름" lang="ko">결제 수단</K.KjunText></dl>}
      <K.KjunText maxLines={0.5}>줄 수가 1보다 작으면 줄이지 않습니다</K.KjunText>
    </div>
    {!native && <div data-testid="display-narrow" style={{ width: 60, display: 'flex', flexDirection: 'column' }}><K.KjunText variant="displayMd">{narrowNumber}</K.KjunText></div>}
    {/* A flex column like a Native View: RN Web Text is inline and only takes its parent's width inside one. */}
    <div data-testid="text-clamp" style={{ width: 120, display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={1}>{longSentence}</K.KjunText></div>
    <div data-testid="text-number"><K.KjunText variant="numberMd">{'1234'}</K.KjunText></div>
    {!native && <div data-testid="text-link"><K.KjunText>약관에 <a href="#terms">동의</a>합니다</K.KjunText></div>}
    {!native && <div data-testid="app-prose" className="app-prose"><K.KjunText>앱 본문 안의 글자</K.KjunText></div>}
    {!native && <div data-testid="text-focus">
      <K.KjunText as="h2" variant="sectionTitle" tabIndex={-1} ref={(el: HTMLElement | null) => { (window as any).kjunHeading = el; }}>새 화면 제목</K.KjunText>
      <K.KjunText role="status">저장했습니다</K.KjunText>
    </div>}
    {!native && <div data-testid="number-narrow" style={{ width: 40, display: 'flex', flexDirection: 'column' }}><K.KjunText variant="numberMd">{narrowNumber}</K.KjunText></div>}
    <div data-testid="stack-md"><K.KjunStack gap="md">{boxes(3)}</K.KjunStack></div>
    <div data-testid="stack-section"><K.KjunStack gap="section-md">{boxes(3)}</K.KjunStack></div>
    <div data-testid="inline-sm"><K.KjunInline gap="sm">{boxes(3)}</K.KjunInline></div>
    <div data-testid="inline-narrow"><K.KjunInline>{boxes(12, true)}</K.KjunInline></div>
    <div data-testid="stack-form"><K.KjunStack gap="md">{formLabels.stack.map(field)}</K.KjunStack></div>
    <div data-testid="free-form">{formLabels.free.map(field)}</div>
    {native
      ? <><div data-testid="stack-string"><K.KjunStack>문자열 자식</K.KjunStack></div>
        <div data-testid="stack-fragment-string"><K.KjunStack><>조각 안 문자열</></K.KjunStack></div></>
      : <><div data-testid="stack-app-markup"><K.KjunStack><h2>앱 제목</h2></K.KjunStack></div>
        <div data-testid="nested-app-markup"><K.KjunStack><K.KjunStack><K.KjunInline><h2>안쪽 앱 제목</h2></K.KjunInline></K.KjunStack></K.KjunStack></div></>}
  </div>;
}
