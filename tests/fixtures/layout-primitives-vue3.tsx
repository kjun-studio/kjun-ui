import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { boxCss, formLabels, longSentence, toneTexts, tones, variants } from './layout-primitives-values';
applyDemoColors('default');
document.head.append(Object.assign(document.createElement('style'), { textContent: boxCss }));
const boxes = (count: number, wide = false) => Array.from({ length: count }, (_, i) => <div key={i} class={'app-box' + (wide ? ' app-wide' : '')} />);
const field = (label: string) => <K.KjunFormGroup key={label} label={label}><K.KjunInput modelValue="" /></K.KjunFormGroup>;
createApp(() => <K.KjunProvider><div style={{ padding: '16px' }}>
  <div data-testid="text-variants">{variants.map(v => <K.KjunText key={v} variant={v}>{v}</K.KjunText>)}</div>
  <div data-testid="text-tones">{tones.map(t => <K.KjunText key={t} tone={t}>{toneTexts[t]}</K.KjunText>)}</div>
  <span data-testid="probe-secondary" style={{ color: 'var(--kjun-text-secondary)' }}>probe</span>
  <div data-testid="text-clamp" style={{ width: '120px', display: 'flex', flexDirection: 'column' }}><K.KjunText maxLines={1}>{longSentence}</K.KjunText></div>
  <div data-testid="stack-md"><K.KjunStack gap="md">{boxes(3)}</K.KjunStack></div>
  <div data-testid="stack-section"><K.KjunStack gap="section-md">{boxes(3)}</K.KjunStack></div>
  <div data-testid="inline-sm"><K.KjunInline gap="sm">{boxes(3)}</K.KjunInline></div>
  <div data-testid="inline-narrow"><K.KjunInline>{boxes(12, true)}</K.KjunInline></div>
  <div data-testid="stack-form"><K.KjunStack gap="md">{formLabels.stack.map(field)}</K.KjunStack></div>
  <div data-testid="free-form">{formLabels.free.map(field)}</div>
  <div data-testid="stack-app-markup"><K.KjunStack><h2>앱 제목</h2></K.KjunStack></div>
</div></K.KjunProvider>).mount('#root');
