import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { carouselTarget, clampSlide, indicatorMode, nearestSlide, reachableOffsets, warnCarouselSetup,
  type CarouselGap, type CarouselIndicators, type CarouselSlideSize } from "../../../shared/package-runtime/carousel";
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
  /** Accepted for parity with the web packages; Native draws no previous and next buttons, slides move by swipe. */
  controls?: boolean;
  style?: StyleProp<ViewStyle>;
}

const gaps: Record<CarouselGap, number> = { none: 0, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg };
const actions = [{ name: "increment" }, { name: "decrement" }];

/** A row of slides moved by swipe or dots. It never moves on its own. */
export function KjunCarousel({ ariaLabel, title, children, slideSize = "full", gap = "md", index, defaultIndex = 0, onIndexChange,
  indicators = true, style }: KjunCarouselProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const reduced = useReducedMotion();
  const geometry = tokens.extensions.carousel;
  const slides = Children.toArray(children);
  const count = slides.length;
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [measured, setMeasured] = useState<number[]>([]);
  const [own, setOwn] = useState(() => clampSlide(defaultIndex, count));
  const current = clampSlide(index ?? own, count);
  const settled = useRef(current), position = useRef(0), mounted = useRef(false);
  const space = gaps[gap];
  const marks = indicatorMode(indicators);
  // Native always swipes, so only a missing name is worth a warning.
  useEffect(() => warnCarouselSetup({ controls: true, dots: true, mouseDrag: true, named: !!(ariaLabel || title) }), [ariaLabel, title]);
  const slideWidth = slideSize === "full" ? width : slideSize === "peek" ? Math.max(0, width - geometry.peek - space) : undefined;
  // A removed slide fires no layout event, so the measurements are trimmed to the slides that remain.
  const ready = measured.length >= count && count > 0;
  // iOS scrolls past the end of the content when asked to, so every stop is held to the reachable range.
  const max = Math.max(0, contentWidth - width);
  const offsets = ready ? reachableOffsets(measured.slice(0, count), max) : [];

  const scrollTo = (target: number, animated: boolean) => scroller.current?.scrollTo({ x: offsets[target] ?? 0, animated: animated && !reduced });
  const change = (next: number) => {
    if (next === settled.current) return;
    settled.current = next;
    if (index === undefined) setOwn(next);
    onIndexChange?.(next);
  };
  const go = (target: number) => { scrollTo(target, true); change(target); };
  const settle = () => change(nearestSlide(offsets, position.current, max));

  // Follow a controlled index once every slide has been measured; the first slide shown jumps.
  useEffect(() => {
    settled.current = current;
    if (!ready || !width) return;
    if (nearestSlide(offsets, position.current, max) !== current) scrollTo(current, mounted.current);
    mounted.current = true;
  }, [current, count, ready, width, max, offsets.join()]);

  // React Native Web sends no momentum events, so a pause after the last scroll settles too.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const scroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    position.current = event.nativeEvent.contentOffset.x;
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, 120);
  };
  const measure = (i: number) => (event: LayoutChangeEvent) => {
    const x = event.nativeEvent.layout.x;
    setMeasured(previous => {
      if (previous[i] === x && previous.length >= count) return previous;
      return Array.from({ length: Math.max(count, previous.length) }, (_, k) => k === i ? x : previous[k] ?? 0);
    });
  };
  const adjust = (event: AccessibilityActionEvent) =>
    go(carouselTarget(event.nativeEvent.actionName === "increment" ? "next" : "previous", current, count));

  return (
    <View style={[{ minWidth: 0, maxWidth: "100%" }, style]} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {title ? <KText accessibilityRole="header" style={[typeStyle("sectionTitle"), { color: colors.text, marginBottom: geometry.headerGap }]}>{title}</KText> : null}
      <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToOffsets={ready ? offsets : undefined} disableIntervalMomentum={slideSize !== "auto"}
        onScroll={scroll} scrollEventThrottle={16} onMomentumScrollEnd={settle}
        onContentSizeChange={setContentWidth} contentContainerStyle={{ gap: space }}>
        {slides.map((slide, i) => (
          <View key={isValidElement(slide) && slide.key != null ? slide.key : i} onLayout={measure(i)}
            style={slideWidth === undefined ? undefined : { width: slideWidth }}>{slide}</View>
        ))}
      </ScrollView>
      {marks && count > 1 ? (
        <View {...(Platform.OS === "web" ? { accessibilityLabel: m.slides } : {
          // On a device, one adjustable control for screen readers: named after the carousel, valued by the position, swiped up or down to move.
          // The web keeps the dots as buttons, because a slider hides its children from assistive technology.
          accessible: true, accessibilityRole: "adjustable" as const, accessibilityLabel: ariaLabel ?? title ?? m.slides,
          accessibilityValue: { text: m.slideOf(current + 1, count) }, accessibilityActions: actions, onAccessibilityAction: adjust })}
          style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", height: geometry.indicatorPress,
            marginTop: geometry.indicatorOffset - (geometry.indicatorPress - geometry.indicatorSize) / 2 }}>
          {marks === "count"
            ? <KText style={[typeStyle("caption"), { color: colors.textSecondary, fontVariant: ["tabular-nums"] }]}>{`${current + 1} / ${count}`}</KText>
            : slides.map((_, i) => {
              const selected = i === current;
              return (
                <Pressable key={i} accessibilityRole="button" accessibilityLabel={m.goToSlide(i + 1)} accessibilityState={{ selected }}
                  focusRingRadius={geometry.indicatorSize / 2} onPress={() => go(i)}
                  style={{ width: geometry.indicatorPressWidth, height: geometry.indicatorPress, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: selected ? geometry.indicatorActiveWidth : geometry.indicatorSize, height: geometry.indicatorSize,
                    borderRadius: geometry.indicatorSize / 2, backgroundColor: selected ? colors.text : colors.borderStrong }} />
                </Pressable>
              );
            })}
        </View>
      ) : null}
    </View>
  );
}
