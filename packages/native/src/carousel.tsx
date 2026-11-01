import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { carouselTarget, clampSlide, indicatorMode, reachableOffsets, settleSlide, slideStops, stopDots, warnUnnamedCarousel,
  type CarouselBleed, type CarouselGap, type CarouselIndicatorPlacement, type CarouselIndicators, type CarouselSlideSize, type CarouselSnapAlign } from "../../../shared/package-runtime/carousel";
import { tokens } from "@kjun-ui/tokens";
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, ScrollView, View, type AccessibilityActionEvent, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent,
  type StyleProp, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText, useReducedMotion } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";

export interface KjunCarouselProps {
  /** Names the region, e.g. "추천 상품". Required unless title names it. */
  ariaLabel?: string;
  /** A section title above the slides; it also names the region. */
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
  /**
   * Dots under the slides (true or "dots"), the position as "3 / 24" text ("count") for many slides, or none (false).
   * Screen readers meet them as one adjustable control that swipes up and down through the slides.
   */
  indicators?: CarouselIndicators;
  /** start lines each slide up with the start edge; center keeps the current slide centred (with peek, a neighbour shows on each side). */
  snapAlign?: CarouselSnapAlign;
  /** Reaches past the screen's side padding by this inset (12, 16 or 24) while the first slide lines up with the content. */
  bleed?: CarouselBleed;
  /** below: under the slides; overlay: on the slides, in a scrim pill that stays legible over images. */
  indicatorPlacement?: CarouselIndicatorPlacement;
  /** Accepted for parity with the web packages; Native draws no previous and next buttons, slides move by swipe. */
  controls?: boolean;
  style?: StyleProp<ViewStyle>;
}

const gaps: Record<CarouselGap, number> = { none: 0, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg };
const bleeds: Record<CarouselBleed, number> = { none: 0, sm: tokens.space.inset.sm, md: tokens.space.inset.md, lg: tokens.space.inset.lg };
const actions = [{ name: "increment" }, { name: "decrement" }];

