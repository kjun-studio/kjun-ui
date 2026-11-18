import { useState } from 'react';
import { formLabels, longSentence, narrowNumber, toneProbes, toneTexts, tones, variants } from './layout-primitives-values';
const boxes = (count: number, wide = false) => Array.from({ length: count }, (_, i) =>
  <div key={i} className={'app-box' + (wide ? ' app-wide' : '')} />);
export function LayoutCases({ K, native = false }: { K: any; native?: boolean }) {
  const field = (label: string) => <K.KjunFormGroup key={label} label={label}><K.KjunInput value="" onValueChange={() => {}} /></K.KjunFormGroup>;
  return <div style={{ padding: 16 }}>
    {/* The display words are wider than a 320px screen; the region clips them so the page itself does not scroll. */}
    <div data-testid="text-variants" style={{ overflowX: 'hidden' }}>{variants.map(v => <K.KjunText key={v} variant={v}>{v}</K.KjunText>)}</div>
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
    <div data-testid="stack-xs"><K.KjunStack gap="xs">{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-controls" style={{ width: 240 }}><K.KjunStack><K.KjunButton>저장</K.KjunButton><K.KjunBadge>신규</K.KjunBadge><K.KjunButton block>전체 폭</K.KjunButton></K.KjunStack></div>
    <div data-testid="stack-justify" style={{ height: 200 }}><K.KjunStack justify="between" style={{ height: 200 }}>{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-divider"><K.KjunStack gap="sm" divider>{boxes(3)}</K.KjunStack></div>
    <div data-testid="stack-responsive"><K.KjunStack gap={{ base: 'sm', medium: 'lg' }}>{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-smmd"><K.KjunStack gap="smMd">{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-inset"><K.KjunStack gap="md" divider="inset" dividerInset="lg">{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-strong"><K.KjunStack gap="md" divider="strong">{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-fragment"><K.KjunStack gap="sm" divider="strong">{boxes(1)}<>{boxes(2)}</></K.KjunStack></div>
    <div data-testid="stack-chip" style={{ width: 240 }}><K.KjunStack><K.KjunChip label="식비" /></K.KjunStack></div>
    <div data-testid="stack-direction"><K.KjunStack gap="md" direction={{ base: 'column', medium: 'row' }}>{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-padding"><K.KjunStack padding="md" paddingX="lg">{boxes(1)}</K.KjunStack></div>
    <div data-testid="stack-container" style={{ width: 280 }}><K.KjunStack responsive="container" gap={{ base: 'xs', wide: 'lg' }}>{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-viewport" style={{ width: 280 }}><K.KjunStack gap={{ base: 'xs', wide: 'lg' }}>{boxes(2)}</K.KjunStack></div>
    <div data-testid="stack-spacer" style={{ height: 200 }}><K.KjunStack gap="sm" divider="strong" style={{ height: 200 }}>{boxes(1)}<K.KjunSpacer />{boxes(1)}</K.KjunStack></div>
    <div data-testid="text-expand" style={{ width: 160, display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={2} expandable>{longSentence}</K.KjunText></div>
    <div data-testid="text-expand-short" style={{ width: 160, display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={2} expandable>짧은 글</K.KjunText></div>
    <div data-testid="inline-controls"><K.KjunInline><K.KjunButton size="lg">저장</K.KjunButton><K.KjunBadge>신규</K.KjunBadge></K.KjunInline></div>
    <div data-testid="stack-center-copy" style={{ width: 240 }}><K.KjunStack align="center"><K.KjunCopyButton value="KJUN" text="복사" /></K.KjunStack></div>
    <div data-testid="stack-align-responsive" style={{ width: 280 }}><K.KjunStack direction={{ base: 'column', medium: 'row' }} align={{ base: 'stretch', medium: 'center' }} justify={{ medium: 'between' }}>{boxes(1)}<K.KjunButton>보기</K.KjunButton></K.KjunStack></div>
    <div data-testid="inline-row-gap" style={{ width: 150 }}><K.KjunInline gap="sm" rowGap="md">{boxes(4, true)}</K.KjunInline></div>
    <div data-testid="inline-strong"><K.KjunInline gap="md" divider="strong">{boxes(2)}</K.KjunInline></div>
    <DividerToggle K={K} />
    {native ? <K.KjunStack testID="stack-native-props" accessibilityLabel="쌓인 영역">{boxes(1)}</K.KjunStack>
      : <K.KjunStack id="stack-web-id" aria-label="쌓인 영역">{boxes(1)}</K.KjunStack>}
    <div data-testid="free-form">{formLabels.free.map(field)}</div>
    {native
      ? <><KeyedStack K={K} />
        <div data-testid="stack-string"><K.KjunStack>문자열 자식</K.KjunStack></div>
        <div data-testid="stack-fragment-string"><K.KjunStack><>조각 안 문자열</></K.KjunStack></div></>
      : <><div data-testid="stack-app-markup"><K.KjunStack><h2>앱 제목</h2></K.KjunStack></div>
        <div data-testid="stack-list"><K.KjunStack as="ul" gap="sm" divider>{['주문 접수', '결제 완료', '배송 준비'].map(t => <li key={t}>{t}</li>)}</K.KjunStack></div>
        <div data-testid="stack-app-li"><K.KjunStack as="ul" className="app-steps" gap="sm" divider>{['주문 접수', '결제 완료'].map(t => <li key={t}>{t}</li>)}</K.KjunStack></div>
        <div data-testid="stack-app-gap"><K.KjunStack className="app-gap">{boxes(2)}</K.KjunStack></div>
        <SubmitStack K={K} />
        <div data-testid="nested-app-markup"><K.KjunStack><K.KjunStack><K.KjunInline><h2>안쪽 앱 제목</h2></K.KjunInline></K.KjunStack></K.KjunStack></div></>}
  </div>;
}
// Each child remembers the label it was first drawn with; with the app's keys kept, adding one in front leaves every
// child with its own label (index keys would shift them by one).
function Remembered({ K, label }: { K: any; label: string }) {
  const [first] = useState(label);
  return <K.KjunText>{first}</K.KjunText>;
}
function KeyedStack({ K }: { K: any }) {
  const [labels, setLabels] = useState(['둘째', '셋째']);
  return <div data-testid="stack-keys">
    <K.KjunButton onPress={() => setLabels(old => ['첫째', ...old])}>앞에 추가</K.KjunButton>
    <K.KjunStack>{labels.map(label => <Remembered key={label} K={K} label={label} />)}</K.KjunStack>
  </div>;
}
// A child that counts presses keeps its count when the stack's divider is turned on.
function Counter({ K }: { K: any }) {
  const [count, setCount] = useState(0);
  return <K.KjunButton onPress={() => setCount(n => n + 1)} onClick={() => setCount(n => n + 1)}>{'누름 ' + count}</K.KjunButton>;
}
function DividerToggle({ K }: { K: any }) {
  const [on, setOn] = useState(false);
  return <div data-testid="stack-toggle">
    <K.KjunButton onPress={() => setOn(v => !v)} onClick={() => setOn(v => !v)}>구분선 전환</K.KjunButton>
    <K.KjunStack divider={on}><Counter K={K} /><K.KjunText>둘째</K.KjunText></K.KjunStack>
  </div>;
}
// as="form" takes the form's own attributes (React types them from as).
function SubmitStack({ K }: { K: any }) {
  const [sent, setSent] = useState('보내지 않음');
  return <div data-testid="stack-form-tag">
    <K.KjunStack as="form" noValidate onSubmit={(event: { preventDefault(): void }) => { event.preventDefault(); setSent('보냄'); }}>
      <button type="submit">보내기</button><span>{sent}</span>
    </K.KjunStack>
  </div>;
}
