import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { carouselKey, carouselTarget, clampSlide, indicatorMode, stepFocus, stepTarget, stopDots, warnCarouselSetup, type CarouselBleed,
  type CarouselGap, type CarouselIndicatorPlacement, type CarouselIndicators, type CarouselSlideSize, type CarouselSnapAlign, type CarouselTitleTag } from "../../../shared/package-runtime/carousel";
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
  /** An action at the end of the title row, before the previous and next buttons, e.g. a "전체 보기" link button. */
  action?: ReactNode;
  /** Each direct child is one slide. */
  children?: ReactNode;
  /** full: as wide as the carousel; peek: the next slide shows at the edge; auto: each slide keeps its own width. */
  slideSize?: CarouselSlideSize;
  /**
   * Each slide at least this many pixels wide: as many as fit share the row (never fewer than one), so no slide is cut at
   * the edge. Takes the place of slideSize.
   */
  minSlideWidth?: number;
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
  /** start lines each slide up with the start edge; center keeps the current slide centred (with peek, a neighbour shows on each side). */
  snapAlign?: CarouselSnapAlign;
  /** Reaches past the page's side padding by this inset (12, 16 or 24) while the first slide lines up with the content. */
  bleed?: CarouselBleed;
  /** below: under the slides; overlay: on the slides, in a scrim pill that stays legible over images. */
  indicatorPlacement?: CarouselIndicatorPlacement;
  /** A mouse can drag the slides; a drag past a fifth of the view moves one slide. A mouse wheel does not move a carousel. */
  mouseDrag?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** A row of slides moved by swipe, drag, keyboard, buttons or dots. It never moves on its own. */
