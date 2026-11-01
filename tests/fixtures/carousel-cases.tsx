import { useState } from 'react';
// KjunCarousel cases for React and Native (Vue 3 mirrors this in carousel-vue3.tsx).
export const carouselSlides = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
export function CarouselCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [changes, setChanges] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [controlled, setControlled] = useState(carouselSlides);
  const [notes, setNotes] = useState(['Bravo', 'Charlie']);
  const [railChanges, setRailChanges] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const press = (action: () => void) => ({ [native ? 'onPress' : 'onClick']: action });
  const slide = (label: string, width?: number) => native
    ? <K.KjunText key={label} style={{ height: 120, width }}>{label}</K.KjunText>
    : <div key={label} style={{ height: 120, width, background: 'var(--kjun-secondary)' }}>{label}</div>;
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, width: 600 }}>
    <div data-testid="banner"><K.KjunCarousel ariaLabel="Banner" onIndexChange={(i: number) => setChanges(old => [...old, i])}>
      {carouselSlides.map(label => slide(label))}
    </K.KjunCarousel></div>
    <output data-testid="changes">{JSON.stringify(changes)}</output>
    <div data-testid="controlled"><K.KjunCarousel ariaLabel="Controlled" index={index} onIndexChange={setIndex}>
      {controlled.map(label => slide(label))}
    </K.KjunCarousel></div>
    <K.KjunButton variant="secondary" {...press(() => setIndex(2))}>Show Charlie</K.KjunButton>
    <K.KjunButton variant="secondary" {...press(() => setControlled(old => old.slice(0, -1)))}>Remove last</K.KjunButton>
    <output data-testid="index">{index}</output>
    <div data-testid="peek"><K.KjunCarousel ariaLabel="Peek" slideSize="peek" gap="sm">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="auto"><K.KjunCarousel ariaLabel="Auto" slideSize="auto" indicators={false}>{carouselSlides.map(label => slide(label, 200))}</K.KjunCarousel></div>
    <div data-testid="titled"><K.KjunCarousel title="추천 상품" titleAs="h3" slideSize="auto" indicators={false}>{carouselSlides.map(label => slide(label, 200))}</K.KjunCarousel></div>
    <div data-testid="counted"><K.KjunCarousel ariaLabel="Counted" indicators="count">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="rail"><K.KjunCarousel ariaLabel="Rail" slideSize="auto" onIndexChange={(i: number) => setRailChanges(old => [...old, i])}>{carouselSlides.map(label => slide(label, 200))}</K.KjunCarousel></div>
    <output data-testid="rail-changes">{JSON.stringify(railChanges)}</output>
    <div data-testid="hidden" style={{ display: revealed ? 'flex' : 'none', flexDirection: 'column' }}><K.KjunCarousel ariaLabel="Hidden" defaultIndex={2}>{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <K.KjunButton variant="secondary" {...press(() => setRevealed(true))}>Reveal</K.KjunButton>
    <div data-testid="centered"><K.KjunCarousel ariaLabel="Centered" slideSize="peek" snapAlign="center">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="bled" style={{ paddingLeft: 16, paddingRight: 16 }}><K.KjunCarousel ariaLabel="Bled" slideSize="peek" bleed="md">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="overlay"><K.KjunCarousel ariaLabel="Overlay" indicators="count" indicatorPlacement="overlay">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="overlay-dots"><K.KjunCarousel ariaLabel="Overlay dots" indicatorPlacement="overlay">{carouselSlides.map(label => slide(label))}</K.KjunCarousel></div>
    <div data-testid="single"><K.KjunCarousel ariaLabel="Single">{slide('Only')}</K.KjunCarousel></div>
    {!native && <div data-testid="form"><K.KjunCarousel ariaLabel="Form">
      <div style={{ height: 120 }}><input aria-label="Name" defaultValue="Kim" /></div>
      {slide('After')}
    </K.KjunCarousel></div>}
    {!native && <div data-testid="notes"><K.KjunCarousel ariaLabel="Notes" slideSize="auto">
      {notes.map(label => <label key={label} style={{ display: 'block', width: 200, height: 80 }}>{label}<input aria-label={'Note ' + label} /></label>)}
    </K.KjunCarousel><button type="button" onClick={() => setNotes(old => ['Alpha', ...old])}>Prepend</button></div>}
  </div></K.KjunProvider>;
}
