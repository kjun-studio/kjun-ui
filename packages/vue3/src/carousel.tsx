import { useKjunMessages } from "./runtime/messages";
import { Comment, Fragment, Text, computed, defineComponent, onBeforeUnmount, onMounted, ref, watch,
  type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { carouselKey, carouselTarget, clampSlide, nearestSlide, warnCarouselSetup, type CarouselGap, type CarouselSlideSize } from "../../../shared/package-runtime/carousel";
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
  /** full: as wide as the carousel; peek: the next slide shows at the edge; auto: each slide keeps its own width. */
  slideSize: { type: String as PropType<CarouselSlideSize>, default: "full" },
  gap: { type: String as PropType<CarouselGap>, default: "md" },
  /** v-model:index. Without it the carousel keeps its own current slide, starting at defaultIndex. */
  index: { type: Number, default: undefined },
  defaultIndex: { type: Number, default: 0 },
  indicators: { type: Boolean, default: true },
  /**
   * Previous and next buttons for pointers that can hover; touch screens swipe instead. Without a title they float at
   * the slide edges while the pointer or focus is inside, and only toward a slide that exists. A mouse wheel does not
   * move a carousel, so keep these or the indicators on.
   */
  controls: { type: Boolean, default: true },
} as const;
export type KjunCarouselProps = ExtractPublicPropTypes<typeof kjunCarouselProps>;
/** A row of slides moved by swipe, keyboard, buttons or dots. It never moves on its own. Each default-slot child is one slide. */
export const KjunCarousel = defineComponent({
  name: "KjunCarousel",
  props: kjunCarouselProps,
  emits: { "update:index": (_index: number) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const reduced = useReducedMotion();
    const viewport = ref<HTMLElement | null>(null);
    const count = ref(0);
    const own = ref(props.defaultIndex);
    const titleId = useKjunId("kjun-carousel-");
    watch(() => [props.controls, props.indicators, props.ariaLabel, props.title], () =>
      warnCarouselSetup({ controls: props.controls, indicators: props.indicators, named: !!(props.ariaLabel || props.title) }), { immediate: true });
    const current = computed(() => clampSlide(props.index ?? own.value, count.value));
    let settled = current.value;

    const offsets = () => {
      const el = viewport.value, first = el?.firstElementChild as HTMLElement | null;
      return Array.from(el?.children ?? [], child => (child as HTMLElement).offsetLeft - (first?.offsetLeft ?? 0));
    };
    const scrollTo = (target: number, smooth: boolean) => {
      viewport.value?.scrollTo({ left: offsets()[target] ?? 0, behavior: smooth && !reduced.value ? "smooth" : "auto" });
    };
    const change = (next: number) => {
      if (next === settled) return;
      settled = next;
      if (props.index === undefined) own.value = next;
      emit("update:index", next);
    };
    const go = (target: number) => { scrollTo(target, true); change(target); };
    // A side button disappears at the end it leads to; keep focus in the carousel instead of dropping it to the page.
    const step = (target: number) => {
      const leaving = !props.title && (target === 0 || target === count.value - 1);
      go(target);
      if (leaving) viewport.value?.focus({ preventScroll: true });
    };
    const position = () => {
      const el = viewport.value!;
      return nearestSlide(offsets(), el.scrollLeft, el.scrollWidth - el.clientWidth);
    };

    // Follow a controlled index, and keep a removed slide from leaving the view past the end.
    watch([current, count], () => {
      settled = current.value;
      if (viewport.value && position() !== current.value) scrollTo(current.value, true);
    }, { flush: "post" });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => { clearTimeout(timer); if (viewport.value) change(position()); };
    // Browsers without scrollend settle shortly after the last scroll event.
    const scroll = () => { clearTimeout(timer); timer = setTimeout(settle, 120); };
    onMounted(() => {
      settled = current.value;
      if (current.value) scrollTo(current.value, false);
      viewport.value?.addEventListener("scroll", scroll, { passive: true });
      viewport.value?.addEventListener("scrollend", settle);
    });
    onBeforeUnmount(() => {
      clearTimeout(timer);
      viewport.value?.removeEventListener("scroll", scroll);
      viewport.value?.removeEventListener("scrollend", settle);
    });

    const keyDown = (event: KeyboardEvent) => {
      const move = event.target === event.currentTarget ? carouselKey(event.key) : undefined;
      if (!move) return;
      event.preventDefault();
      go(carouselTarget(move, current.value, count.value));
    };

    return () => {
      const slides = slideNodes(slots.default?.() as VNode[] | undefined);
      count.value = slides.length;
      const index = clampSlide(props.index ?? own.value, slides.length), total = slides.length;
      const button = (direction: "previous" | "next") => {
        const target = direction === "previous" ? index - 1 : index + 1;
        return <KjunButton key={direction} class="kjun-carousel-control" data-direction={direction} variant="secondary" shape="circle" size="sm"
          prefixIcon={direction === "previous" ? "chevron-left" : "chevron-right"} ariaLabel={direction === "previous" ? m.value.previousSlide : m.value.nextSlide}
          disabled={target < 0 || target >= total} onClick={() => step(target)} />;
      };
      const buttons = props.controls && total > 1;
      return (
        <section class="kjun-carousel" aria-roledescription={m.value.carousel} aria-label={props.ariaLabel}
          aria-labelledby={props.ariaLabel || !props.title ? undefined : titleId}
          data-size={props.slideSize} data-gap={props.gap} data-controls={buttons ? (props.title ? "header" : "sides") : undefined}>
          {props.title && (
            <div class="kjun-carousel-header">
              <h2 id={titleId} class="kjun-carousel-title kjun-type-section-title">{props.title}</h2>
              {buttons && <div class="kjun-carousel-header-controls">{button("previous")}{button("next")}</div>}
            </div>
          )}
          <div class="kjun-carousel-frame">
            <div ref={viewport} class="kjun-carousel-viewport" tabindex={0} onKeydown={keyDown}>
              {slides.map((slide, i) => (
                <div key={i} class="kjun-carousel-slide" role="group" aria-roledescription={m.value.slide} aria-label={m.value.slideOf(i + 1, total)}
                  data-current={i === index ? "" : undefined}>{slide}</div>
              ))}
            </div>
            {buttons && !props.title && <>{index > 0 && button("previous")}{index < total - 1 && button("next")}</>}
          </div>
          {props.indicators && total > 1 && (
            <div class="kjun-carousel-indicators" role="group" aria-label={m.value.slides}>
              {slides.map((_, i) => (
                <button key={i} type="button" class="kjun-carousel-indicator" aria-label={m.value.goToSlide(i + 1)}
                  aria-current={i === index ? "true" : undefined} onClick={() => go(i)} />
              ))}
            </div>
          )}
        </section>
      );
    };
  },
});
