import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { carouselKey, carouselTarget, clampSlide, nearestSlide, type CarouselGap, type CarouselSlideSize } from "../../../shared/package-runtime/carousel";
import { Children, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { KjunButton } from "./button";
import { useReducedMotion } from "./use-reduced-motion";

export interface KjunCarouselProps {
  /** Names the region, e.g. "추천 상품". */
  ariaLabel: string;
  /** Each direct child is one slide. */
  children?: ReactNode;
  /** full: as wide as the carousel; peek: the next slide shows at the edge; auto: each slide keeps its own width. */
  slideSize?: CarouselSlideSize;
  gap?: CarouselGap;
  /** Controlled current slide; pair with onIndexChange. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  indicators?: boolean;
  /** Previous and next buttons, shown only to pointers that can hover. */
  controls?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** A row of slides moved by swipe, keyboard, buttons or dots. It never moves on its own. */
export function KjunCarousel({ ariaLabel, children, slideSize = "full", gap = "md", index, defaultIndex = 0, onIndexChange,
  indicators = true, controls = true, className, style, id }: KjunCarouselProps) {
  const m = useKjunMessages();
  const reduced = useReducedMotion();
  const slides = Children.toArray(children);
  const count = slides.length;
  const viewport = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(() => clampSlide(defaultIndex, count));
  const current = clampSlide(index ?? own, count);
  const settled = useRef(current);

  const offsets = () => Array.from(viewport.current?.children ?? [], el => (el as HTMLElement).offsetLeft - (viewport.current!.firstElementChild as HTMLElement).offsetLeft);
  const scrollTo = (target: number, smooth: boolean) => {
    const el = viewport.current;
    if (el) el.scrollTo({ left: offsets()[target] ?? 0, behavior: smooth && !reduced ? "smooth" : "auto" });
  };
  const change = (next: number) => {
    if (next === settled.current) return;
    settled.current = next;
    if (index === undefined) setOwn(next);
    onIndexChange?.(next);
  };
  const go = (target: number) => { scrollTo(target, true); change(target); };

  // Follow a controlled index, and keep a removed slide from leaving the view past the end. The first slide shown jumps.
  const mounted = useRef(false);
  useEffect(() => {
    settled.current = current;
    const el = viewport.current;
    if (el && nearestSlide(offsets(), el.scrollLeft, el.scrollWidth - el.clientWidth) !== current) scrollTo(current, mounted.current);
    mounted.current = true;
  }, [current, count]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => { clearTimeout(timer); change(nearestSlide(offsets(), el.scrollLeft, el.scrollWidth - el.clientWidth)); };
    // Browsers without scrollend settle shortly after the last scroll event.
    const scroll = () => { clearTimeout(timer); timer = setTimeout(settle, 120); };
    el.addEventListener("scroll", scroll, { passive: true });
    el.addEventListener("scrollend", settle);
    return () => { clearTimeout(timer); el.removeEventListener("scroll", scroll); el.removeEventListener("scrollend", settle); };
  });

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = event.target === event.currentTarget ? carouselKey(event.key) : undefined;
    if (!move) return;
    event.preventDefault();
    go(carouselTarget(move, current, count));
  };

  return (
    <section id={id} className={className ? `kjun-carousel ${className}` : "kjun-carousel"} style={style}
      aria-roledescription={m.carousel} aria-label={ariaLabel} data-size={slideSize} data-gap={gap}>
      <div className="kjun-carousel-frame">
        <div ref={viewport} className="kjun-carousel-viewport" tabIndex={0} onKeyDown={keyDown}>
          {slides.map((slide, i) => (
            <div key={i} className="kjun-carousel-slide" role="group" aria-roledescription={m.slide} aria-label={m.slideOf(i + 1, count)}
              data-current={i === current ? "" : undefined}>{slide}</div>
          ))}
        </div>
        {controls && count > 1 && <>
          <KjunButton className="kjun-carousel-control" data-direction="previous" variant="secondary" shape="circle" size="sm"
            prefixIcon="chevron-left" ariaLabel={m.previousSlide} disabled={current === 0} onClick={() => go(current - 1)} />
          <KjunButton className="kjun-carousel-control" data-direction="next" variant="secondary" shape="circle" size="sm"
            prefixIcon="chevron-right" ariaLabel={m.nextSlide} disabled={current === count - 1} onClick={() => go(current + 1)} />
        </>}
      </div>
      {indicators && count > 1 && (
        <div className="kjun-carousel-indicators" role="group" aria-label={m.slides}>
          {slides.map((_, i) => (
            <button key={i} type="button" className="kjun-carousel-indicator" aria-label={m.goToSlide(i + 1)}
              aria-current={i === current ? "true" : undefined} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </section>
  );
}
