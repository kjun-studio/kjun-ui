import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { clampSlide, nearestSlide, warnCarouselSetup, type CarouselGap, type CarouselSlideSize } from "../../../shared/package-runtime/carousel";
import { tokens } from "@kjun-ui/tokens";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollView, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from "react-native";
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
  indicators?: boolean;
  /** Accepted for parity with the web packages; Native draws no previous and next buttons, slides move by swipe. */
  controls?: boolean;
  style?: StyleProp<ViewStyle>;
}

const gaps: Record<CarouselGap, number> = { none: 0, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg };

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
  const [offsets, setOffsets] = useState<number[]>([]);
  const [own, setOwn] = useState(() => clampSlide(defaultIndex, count));
  const current = clampSlide(index ?? own, count);
  const settled = useRef(current), position = useRef(0), content = useRef(0), mounted = useRef(false);
  const space = gaps[gap];
  // Native always swipes, so only a missing name is worth a warning.
  useEffect(() => warnCarouselSetup({ controls: true, indicators: true, named: !!(ariaLabel || title) }), [ariaLabel, title]);
  const slideWidth = slideSize === "full" ? width : slideSize === "peek" ? Math.max(0, width - geometry.peek - space) : undefined;

  const scrollTo = (target: number, animated: boolean) => scroller.current?.scrollTo({ x: offsets[target] ?? 0, animated: animated && !reduced });
  const change = (next: number) => {
    if (next === settled.current) return;
    settled.current = next;
    if (index === undefined) setOwn(next);
    onIndexChange?.(next);
  };
  const settle = () => change(nearestSlide(offsets, position.current, content.current - width));

  // Follow a controlled index once every slide has been measured; the first slide shown jumps.
  useEffect(() => {
    settled.current = current;
    if (offsets.length !== count || !width) return;
    if (nearestSlide(offsets, position.current, content.current - width) !== current) scrollTo(current, mounted.current);
    mounted.current = true;
  }, [current, count, offsets, width]);

  // React Native Web sends no momentum events, so a pause after the last scroll settles too.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const scroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    position.current = event.nativeEvent.contentOffset.x;
    content.current = event.nativeEvent.contentSize.width;
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, 120);
  };
  const measure = (i: number) => (event: LayoutChangeEvent) => {
    const x = event.nativeEvent.layout.x;
    setOffsets(previous => {
      if (previous[i] === x && previous.length === count) return previous;
      return Array.from({ length: count }, (_, k) => k === i ? x : previous[k] ?? 0);
    });
  };

  return (
    <View accessibilityLabel={ariaLabel ?? title} style={[{ minWidth: 0, maxWidth: "100%" }, style]}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {title ? <KText accessibilityRole="header" style={[typeStyle("sectionTitle"), { color: colors.text, marginBottom: geometry.headerGap }]}>{title}</KText> : null}
      <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast"
        snapToOffsets={offsets.length === count ? offsets : undefined} disableIntervalMomentum={slideSize !== "auto"}
        onScroll={scroll} scrollEventThrottle={16} onMomentumScrollEnd={settle}
        onContentSizeChange={w => { content.current = w; }} contentContainerStyle={{ gap: space }}>
        {slides.map((slide, i) => (
          <View key={i} onLayout={measure(i)} accessibilityLabel={m.slideOf(i + 1, count)}
            style={slideWidth === undefined ? undefined : { width: slideWidth }}>{slide}</View>
        ))}
      </ScrollView>
      {indicators && count > 1 && (
        <View accessibilityLabel={m.slides} style={{ flexDirection: "row", justifyContent: "center",
          marginTop: geometry.indicatorOffset - (geometry.indicatorPress - geometry.indicatorSize) / 2 }}>
          {slides.map((_, i) => {
            const selected = i === current;
            return (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={m.goToSlide(i + 1)} accessibilityState={{ selected }}
                focusRingRadius={geometry.indicatorSize / 2} onPress={() => { scrollTo(i, true); change(i); }}
                style={{ width: geometry.indicatorPressWidth, height: geometry.indicatorPress, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: selected ? geometry.indicatorActiveWidth : geometry.indicatorSize, height: geometry.indicatorSize,
                  borderRadius: geometry.indicatorSize / 2, backgroundColor: selected ? colors.text : colors.borderStrong }} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
