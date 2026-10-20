import { formLabels, longSentence, toneTexts, tones, variants } from './layout-primitives-values';
const boxes = (count: number, wide = false) => Array.from({ length: count }, (_, i) =>
  <div key={i} className={'app-box' + (wide ? ' app-wide' : '')} />);
export function LayoutCases({ K, native = false }: { K: any; native?: boolean }) {
  const field = (label: string) => <K.KjunFormGroup key={label} label={label}><K.KjunInput value="" onValueChange={() => {}} /></K.KjunFormGroup>;
  return <div style={{ padding: 16 }}>
    <div data-testid="text-variants">{variants.map(v => <K.KjunText key={v} variant={v}>{v}</K.KjunText>)}</div>
    <div data-testid="text-tones">{tones.map(t => <K.KjunText key={t} tone={t}>{toneTexts[t]}</K.KjunText>)}</div>
    <span data-testid="probe-secondary" style={{ color: 'var(--kjun-text-secondary)' }}>probe</span>
    {/* A flex column like a Native View: RN Web Text is inline and only takes its parent's width inside one. */}
    <div data-testid="text-clamp" style={{ width: 120, display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={1}>{longSentence}</K.KjunText></div>
    <div data-testid="stack-md"><K.KjunStack gap="md">{boxes(3)}</K.KjunStack></div>
    <div data-testid="stack-section"><K.KjunStack gap="section-md">{boxes(3)}</K.KjunStack></div>
    <div data-testid="inline-sm"><K.KjunInline gap="sm">{boxes(3)}</K.KjunInline></div>
    <div data-testid="inline-narrow"><K.KjunInline>{boxes(12, true)}</K.KjunInline></div>
    <div data-testid="stack-form"><K.KjunStack gap="md">{formLabels.stack.map(field)}</K.KjunStack></div>
    <div data-testid="free-form">{formLabels.free.map(field)}</div>
    {native
      ? <div data-testid="stack-string"><K.KjunStack>문자열 자식</K.KjunStack></div>
      : <><div data-testid="stack-app-markup"><K.KjunStack><h2>앱 제목</h2></K.KjunStack></div>
        <div data-testid="nested-app-markup"><K.KjunStack><K.KjunStack><K.KjunInline><h2>안쪽 앱 제목</h2></K.KjunInline></K.KjunStack></K.KjunStack></div></>}
  </div>;
}
