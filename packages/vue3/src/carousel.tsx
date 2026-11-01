import { useKjunMessages } from "./runtime/messages";
import { Comment, Fragment, Text, computed, defineComponent, onBeforeUnmount, onMounted, onUpdated, ref, watch,
  type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { carouselKey, carouselTarget, clampSlide, indicatorMode, warnCarouselSetup,
  type CarouselGap, type CarouselIndicators, type CarouselSlideSize, type CarouselTitleTag } from "../../../shared/package-runtime/carousel";
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
    const viewport = ref<HTMLElement | null>(null);
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
    // A side button disappears at the end it leads to; keep focus in the carousel instead of dropping it to the page.
    const step = (target: number) => {
      const leaving = !props.title && (target === 0 || target === count.value - 1);
      go(target);
      if (leaving) viewport.value?.focus({ preventScroll: true });
    };

    // Follow a controlled index, and keep a removed slide from leaving the view past the end.
    watch([current, count], () => {
      settled = current.value;
      if (scroller && scroller.nearest() !== current.value) scroller.scrollTo(current.value, !reduced.value);
    }, { flush: "post" });

    const syncCount = () => { if (count.value !== rendered) count.value = rendered; };
    onMounted(() => {
      syncCount();
      scroller = createCarouselScroller(viewport.value!, {
        onSettle: change,
        onDragEnd: go,
        current: () => current.value,
        mouseDrag: () => props.mouseDrag,
      });
      settled = current.value;
      if (current.value) scroller.scrollTo(current.value, false);
    });
    onUpdated(syncCount);
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
      return (
        <section class="kjun-carousel" aria-roledescription={m.value.carousel} aria-label={props.ariaLabel}
          aria-labelledby={props.ariaLabel || !props.title ? undefined : titleId}
          data-size={props.slideSize} data-gap={props.gap} data-controls={buttons ? (props.title ? "header" : "sides") : undefined}
          data-mouse-drag={props.mouseDrag && total > 1 ? "" : undefined}>
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
          </div>
          {marks.value === "dots" && total > 1 && (
            <div class="kjun-carousel-indicators" role="group" aria-label={m.value.slides}>
              {slides.map((_, i) => (
                <button key={i} type="button" class="kjun-carousel-indicator" aria-label={m.value.goToSlide(i + 1)}
                  aria-current={i === index ? "true" : undefined} onClick={() => go(i)} />
              ))}
            </div>
          )}
          {marks.value === "count" && total > 1 && <div class="kjun-carousel-count" aria-hidden="true">{index + 1} / {total}</div>}
          <div class="kjun-sr-only" aria-live="polite">{moved.value ? m.value.slideOf(index + 1, total) : ""}</div>
        </section>
      );
    };
  },
});
