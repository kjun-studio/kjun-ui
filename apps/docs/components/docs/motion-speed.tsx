'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DsButtonGroup } from '@kjun-ui/react';

// One playback rate for every demo on the page, so a slowed comparison stays comparable.
type Speed = { rate: number; setRate: (rate: number) => void };
const SpeedContext = createContext<Speed>({ rate: 1, setRate: () => {} });
export const useMotionSpeed = () => useContext(SpeedContext);

export function MotionSpeedProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(1);
  return <SpeedContext.Provider value={{ rate, setRate }}>{children}</SpeedContext.Provider>;
}

// The only playback control on the page; it floats only while a demo is on screen,
// so it never sits over reading content between demos.
export function SpeedDock() {
  const dock = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const demos = dock.current?.parentElement?.querySelectorAll('.motion-figure, .motion-playground');
    if (!demos?.length) return;
    const shown = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) { if (entry.isIntersecting) shown.add(entry.target); else shown.delete(entry.target); }
      setVisible(shown.size > 0);
    });
    demos.forEach(demo => observer.observe(demo));
    return () => observer.disconnect();
  }, []);
  return <div ref={dock} className="motion-speed-dock" data-visible={visible}><SpeedToggle /></div>;
}

function SpeedToggle() {
  const { rate, setRate } = useMotionSpeed();
  return <div className="motion-speed">
    <span aria-hidden="true">재생 속도</span>
    <DsButtonGroup size="xs" ariaLabel="재생 속도" value={String(rate)}
      options={[{ value: '1', label: '1×' }, { value: '0.25', label: '0.25×' }]}
      onValueChange={value => setRate(Number(value))} />
  </div>;
}
