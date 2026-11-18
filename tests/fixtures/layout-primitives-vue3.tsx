import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { boxCss, formLabels, longSentence, narrowNumber, toneProbes, toneTexts, tones, variants } from './layout-primitives-values';
applyDemoColors('default');
document.head.append(Object.assign(document.createElement('style'), { textContent: boxCss }));
const boxes = (count: number, wide = false) => Array.from({ length: count }, (_, i) => <div key={i} class={'app-box' + (wide ? ' app-wide' : '')} />);
const field = (label: string) => <K.KjunFormGroup key={label} label={label}><K.KjunInput modelValue="" /></K.KjunFormGroup>;
createApp(() => <K.KjunProvider><div style={{ padding: '16px' }}>
  <div data-testid="text-variants" style={{ overflowX: 'hidden' }}>{variants.map(v => <K.KjunText key={v} variant={v}>{v}</K.KjunText>)}</div>
  <div data-testid="text-tones">{tones.map(t => <K.KjunText key={t} tone={t}>{toneTexts[t]}</K.KjunText>)}</div>
  {Object.entries(toneProbes).map(([tone, value]) => <span key={tone} data-testid={'probe-' + tone} style={{ color: `var(${value})` }}>probe</span>)}
  <div data-testid="text-features">
    <K.KjunText variant="sectionTitle">이번 달 <K.KjunText variant="inherit" tone="danger">3건</K.KjunText> 실패</K.KjunText>
    <K.KjunText numeric>1111</K.KjunText>
    <K.KjunText decoration="lineThrough">할인 전 가격</K.KjunText>
    <dl><K.KjunText as="dt" variant="caption" title="결제 수단 전체 이름" lang="ko">결제 수단</K.KjunText></dl>
    <K.KjunText maxLines={0.5}>줄 수가 1보다 작으면 줄이지 않습니다</K.KjunText>
  </div>
  <div data-testid="display-narrow" style={{ width: '60px', display: 'flex', flexDirection: 'column' }}><K.KjunText variant="displayMd">{narrowNumber}</K.KjunText></div>
  <div data-testid="text-clamp" style={{ width: '120px', display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={1}>{longSentence}</K.KjunText></div>
  <div data-testid="text-number"><K.KjunText variant="numberMd">1234</K.KjunText></div>
  <div data-testid="text-link"><K.KjunText>약관에 <a href="#terms">동의</a>합니다</K.KjunText></div>
  <div data-testid="app-prose" class="app-prose"><K.KjunText>앱 본문 안의 글자</K.KjunText></div>
  <div data-testid="text-focus">
    <K.KjunText as="h2" variant="sectionTitle" tabindex={-1} ref={(text: any) => { (window as any).kjunHeading = text?.$el; }}>새 화면 제목</K.KjunText>
    <K.KjunText role="status">저장했습니다</K.KjunText>
  </div>
  <div data-testid="number-narrow" style={{ width: '40px', display: 'flex', flexDirection: 'column' }}><K.KjunText variant="numberMd">{narrowNumber}</K.KjunText></div>
  <div data-testid="stack-md"><K.KjunStack gap="md">{boxes(3)}</K.KjunStack></div>
  <div data-testid="stack-section"><K.KjunStack gap="section-md">{boxes(3)}</K.KjunStack></div>
  <div data-testid="inline-sm"><K.KjunInline gap="sm">{boxes(3)}</K.KjunInline></div>
  <div data-testid="inline-narrow"><K.KjunInline>{boxes(12, true)}</K.KjunInline></div>
  <div data-testid="stack-form"><K.KjunStack gap="md">{formLabels.stack.map(field)}</K.KjunStack></div>
  <div data-testid="stack-xs"><K.KjunStack gap="xs">{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-controls" style={{ width: '240px' }}><K.KjunStack><K.KjunButton>저장</K.KjunButton><K.KjunBadge>신규</K.KjunBadge><K.KjunButton block>전체 폭</K.KjunButton></K.KjunStack></div>
  <div data-testid="stack-justify" style={{ height: '200px' }}><K.KjunStack justify="between" style={{ height: '200px' }}>{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-divider"><K.KjunStack gap="sm" divider>{boxes(3)}</K.KjunStack></div>
  <div data-testid="stack-responsive"><K.KjunStack gap={{ base: 'sm', medium: 'lg' }}>{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-smmd"><K.KjunStack gap="smMd">{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-inset"><K.KjunStack gap="md" divider="inset" dividerInset="lg">{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-strong"><K.KjunStack gap="md" divider="strong">{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-fragment"><K.KjunStack gap="sm" divider="strong">{boxes(1)}{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-chip" style={{ width: '240px' }}><K.KjunStack><K.KjunChip label="식비" /></K.KjunStack></div>
  <div data-testid="stack-direction"><K.KjunStack gap="md" direction={{ base: 'column', medium: 'row' }}>{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-padding"><K.KjunStack padding="md" paddingX="lg">{boxes(1)}</K.KjunStack></div>
  <div data-testid="stack-container" style={{ width: '280px' }}><K.KjunStack responsive="container" gap={{ base: 'xs', wide: 'lg' }}>{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-viewport" style={{ width: '280px' }}><K.KjunStack gap={{ base: 'xs', wide: 'lg' }}>{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-spacer" style={{ height: '200px' }}><K.KjunStack gap="sm" divider="strong" style={{ height: '200px' }}>{boxes(1)}<K.KjunSpacer />{boxes(1)}</K.KjunStack></div>
  <div data-testid="text-expand" style={{ width: '160px', display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={2} expandable>{longSentence}</K.KjunText></div>
  <div data-testid="text-expand-short" style={{ width: '160px', display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={2} expandable>짧은 글</K.KjunText></div>
  <div data-testid="inline-controls"><K.KjunInline><K.KjunButton size="lg">저장</K.KjunButton><K.KjunBadge>신규</K.KjunBadge></K.KjunInline></div>
  <div data-testid="stack-center-copy" style={{ width: '240px' }}><K.KjunStack align="center"><K.KjunCopyButton value="KJUN" text="복사" /></K.KjunStack></div>
  <div data-testid="stack-align-responsive" style={{ width: '280px' }}><K.KjunStack direction={{ base: 'column', medium: 'row' }} align={{ base: 'stretch', medium: 'center' }} justify={{ medium: 'between' }}>{boxes(1)}<K.KjunButton>보기</K.KjunButton></K.KjunStack></div>
  <div data-testid="inline-row-gap" style={{ width: '150px' }}><K.KjunInline gap="sm" rowGap="md">{boxes(4, true)}</K.KjunInline></div>
  <div data-testid="inline-strong"><K.KjunInline gap="md" divider="strong">{boxes(2)}</K.KjunInline></div>
  <div data-testid="stack-app-li"><K.KjunStack as="ul" class="app-steps" gap="sm" divider>{['주문 접수', '결제 완료'].map(t => <li key={t}>{t}</li>)}</K.KjunStack></div>
  <div data-testid="stack-app-gap"><K.KjunStack class="app-gap">{boxes(2)}</K.KjunStack></div>
  <div data-testid="stack-form-tag"><K.KjunStack as="form" novalidate onSubmit={(event: Event) => { event.preventDefault(); (event.target as HTMLElement).querySelector('span')!.textContent = '보냄'; }}>
    <button type="submit">보내기</button><span>보내지 않음</span>
  </K.KjunStack></div>
  <K.KjunStack id="stack-web-id" aria-label="쌓인 영역">{boxes(1)}</K.KjunStack>
  <div data-testid="stack-list"><K.KjunStack as="ul" gap="sm" divider>{['주문 접수', '결제 완료', '배송 준비'].map(t => <li key={t}>{t}</li>)}</K.KjunStack></div>
  <div data-testid="free-form">{formLabels.free.map(field)}</div>
  <div data-testid="stack-app-markup"><K.KjunStack><h2>앱 제목</h2></K.KjunStack></div>
  <div data-testid="nested-app-markup"><K.KjunStack><K.KjunStack><K.KjunInline><h2>안쪽 앱 제목</h2></K.KjunInline></K.KjunStack></K.KjunStack></div>
</div></K.KjunProvider>).mount('#root');