/** A row of slides moved by swipe or dots. It never moves on its own. */
export function KjunCarousel({ ariaLabel, title, children, slideSize = "full", gap = "md", index, defaultIndex = 0, onIndexChange,
  indicators = true, snapAlign = "start", bleed = "none", indicatorPlacement = "below", style }: KjunCarouselProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const reduced = useReducedMotion();
  const geometry = tokens.extensions.carousel;
  const slides = Children.toArray(children);
  const count = slides.length;
  const scroller = useRef<ScrollView>(null);
  const [frame, setFrame] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [measured, setMeasured] = useState<{ x: number; width: number }[]>([]);
  const [own, setOwn] = useState(() => clampSlide(defaultIndex, count));
  const current = clampSlide(index ?? own, count);
  const settled = useRef(current), position = useRef(0), mounted = useRef(false);
  const space = gaps[gap], edge = bleeds[bleed], center = snapAlign === "center";
  const marks = indicatorMode(indicators);
  useEffect(() => warnUnnamedCarousel(!!(ariaLabel || title)), [ariaLabel, title]);
  // The scroller spans the bleed; its padding keeps the first slide on the content edge, and a centred peek pads for both neighbours.
  const padding = edge + (center && slideSize === "peek" ? geometry.peek + space : 0);
  const content = Math.max(0, frame - 2 * padding);
  const slideWidth = slideSize === "full" || (center && slideSize === "peek") ? content
    : slideSize === "peek" ? Math.max(0, content - geometry.peek - space) : undefined;
  // A removed slide fires no layout event, so the measurements are trimmed to the slides that remain.
  const ready = measured.length >= count && count > 0;
  // iOS scrolls past the end of the content when asked to, so every stop is held to the reachable range.
  const max = Math.max(0, contentWidth - frame);
  const offsets = ready ? reachableOffsets(measured.slice(0, count).map(({ x, width }) =>
    center ? x + width / 2 - frame / 2 : x - measured[0].x), max) : [];
  const dots = stopDots(ready ? slideStops(offsets) : undefined, count, current);

  const scrollTo = (target: number, animated: boolean) => scroller.current?.scrollTo({ x: offsets[target] ?? 0, animated: animated && !reduced });
  const change = (next: number) => {
    if (next === settled.current) return;
    settled.current = next;
    if (index === undefined) setOwn(next);
    onIndexChange?.(next);
  };
  const go = (target: number) => { scrollTo(target, true); change(target); };
  const settle = () => change(settleSlide(offsets, position.current, max, settled.current));

  // Follow a controlled index once every slide has been measured, and again when the size changes; the first slide shown jumps.
  useEffect(() => {
    settled.current = current;
    if (!ready || !frame) return;
    if (settleSlide(offsets, position.current, max, current) !== current || Math.abs((offsets[current] ?? 0) - position.current) > 1)
      scrollTo(current, mounted.current);
    mounted.current = true;
  }, [current, count, ready, frame, max, offsets.join()]);

  // React Native Web sends no momentum events, so a pause after the last scroll settles too.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const scroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    position.current = event.nativeEvent.contentOffset.x;
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, 120);
  };
  const measure = (i: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setMeasured(previous => {
      if (previous[i]?.x === x && previous[i]?.width === width && previous.length >= count) return previous;
      return Array.from({ length: Math.max(count, previous.length) }, (_, k) => k === i ? { x, width } : previous[k] ?? { x: 0, width: 0 });
    });
  };
  const adjust = (event: AccessibilityActionEvent) =>
    go(carouselTarget(event.nativeEvent.actionName === "increment" ? "next" : "previous", current, count));

  const overlay = indicatorPlacement === "overlay";
  const ink = overlay ? colors.inverse : colors.text;
  const marker = marks && count > 1 ? (
    <View {...(Platform.OS === "web" ? { accessibilityLabel: m.slides } : {
      // On a device, one adjustable control for screen readers: named after the carousel, valued by the position, swiped up or down to move.
      // The web keeps the dots as buttons, because a slider hides its children from assistive technology.
      accessible: true, accessibilityRole: "adjustable" as const, accessibilityLabel: ariaLabel ?? title ?? m.slides,
      accessibilityValue: { text: m.slideOf(current + 1, count) }, accessibilityActions: actions, onAccessibilityAction: adjust })}
      style={[{ flexDirection: "row", justifyContent: "center", alignItems: "center", height: geometry.indicatorPress },
        overlay ? { position: "absolute", bottom: geometry.controlInset, paddingHorizontal: geometry.overlayPaddingX, borderRadius: geometry.indicatorPress / 2,
          backgroundColor: colors.overlay, ...(marks === "count" ? { right: edge + geometry.controlInset } : { alignSelf: "center" }) }
          : { marginTop: geometry.indicatorOffset - (geometry.indicatorPress - geometry.indicatorSize) / 2, paddingHorizontal: edge }]}>
      {marks === "count"
        ? <KText style={[typeStyle("caption"), { color: overlay ? colors.inverse : colors.textSecondary, fontVariant: ["tabular-nums"] }]}>{`${current + 1} / ${count}`}</KText>
        : dots.map((dot, i) => (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={m.goToSlide(dot.target + 1)} accessibilityState={{ selected: dot.current }}
            focusRingRadius={geometry.indicatorSize / 2} onPress={() => go(dot.target)}
            style={{ width: geometry.indicatorPressWidth, height: geometry.indicatorPress, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: dot.current ? geometry.indicatorActiveWidth : geometry.indicatorSize, height: geometry.indicatorSize,
              borderRadius: geometry.indicatorSize / 2, backgroundColor: dot.current ? ink : overlay ? colors.inverse : colors.borderStrong,
              opacity: overlay && !dot.current ? 0.5 : 1 }} />
          </Pressable>
        ))}
    </View>
  ) : null;

  return (
    <View style={[{ minWidth: 0, maxWidth: edge ? undefined : "100%", marginHorizontal: -edge }, style]}
      onLayout={event => setFrame(event.nativeEvent.layout.width)}>
      {title ? <KText accessibilityRole="header" style={[typeStyle("sectionTitle"),
        { color: colors.text, marginBottom: geometry.headerGap, paddingHorizontal: edge }]}>{title}</KText> : null}
      <View>
        <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
          snapToOffsets={ready ? offsets : undefined} disableIntervalMomentum={slideSize !== "auto"}
          onScroll={scroll} scrollEventThrottle={16} onMomentumScrollEnd={settle}
          onContentSizeChange={setContentWidth} contentContainerStyle={{ gap: space, paddingHorizontal: padding }}>
          {slides.map((slide, i) => (
            <View key={isValidElement(slide) && slide.key != null ? slide.key : i} onLayout={measure(i)}
              style={slideWidth === undefined ? undefined : { width: slideWidth }}>{slide}</View>
          ))}
        </ScrollView>
        {overlay ? marker : null}
      </View>
      {overlay ? null : marker}
    </View>
  );
}
