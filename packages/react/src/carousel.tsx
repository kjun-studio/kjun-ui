import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { carouselKey, carouselTarget, clampSlide, indicatorMode, warnCarouselSetup,
  type CarouselGap, type CarouselIndicators, type CarouselSlideSize, type CarouselTitleTag } from "../../../shared/package-runtime/carousel";
import { createCarouselScroller, type CarouselScroller } from "../../../shared/package-runtime/carousel-scroll";
import { Children, isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { KjunButton } from "./button";
import { useReducedMotion } from "./use-reduced-motion";

export interface KjunCarouselProps {
  /** Names the region, e.g. "추천 상품". Required unless title names it. */
  ariaLabel?: string;
  /** A section title above the slides; the region takes its name, and previous and next buttons move beside it. */
  title?: string;
  /** The title's heading level (default h2). */
  titleAs?: CarouselTitleTag;
  /** Each direct child is one slide. */
  children?: ReactNode;
  /** full: as wide as the carousel; peek: the next slide shows at the edge; auto: each slide keeps its own width. */
  slideSize?: CarouselSlideSize;
  gap?: CarouselGap;
  /** Controlled current slide; pair with onIndexChange. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Dots under the slides (true or "dots"), the position as "3 / 24" text ("count") for many slides, or none (false). */
  indicators?: CarouselIndicators;
  /**
   * Previous and next buttons for pointers that can hover; touch screens swipe instead. Without a title they float at
   * the slide edges while the pointer or focus is inside, and only toward a slide that exists.
   */
  controls?: boolean;
  /** A mouse can drag the slides; a drag past a fifth of the view moves one slide. A mouse wheel does not move a carousel. */
  mouseDrag?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** A row of slides moved by swipe, drag, keyboard, buttons or dots. It never moves on its own. */
export function KjunCarousel({ ariaLabel, title, titleAs: Title = "h2", children, slideSize = "full", gap = "md", index, defaultIndex = 0,
  onIndexChange, indicators = true, controls = true, mouseDrag = true, className, style, id }: KjunCarouselProps) {
  const m = useKjunMessages();
  const reduced = useReducedMotion();
  const slides = Children.toArray(children);
  const count = slides.length;
  const viewport = useRef<HTMLDivElement>(null);
  const scroller = useRef<CarouselScroller>(undefined);
  const [own, setOwn] = useState(() => clampSlide(defaultIndex, count));
  // Announce the position only after the carousel has moved, not when the page loads.
  const [moved, setMoved] = useState(false);
  const current = clampSlide(index ?? own, count);
  const settled = useRef(current);
  const titleId = "kjun-carousel-" + useId().replace(/:/g, "");
  const marks = indicatorMode(indicators);
  useEffect(() => warnCarouselSetup({ controls, dots: marks === "dots", mouseDrag, named: !!(ariaLabel || title) }), [controls, marks, mouseDrag, ariaLabel, title]);

  const change = (next: number) => {
    if (next === settled.current) return;
    settled.current = next;
    setMoved(true);
    if (index === undefined) setOwn(next);
    onIndexChange?.(next);
  };
  const go = (target: number) => { scroller.current?.scrollTo(target, !reduced); change(target); };
  // A side button disappears at the end it leads to; keep focus in the carousel instead of dropping it to the page.
  const step = (target: number) => {
    const leaving = !title && (target === 0 || target === count - 1);
    go(target);
    if (leaving) viewport.current?.focus({ preventScroll: true });
  };

  // The scroller lives as long as the viewport and reads the latest render through this ref.
  const latest = useRef({ change, go, current, mouseDrag });
  latest.current = { change, go, current, mouseDrag };
  useEffect(() => {
    const instance = createCarouselScroller(viewport.current!, {
      onSettle: next => latest.current.change(next),
      onDragEnd: target => latest.current.go(target),
      current: () => latest.current.current,
      mouseDrag: () => latest.current.mouseDrag,
    });
    scroller.current = instance;
    return () => { instance.destroy(); scroller.current = undefined; };
  }, []);

  // Follow a controlled index, and keep a removed slide from leaving the view past the end. The first slide shown jumps.
  const mounted = useRef(false);
  useEffect(() => {
    settled.current = current;
    if (scroller.current && scroller.current.nearest() !== current) scroller.current.scrollTo(current, mounted.current && !reduced);
    mounted.current = true;
  }, [current, count]);

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
      data-size={slideSize} data-gap={gap} data-controls={buttons ? (title ? "header" : "sides") : undefined}
      data-mouse-drag={mouseDrag && count > 1 ? "" : undefined}>
      {title && (
        <div className="kjun-carousel-header">
          <Title id={titleId} className="kjun-carousel-title kjun-type-section-title">{title}</Title>
          {buttons && <div className="kjun-carousel-header-controls">{button("previous")}{button("next")}</div>}
        </div>
      )}
      <div className="kjun-carousel-frame">
        <div ref={viewport} className="kjun-carousel-viewport" tabIndex={0} onKeyDown={keyDown}>
          {slides.map((slide, i) => (
            <div key={isValidElement(slide) && slide.key != null ? slide.key : i} className="kjun-carousel-slide" role="group"
              aria-roledescription={m.slide} aria-label={m.slideOf(i + 1, count)} data-current={i === current ? "" : undefined}>{slide}</div>
          ))}
        </div>
        {buttons && !title && <>{current > 0 && button("previous")}{current < count - 1 && button("next")}</>}
      </div>
      {marks === "dots" && count > 1 && (
        <div className="kjun-carousel-indicators" role="group" aria-label={m.slides}>
          {slides.map((_, i) => (
            <button key={i} type="button" className="kjun-carousel-indicator" aria-label={m.goToSlide(i + 1)}
              aria-current={i === current ? "true" : undefined} onClick={() => go(i)} />
          ))}
        </div>
      )}
      {marks === "count" && count > 1 && <div className="kjun-carousel-count" aria-hidden="true">{current + 1} / {count}</div>}
      <div className="kjun-sr-only" aria-live="polite">{moved ? m.slideOf(current + 1, count) : ""}</div>
    </section>
  );
}
