import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { carouselSlides } from './carousel-cases';
applyDemoColors('default');
// Same sections and DOM as carousel-cases.tsx (React/Native).
const slide = (label: string, width?: number) => <div key={label} style={{ height: '120px', width: width ? `${width}px` : undefined, background: 'var(--kjun-secondary)' }}>{label}</div>;
const App = defineComponent(() => {
  const changes = ref<number[]>([]), index = ref(0);
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', width: '600px' }}>
    <div data-testid="banner"><K.KjunCarousel ariaLabel="Banner" onUpdate:index={(i: number) => { changes.value = [...changes.value, i]; }}>
      {{ default: () => carouselSlides.map(label => slide(label)) }}
    </K.KjunCarousel></div>
    <output data-testid="changes">{JSON.stringify(changes.value)}</output>
    <div data-testid="controlled"><K.KjunCarousel ariaLabel="Controlled" index={index.value} onUpdate:index={(i: number) => { index.value = i; }}>
      {{ default: () => carouselSlides.map(label => slide(label)) }}
    </K.KjunCarousel></div>
    <K.KjunButton variant="secondary" onClick={() => { index.value = 2; }}>Show Charlie</K.KjunButton>
    <output data-testid="index">{index.value}</output>
    <div data-testid="peek"><K.KjunCarousel ariaLabel="Peek" slideSize="peek" gap="sm">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="auto"><K.KjunCarousel ariaLabel="Auto" slideSize="auto" indicators={false}>{{ default: () => carouselSlides.map(label => slide(label, 200)) }}</K.KjunCarousel></div>
    <div data-testid="single"><K.KjunCarousel ariaLabel="Single">{{ default: () => slide('Only') }}</K.KjunCarousel></div>
    <div data-testid="form"><K.KjunCarousel ariaLabel="Form">{{ default: () => [
      <div style={{ height: '120px' }}><input aria-label="Name" value="Kim" /></div>, slide('After')] }}</K.KjunCarousel></div>
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
