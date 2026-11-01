import { useKjunMessages } from "./runtime/messages";
import { Comment, Fragment, Text, computed, defineComponent, onBeforeUnmount, onMounted, onUpdated, ref, watch,
  type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { carouselKey, carouselTarget, clampSlide, indicatorMode, stepFocus, stopDots, warnCarouselSetup, type CarouselBleed,
  type CarouselGap, type CarouselIndicatorPlacement, type CarouselIndicators, type CarouselSlideSize, type CarouselSnapAlign, type CarouselTitleTag } from "../../../shared/package-runtime/carousel";
import { createCarouselScroller, type CarouselScroller } from "../../../shared/package-runtime/carousel-scroll";
import { KjunButton } from "./button";
import { useKjunId } from "./input";
import { useReducedMotion } from "./runtime/presence";

// v-for slides arrive as a Fragment; every element or component inside it is one slide.
function slideNodes(nodes: VNode[] | undefined): VNode[] {
  return (nodes ?? []).flatMap(node => node.type === Fragment ? slideNodes(node.children as VNode[])
    : node.type === Comment || (node.type === Text && !String(node.children).trim()) ? [] : [node]);
}

const kjunCarouselProps = {
  /** Names the region, e.g. "추천 상품". Required unless title names it. */
  ariaLabel: { type: String, default: undefined },
  /** A section title above the slides; the region takes its name, and previous and next buttons move beside it. */
  title: { type: String, default: undefined },
  /** The title's heading level (default h2). */
  titleAs: { type: String as PropType<CarouselTitleTag>, default: "h2" },
  /** full: as wide as the carousel; peek: the next slide shows at the edge; auto: each slide keeps its own width. */
  slideSize: { type: String as PropType<CarouselSlideSize>, default: "full" },
  gap: { type: String as PropType<CarouselGap>, default: "md" },
  /** v-model:index. Without it the carousel keeps its own current slide, starting at defaultIndex. */
  index: { type: Number, default: undefined },
  defaultIndex: { type: Number, default: 0 },
  /** Dots under the slides (true or "dots"), the position as "3 / 24" text ("count") for many slides, or none (false). */
  indicators: { type: [Boolean, String] as PropType<CarouselIndicators>, default: true },
  /**
   * Previous and next buttons for pointers that can hover; touch screens swipe instead. Without a title they float at
   * the slide edges while the pointer or focus is inside, and only toward a slide that exists.
   */
  controls: { type: Boolean, default: true },
  /** A mouse can drag the slides; a drag past a fifth of the view moves one slide. A mouse wheel does not move a carousel. */
  mouseDrag: { type: Boolean, default: true },
  /** start lines each slide up with the start edge; center keeps the current slide centred (with peek, a neighbour shows on each side). */
  snapAlign: { type: String as PropType<CarouselSnapAlign>, default: "start" },
  /** Reaches past the page's side padding by this inset (12, 16 or 24) while the first slide lines up with the content. */
  bleed: { type: String as PropType<CarouselBleed>, default: "none" },
  /** below: under the slides; overlay: on the slides, in a scrim pill that stays legible over images. */
  indicatorPlacement: { type: String as PropType<CarouselIndicatorPlacement>, default: "below" },
} as const;
export type KjunCarouselProps = ExtractPublicPropTypes<typeof kjunCarouselProps>;
/** A row of slides moved by swipe, drag, keyboard, buttons or dots. It never moves on its own. Each default-slot child is one slide. */
export const KjunCarousel = defineComponent({
  name: "KjunCarousel",
  props: kjunCarouselProps,
  emits: { "update:index": (_index: number) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const reduced = useReducedMotion();
    const viewport = ref<HTMLElement | null>(null), root = ref<HTMLElement | null>(null);
    const stops = ref<number[]>();
    // The slide count the last render drew; kept in sync after rendering, never during it.
    const count = ref(0);
    let rendered = 0;
    const own = ref(props.defaultIndex);
    // Announce the position only after the carousel has moved, not when the page loads.
    const moved = ref(false);
    const titleId = useKjunId("kjun-carousel-");
    const marks = computed(() => indicatorMode(props.indicators));
    watch(() => [props.controls, marks.value, props.mouseDrag, props.ariaLabel, props.title], () => warnCarouselSetup({
      controls: props.controls, dots: marks.value === "dots", mouseDrag: props.mouseDrag, named: !!(props.ariaLabel || props.title) }), { immediate: true });
    const current = computed(() => clampSlide(props.index ?? own.value, count.value));
    let settled = current.value;
    let scroller: CarouselScroller | undefined;

    const change = (next: number) => {
      if (next === settled) return;
      settled = next;
      moved.value = true;
      if (props.index === undefined) own.value = next;
      emit("update:index", next);
    };
    const go = (target: number) => { scroller?.scrollTo(target, !reduced.value); change(target); };
    // At an end a side button disappears and a header button turns off; focus stays in the carousel instead of dropping to the page.
    const step = (target: number) => {
      const next = stepFocus(target, count.value, !!props.title);
      go(target);
      // After the render that enables the other header button.
      if (next) requestAnimationFrame(() => (next === "viewport" ? viewport.value
        : root.value?.querySelector<HTMLElement>(`.kjun-carousel-header-controls [data-direction="${next}"]`))?.focus({ preventScroll: true }));
    };

    // Follow a controlled index, and keep a removed slide from leaving the view past the end.
    watch([current, count], () => {
      settled = current.value;
      if (scroller && scroller.heading() !== current.value && scroller.nearest() !== current.value) scroller.scrollTo(current.value, !reduced.value);
    }, { flush: "post" });

    const syncCount = () => { if (count.value !== rendered) count.value = rendered; };
    onMounted(() => {
      syncCount();
      scroller = createCarouselScroller(viewport.value!, {
        onSettle: change,
        onDragEnd: go,
        onStops: next => { stops.value = next; },
        current: () => current.value,
        mouseDrag: () => props.mouseDrag,
        align: () => props.snapAlign,
      });
      settled = current.value;
      if (current.value) scroller.scrollTo(current.value, false);
    });
    onUpdated(() => { syncCount(); scroller?.refresh(); });
    onBeforeUnmount(() => scroller?.destroy());

    const keyDown = (event: KeyboardEvent) => {
      const move = event.target === event.currentTarget ? carouselKey(event.key) : undefined;
      if (!move) return;
      event.preventDefault();
      go(carouselTarget(move, current.value, count.value));
    };

    return () => {
      const slides = slideNodes(slots.default?.() as VNode[] | undefined);
      const total = rendered = slides.length;
      const index = clampSlide(props.index ?? own.value, total);
      const button = (direction: "previous" | "next") => {
        const target = direction === "previous" ? index - 1 : index + 1;
        return <KjunButton key={direction} class="kjun-carousel-control" data-direction={direction} variant="secondary" shape="circle" size="sm"
          prefixIcon={direction === "previous" ? "chevron-left" : "chevron-right"} ariaLabel={direction === "previous" ? m.value.previousSlide : m.value.nextSlide}
          disabled={target < 0 || target >= total} onClick={() => step(target)} />;
      };
      const buttons = props.controls && total > 1;
      const Title = props.titleAs;
      const marker = total < 2 ? null : marks.value === "dots" ? (
        <div class="kjun-carousel-indicators" role="group" aria-label={m.value.slides}>
          {stopDots(stops.value, total, index).map((dot, i) => (
            <button key={i} type="button" class="kjun-carousel-indicator" aria-label={m.value.goToSlide(dot.target + 1)}
              aria-current={dot.current ? "true" : undefined} onClick={() => go(dot.target)} />
          ))}
        </div>
      ) : marks.value === "count" ? <div class="kjun-carousel-count" aria-hidden="true">{index + 1} / {total}</div> : null;
      return (
        <section ref={root} class="kjun-carousel" aria-roledescription={m.value.carousel} aria-label={props.ariaLabel}
          aria-labelledby={props.ariaLabel || !props.title ? undefined : titleId}
          data-size={props.slideSize} data-gap={props.gap} data-controls={buttons ? (props.title ? "header" : "sides") : undefined}
          data-mouse-drag={props.mouseDrag && total > 1 ? "" : undefined} data-align={props.snapAlign}
          data-bleed={props.bleed === "none" ? undefined : props.bleed} data-placement={props.indicatorPlacement}>
          {props.title && (
            <div class="kjun-carousel-header">
              <Title id={titleId} class="kjun-carousel-title kjun-type-section-title">{props.title}</Title>
              {buttons && <div class="kjun-carousel-header-controls">{button("previous")}{button("next")}</div>}
            </div>
          )}
          <div class="kjun-carousel-frame">
            <div ref={viewport} class="kjun-carousel-viewport" tabindex={0} onKeydown={keyDown}>
              {slides.map((slide, i) => (
                <div key={slide.key ?? i} class="kjun-carousel-slide" role="group" aria-roledescription={m.value.slide}
                  aria-label={m.value.slideOf(i + 1, total)} data-current={i === index ? "" : undefined}>{slide}</div>
              ))}
            </div>
            {buttons && !props.title && <>{index > 0 && button("previous")}{index < total - 1 && button("next")}</>}
            {props.indicatorPlacement === "overlay" && marker}
          </div>
          {props.indicatorPlacement === "below" && marker}
          <div class="kjun-sr-only" aria-live="polite">{moved.value ? m.value.slideOf(index + 1, total) : ""}</div>
        </section>
      );
    };
  },
});
