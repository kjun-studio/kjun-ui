import { useState } from 'react';
// KjunCarousel cases for React and Native (Vue 3 mirrors this in carousel-vue3.tsx).
export const carouselSlides = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
export function CarouselCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [changes, setChanges] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const slide = (label: string, width?: number) => native
    ? <K.KjunText key={label} style={{ height: 120, width }}>{label}</K.KjunText>
    : <div key={label} style={{ height: 120, width, background: 'var(--kjun-secondary)' }}>{label}</div>;
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, width: 600 }}>
    <div data-testid="banner"><K.KjunCarousel ariaLabel="Banner" onIndexChange={(i: number) => setChanges(old => [...old, i])}>
      {carouselSlides.map(label => slide(label))}
    </K.KjunCarousel></div>
    <output data-testid="changes">{JSON.stringify(changes)}</output>
    <div data-testid="controlled"><K.KjunCarousel ariaLabel="Controlled" index={index} onIndexChange={setIndex}>
      {carouselSlides.map(label => slide(label))}
    </K.KjunCarousel></div>
    <K.KjunButton variant="secondary" {...{ [native ? 'onPress' : 'onClick']: () => setIndex(2) }}>Show Charlie</K.KjunButton>
    <output data-testid="index">{index}</output>
    <div data-testid="peek"><K.KjunCarousel ariaLabel="Peek" slideSize="peek" gap="sm">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="auto"><K.KjunCarousel ariaLabel="Auto" slideSize="auto" indicators={false}>{carouselSlides.map(label => slide(label, 200))}</K.KjunCarousel></div>
    <div data-testid="single"><K.KjunCarousel ariaLabel="Single">{slide('Only')}</K.KjunCarousel></div>
    {!native && <div data-testid="form"><K.KjunCarousel ariaLabel="Form">
      <div style={{ height: 120 }}><input aria-label="Name" defaultValue="Kim" /></div>
      {slide('After')}
    </K.KjunCarousel></div>}
  </div></K.KjunProvider>;
}
