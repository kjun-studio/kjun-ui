import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { carouselKey, carouselTarget, clampSlide, nearestSlide, warnCarouselSetup, type CarouselGap, type CarouselSlideSize } from "../../../shared/package-runtime/carousel";
import { Children, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { KjunButton } from "./button";
import { useReducedMotion } from "./use-reduced-motion";

export interface KjunCarouselProps {
  /** Names the region, e.g. "추천 상품". Required unless title names it. */
  ariaLabel?: string;
  /** A section title above the slides; the region takes its name, and previous and next buttons move beside it. */
  title?: string;
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
  /**
   * Previous and next buttons for pointers that can hover; touch screens swipe instead. Without a title they float at
   * the slide edges while the pointer or focus is inside, and only toward a slide that exists. A mouse wheel does not
   * move a carousel, so keep these or the indicators on.
   */
  controls?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** A row of slides moved by swipe, keyboard, buttons or dots. It never moves on its own. */
export function KjunCarousel({ ariaLabel, title, children, slideSize = "full", gap = "md", index, defaultIndex = 0, onIndexChange,
  indicators = true, controls = true, className, style, id }: KjunCarouselProps) {
  const m = useKjunMessages();
  const reduced = useReducedMotion();
  const slides = Children.toArray(children);
  const count = slides.length;
  const viewport = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(() => clampSlide(defaultIndex, count));
  const current = clampSlide(index ?? own, count);
  const settled = useRef(current);
  const titleId = "kjun-carousel-" + useId().replace(/:/g, "");
  useEffect(() => warnCarouselSetup({ controls, indicators, named: !!(ariaLabel || title) }), [controls, indicators, ariaLabel, title]);

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
  // A side button disappears at the end it leads to; keep focus in the carousel instead of dropping it to the page.
  const step = (target: number) => {
    const leaving = !title && (target === 0 || target === count - 1);
    go(target);
    if (leaving) viewport.current?.focus({ preventScroll: true });
  };

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

  const button = (direction: "previous" | "next") => {
    const target = direction === "previous" ? current - 1 : current + 1;
    return <KjunButton key={direction} className="kjun-carousel-control" data-direction={direction} variant="secondary" shape="circle" size="sm"
      prefixIcon={direction === "previous" ? "chevron-left" : "chevron-right"} ariaLabel={direction === "previous" ? m.previousSlide : m.nextSlide}
      disabled={target < 0 || target >= count} onClick={() => step(target)} />;
  };
  const buttons = controls && count > 1;

  return (
    <section id={id} className={className ? `kjun-carousel ${className}` : "kjun-carousel"} style={style}
      aria-roledescription={m.carousel} aria-label={ariaLabel} aria-labelledby={ariaLabel || !title ? undefined : titleId}
      data-size={slideSize} data-gap={gap} data-controls={buttons ? (title ? "header" : "sides") : undefined}>
      {title && (
        <div className="kjun-carousel-header">
          <h2 id={titleId} className="kjun-carousel-title kjun-type-section-title">{title}</h2>
          {buttons && <div className="kjun-carousel-header-controls">{button("previous")}{button("next")}</div>}
        </div>
      )}
      <div className="kjun-carousel-frame">
        <div ref={viewport} className="kjun-carousel-viewport" tabIndex={0} onKeyDown={keyDown}>
          {slides.map((slide, i) => (
            <div key={i} className="kjun-carousel-slide" role="group" aria-roledescription={m.slide} aria-label={m.slideOf(i + 1, count)}
              data-current={i === current ? "" : undefined}>{slide}</div>
          ))}
        </div>
        {buttons && !title && <>{current > 0 && button("previous")}{current < count - 1 && button("next")}</>}
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
