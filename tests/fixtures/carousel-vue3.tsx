import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { carouselSlides } from './carousel-cases';
applyDemoColors('default');
// Same sections and DOM as carousel-cases.tsx (React/Native).
const slide = (label: string, width?: number) => <div key={label} style={{ height: '120px', width: width ? `${width}px` : undefined, background: 'var(--kjun-secondary)' }}>{label}</div>;
const App = defineComponent(() => {
  const changes = ref<number[]>([]), index = ref(0), controlled = ref([...carouselSlides]), notes = ref(['Bravo', 'Charlie']), railChanges = ref<number[]>([]), revealed = ref(false);
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', width: '600px' }}>
    <div data-testid="banner"><K.KjunCarousel ariaLabel="Banner" onUpdate:index={(i: number) => { changes.value = [...changes.value, i]; }}>
      {{ default: () => carouselSlides.map(label => slide(label)) }}
    </K.KjunCarousel></div>
    <output data-testid="changes">{JSON.stringify(changes.value)}</output>
    <div data-testid="controlled"><K.KjunCarousel ariaLabel="Controlled" index={index.value} onUpdate:index={(i: number) => { index.value = i; }}>
      {{ default: () => controlled.value.map(label => slide(label)) }}
    </K.KjunCarousel></div>
    <K.KjunButton variant="secondary" onClick={() => { index.value = 2; }}>Show Charlie</K.KjunButton>
    <K.KjunButton variant="secondary" onClick={() => { controlled.value = controlled.value.slice(0, -1); }}>Remove last</K.KjunButton>
    <output data-testid="index">{index.value}</output>
    <div data-testid="peek"><K.KjunCarousel ariaLabel="Peek" slideSize="peek" gap="sm">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="auto"><K.KjunCarousel ariaLabel="Auto" slideSize="auto" indicators={false}>{{ default: () => carouselSlides.map(label => slide(label, 200)) }}</K.KjunCarousel></div>
    <div data-testid="titled"><K.KjunCarousel title="추천 상품" titleAs="h3" slideSize="auto" indicators={false}>{{ default: () => carouselSlides.map(label => slide(label, 200)) }}</K.KjunCarousel></div>
    <div data-testid="counted"><K.KjunCarousel ariaLabel="Counted" indicators="count">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="rail"><K.KjunCarousel ariaLabel="Rail" slideSize="auto" onUpdate:index={(i: number) => { railChanges.value = [...railChanges.value, i]; }}>{{ default: () => carouselSlides.map(label => slide(label, 200)) }}</K.KjunCarousel></div>
    <output data-testid="rail-changes">{JSON.stringify(railChanges.value)}</output>
    <div data-testid="hidden" style={{ display: revealed.value ? 'flex' : 'none', flexDirection: 'column' }}><K.KjunCarousel ariaLabel="Hidden" defaultIndex={2}>{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <K.KjunButton variant="secondary" onClick={() => { revealed.value = true; }}>Reveal</K.KjunButton>
    <div data-testid="centered"><K.KjunCarousel ariaLabel="Centered" slideSize="peek" snapAlign="center">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="bled" style={{ paddingLeft: '16px', paddingRight: '16px' }}><K.KjunCarousel ariaLabel="Bled" slideSize="peek" bleed="md">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="overlay"><K.KjunCarousel ariaLabel="Overlay" indicators="count" indicatorPlacement="overlay">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="overlay-dots"><K.KjunCarousel ariaLabel="Overlay dots" indicatorPlacement="overlay">{{ default: () => carouselSlides.map(label => slide(label)) }}</K.KjunCarousel></div>
    <div data-testid="single"><K.KjunCarousel ariaLabel="Single">{{ default: () => slide('Only') }}</K.KjunCarousel></div>
    <div data-testid="form"><K.KjunCarousel ariaLabel="Form">{{ default: () => [
      <div style={{ height: '120px' }}><input aria-label="Name" value="Kim" /></div>, slide('After')] }}</K.KjunCarousel></div>
    <div data-testid="notes"><K.KjunCarousel ariaLabel="Notes" slideSize="auto">{{ default: () => notes.value.map(label =>
      <label key={label} style={{ display: 'block', width: '200px', height: '80px' }}>{label}<input aria-label={'Note ' + label} /></label>) }}</K.KjunCarousel>
      <button type="button" onClick={() => { notes.value = ['Alpha', ...notes.value]; }}>Prepend</button></div>
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