export function KjunCarousel({ ariaLabel, title, titleAs: Title = "h2", action, children, slideSize = "full", minSlideWidth, gap = "md", index, defaultIndex = 0,
  onIndexChange, indicators = true, controls = true, mouseDrag = true, snapAlign = "start", bleed = "none", indicatorPlacement = "below", className, style, id }: KjunCarouselProps) {
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
  const root = useRef<HTMLElement>(null);
  const [stops, setStops] = useState<number[]>();
  useEffect(() => warnCarouselSetup({ controls, dots: marks === "dots", mouseDrag, named: !!(ariaLabel || title) }), [controls, marks, mouseDrag, ariaLabel, title]);

  const change = (next: number) => {
    if (next === settled.current) return;
    settled.current = next;
    setMoved(true);
    if (index === undefined) setOwn(next);
    onIndexChange?.(next);
  };
  const go = (target: number) => { scroller.current?.scrollTo(target, !reduced); change(target); };
  // At an end a side button disappears and a header button turns off; focus stays in the carousel instead of dropping to the page.
  const step = (target: number) => {
    // Both button sets keep both buttons and turn the one at an end off, so focus moves to the other.
    const next = stepFocus(stops, target, count, true);
    go(target);
    // After the render that enables the other header button.
    if (next) requestAnimationFrame(() => (next === "viewport" ? viewport.current
      : root.current?.querySelector<HTMLElement>(`.kjun-carousel-control[data-direction="${next}"]`))?.focus({ preventScroll: true }));
  };

  // The scroller lives as long as the viewport and reads the latest render through this ref.
  const latest = useRef({ change, go, current, mouseDrag, snapAlign, minSlideWidth });
  latest.current = { change, go, current, mouseDrag, snapAlign, minSlideWidth };
  useEffect(() => {
    const instance = createCarouselScroller(viewport.current!, {
      onSettle: next => latest.current.change(next),
      onDragEnd: target => latest.current.go(target),
      onStops: next => setStops(next),
      current: () => latest.current.current,
      mouseDrag: () => latest.current.mouseDrag,
      align: () => latest.current.snapAlign,
      minSlideWidth: () => latest.current.minSlideWidth,
    });
    scroller.current = instance;
    return () => { instance.destroy(); scroller.current = undefined; };
  }, []);

  useEffect(() => scroller.current?.refresh());

  // Follow a controlled index, and keep a removed slide from leaving the view past the end. The first slide shown jumps.
  const mounted = useRef(false);
  useEffect(() => {
    settled.current = current;
    const instance = scroller.current;
    if (instance && instance.heading() !== current && instance.nearest() !== current) instance.scrollTo(current, mounted.current && !reduced);
    mounted.current = true;
  }, [current, count]);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = event.target === event.currentTarget ? carouselKey(event.key) : undefined;
    if (!move) return;
    event.preventDefault();
    go(carouselTarget(move, current, count, stops));
  };

  // Buttons step by stop: slides that share the end of a card rail are one step, and an end with nowhere to go turns the button off.
  const targets = { previous: stepTarget(stops, current, count, "previous"), next: stepTarget(stops, current, count, "next") };
  const button = (direction: "previous" | "next") => {
    const target = targets[direction];
    return <KjunButton key={direction} className="kjun-carousel-control" data-direction={direction} variant={title ? "secondary" : "ghost"} shape="circle" size="sm"
      prefixIcon={direction === "previous" ? "chevron-left" : "chevron-right"} ariaLabel={direction === "previous" ? m.previousSlide : m.nextSlide}
      disabled={target === undefined} onClick={() => target !== undefined && step(target)} />;
  };
  const buttons = controls && count > 1;
  const marker = count < 2 ? null : marks === "dots" ? (
    <div className="kjun-carousel-indicators" role="group" aria-label={m.slides}>
      {stopDots(stops, count, current).map((dot, i) => (
        <button key={i} type="button" className="kjun-carousel-indicator" aria-label={m.goToSlide(dot.target + 1)}
          aria-current={dot.current ? "true" : undefined} onClick={() => go(dot.target)} />
      ))}
    </div>
  ) : marks === "count" ? <div className="kjun-carousel-count" aria-hidden="true">{current + 1} / {count}</div> : null;

  return (
    <section ref={root} id={id} className={className ? `kjun-carousel ${className}` : "kjun-carousel"} style={style}
      aria-roledescription={m.carousel} aria-label={ariaLabel} aria-labelledby={ariaLabel || !title ? undefined : titleId}
      data-size={slideSize} data-min-slide-width={minSlideWidth && minSlideWidth > 0 ? "" : undefined} data-gap={gap} data-controls={buttons ? (title ? "header" : "corner") : undefined}
      data-mouse-drag={mouseDrag && count > 1 ? "" : undefined} data-align={snapAlign} data-bleed={bleed === "none" ? undefined : bleed}
      data-placement={indicatorPlacement}>
      {(title || action) && (
        <div className="kjun-carousel-header">
          {title && <Title id={titleId} className="kjun-carousel-title kjun-type-section-title">{title}</Title>}
          <div className="kjun-carousel-header-end">
            {action}
            {buttons && title && <div className="kjun-carousel-header-controls">{button("previous")}{button("next")}</div>}
          </div>
        </div>
      )}
      <div className="kjun-carousel-frame">
        <div ref={viewport} className="kjun-carousel-viewport" tabIndex={0} onKeyDown={keyDown}>
          {slides.map((slide, i) => (
            <div key={isValidElement(slide) && slide.key != null ? slide.key : i} className="kjun-carousel-slide" role="group"
              aria-roledescription={m.slide} aria-label={m.slideOf(i + 1, count)} data-current={i === current ? "" : undefined}>{slide}</div>
          ))}
        </div>
        {buttons && !title && (
          // Without a title the buttons share one pill at the bottom end of the slides, with the position between them
          // when no dots show it; the text is for the eye, the live region speaks the position.
          <div className="kjun-carousel-controls" data-tone={slideSize === "auto" || minSlideWidth ? "surface" : "scrim"}>
            {button("previous")}
            {marks !== "dots" && <span className="kjun-carousel-controls-count" aria-hidden="true">{current + 1} / {count}</span>}
            {button("next")}
          </div>
        )}
        {indicatorPlacement === "overlay" && marker}
      </div>
      {indicatorPlacement === "below" && marker}
      <div className="kjun-sr-only" aria-live="polite">{moved ? m.slideOf(current + 1, count) : ""}</div>
    </section>
  );
}
