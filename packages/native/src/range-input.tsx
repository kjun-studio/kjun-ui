import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  createSliderSession, sliderFormatter, sliderFractions, sliderFrontThumb, sliderGap, sliderMarks, sliderOriginFraction, sliderValueAt, sliderValueText,
  type SliderMarks, type SliderOrientation, type SliderValueLabel,
} from "../../../shared/package-runtime/slider-view";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { useEffect, useMemo, useRef, useState } from "react";
import { I18nManager, PanResponder, Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens, createSliderDomain } from "@kjun-ui/tokens";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
import { focusVisible } from "./a11y";
export type { KjunSliderMark, SliderValueLabel as KjunSliderValueLabel } from "../../../shared/package-runtime/slider-view";
const slider = tokens.extensions.slider;
const targetSize = tokens.native.minimumTouchTarget;
const captionLine = tokens.typography.caption.lineHeightPx;
export interface KjunSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  /** Hides the visible value only; each thumb still reports its value to assistive technology. */
  showValue?: boolean;
  /** Formats the visible value and each thumb's accessible value text. Values stay numeric. Defaults to the locale's number format. */
  formatValue?: (value: number) => string;
  /** Like Web: true for a dot on every step (up to 24), or values with optional labels beside the rail. */
  marks?: SliderMarks;
  /** sm: 12px text, 4px rail, 16px thumb. The touch area stays 44pt. */
  size?: "sm" | "md";
  /** vertical: the rail runs bottom (min) to top (max), `length` pt long. */
  orientation?: SliderOrientation;
  length?: number;
  /** Like Web: the value in a bubble on the thumb, "drag" while dragging or keyboard-focused, "always", or "off" (default). */
  valueLabel?: SliderValueLabel;
  /** The fill grows from this value instead of min, for two-way values such as -50…50; a tick marks it. Single slider only. */
  fillOrigin?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface KjunRangeSliderProps extends Omit<KjunSliderProps, "value" | "fillOrigin" | "onValueChange" | "onChangeCommit"> {
  value: [number, number];
  /** The fewest steps the two thumbs keep between them; 0 (default) lets them meet. */
  minStepsBetweenThumbs?: number;
  thumbLabels?: [string, string];
  /** The visible text for the whole range, e.g. "20만~80만 원". Each thumb keeps formatValue. */
  formatRange?: (start: number, end: number) => string;
  onValueChange?: (value: [number, number]) => void;
  onChangeCommit?: (value: [number, number]) => void;
}
function RangeInput(props: KjunSliderProps | KjunRangeSliderProps) {
  const { value, min = 0, max = 100, step = 1, disabled = false, label, ariaLabel, showValue = true, formatValue: formatter, marks,
    size = "md", orientation = "horizontal", valueLabel = "off", style, testID } = props;
  const fillOrigin = "fillOrigin" in props ? props.fillOrigin : undefined;
  const gap = sliderGap("minStepsBetweenThumbs" in props ? props.minStepsBetweenThumbs : undefined, step);
  const scope = useKjunMessageScope(), m = scope.messages;
  const formatValue = sliderFormatter(formatter, scope.intl, min, step);
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const geometry = size === "sm" ? slider.small : slider;
  const vertical = orientation === "vertical";
  // Horizontal positions use start/end, which React Native already mirrors; only touches and arrow keys need the direction.
  const rtl = I18nManager.isRTL && !vertical;
  const length = props.length ?? slider.verticalLength;
  const domain = createSliderDomain(min, max, step), values = Array.isArray(value) ? value : [value];
  const valid = domain.valid && (!Array.isArray(value) || value.length === 2) && values.every(domain.accepts) && (values.length === 1 || values[0] <= values[1]);
  const blocked = disabled || !valid;
  const effectiveMax = valid ? domain.snap(max) : max;
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [labelWidths, setLabelWidths] = useState<Record<number, number>>({});
  const track = useRef<View>(null);
  const current = useRef({ props, min, effectiveMax, step, domain, blocked, rtl, vertical, gap });
  current.current = { props, min, effectiveMax, step, domain, blocked, rtl, vertical, gap };
  const thumbRefs = useRef<(View | null)[]>([]);
  const session = useMemo(() => createSliderSession(values, {
    min: () => current.current.min, max: () => current.current.effectiveMax, step: () => current.current.step,
    snap: (number) => current.current.domain.snap(number), blocked: () => current.current.blocked, gap: () => current.current.gap,
    emit: (next) => (current.current.props.onValueChange as ((value: number | number[]) => void) | undefined)?.(next.length === 1 ? next[0] : next),
    commit: (next) => (current.current.props.onChangeCommit as ((value: number | number[]) => void) | undefined)?.(next.length === 1 ? next[0] : next),
    // Like Web: the pressed thumb takes keyboard focus, so arrow keys continue from it on Native Web. The focus waits for the
    // browser's own mousedown handling, which would otherwise move focus back to the page.
    focus: (index) => {
      setDragging(index);
      if (Platform.OS === "web") setTimeout(() => (thumbRefs.current[index] as unknown as HTMLElement | null)?.focus?.({ preventScroll: true }));
    },
  }), []);
  session.sync(values);
  useEffect(() => {
    if (!valid) console.warn("KJUN Slider: 범위·step·값을 확인하세요.");
  }, [valid]);
  useEffect(() => {
    if (blocked) {
      session.cancel();
      setDragging(null);
      setHovered(null);
      setFocused(null);
    }
  }, [blocked]);
  // The track is measured again whenever a touch starts. That finishes after the touch's first event, so the press uses the
  // last box at once and, if the track has moved since (a scrolled view), the fresh box then corrects the value.
  const box = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const valueAt = (pageX: number, pageY: number) => {
    const at = box.current!, c = current.current;
    return sliderValueAt(c.vertical ? pageY - at.y : pageX - at.x, c.vertical ? at.height : at.width, c.min, c.effectiveMax, { rtl: c.rtl, vertical: c.vertical });
  };
  const measure = (then?: () => void) => track.current?.measure((_x, _y, width, height, x, y) => {
    const next = { x, y, width, height }, old = box.current;
    box.current = next;
    if (!old || old.x !== next.x || old.y !== next.y || old.width !== next.width || old.height !== next.height) then?.();
  });
  const withBox = (pageX: number, pageY: number, run: (number: number) => void) => {
    last.current = { x: pageX, y: pageY };
    if (box.current) {
      run(valueAt(pageX, pageY));
      measure(() => { if (session.active !== null && last.current) session.move(valueAt(last.current.x, last.current.y)); });
    } else measure(() => run(valueAt(pageX, pageY)));
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => !current.current.blocked,
        onMoveShouldSetPanResponderCapture: (_event, gesture) => {
          const along = current.current.vertical ? gesture.dy : gesture.dx, across = current.current.vertical ? gesture.dx : gesture.dy;
          return !current.current.blocked && Math.abs(along) > 3 && Math.abs(along) > Math.abs(across);
        },
        onPanResponderGrant: (event) => {
          const { pageX, pageY } = event.nativeEvent;
          // With both thumbs on one value, the first move that changes it picks the thumb that can follow it.
          withBox(pageX, pageY, (number) => session.press(number));
        },
        onPanResponderMove: (event) => {
          const { pageX, pageY } = event.nativeEvent;
          last.current = { x: pageX, y: pageY };
          if (box.current) session.move(valueAt(pageX, pageY));
        },
        onPanResponderRelease: () => {
          last.current = null;
          setDragging(null);
          session.release();
        },
        onPanResponderTerminate: () => {
          last.current = null;
          setDragging(null);
          session.cancel();
        },
      }),
    [],
  );
  const thumbs = "thumbLabels" in props ? props.thumbLabels || [m.minimum, m.maximum] : [m.minimum, m.maximum];
  const formatRange = "formatRange" in props ? props.formatRange : undefined;
  const fractions = sliderFractions(values, min, effectiveMax);
  const front = valid ? sliderFrontThumb(values, min, effectiveMax) : null;
  const dots = valid ? sliderMarks(marks, min, effectiveMax, step, values, { vertical }, fillOrigin) : [];
  const origin = valid ? sliderOriginFraction(fillOrigin, min, effectiveMax) : undefined;
  const half = geometry.thumb / 2, captioned = !!label || showValue;
  const pct = (n: number): `${number}%` => `${n}%`;
  // Logical positions: horizontal from the start edge (mirrored in right-to-left), vertical from the top (max).
  const along = (fraction: number) => vertical ? { top: pct((1 - fraction) * 100) } : { start: pct(fraction * 100) };
  const [low, high] = origin === undefined ? [fractions[0], fractions[1]] : [Math.min(origin, fractions[0]), Math.max(origin, fractions[0])];
  const fill = values.length === 2 || origin !== undefined
    ? vertical ? { top: pct((1 - high) * 100), bottom: pct(low * 100) } : { start: pct(low * 100), end: pct((1 - high) * 100) }
    : vertical ? { top: pct((1 - fractions[0]) * 100), bottom: -half } : { start: -half, end: pct((1 - fractions[0]) * 100) };
  // Like Web: the touch area stays 44pt while the visible band sits captionGap under the caption.
  const pull = (targetSize - geometry.trackHeight) / 2;
  const textRole = size === "sm" ? "controlSmall" : undefined;
  const pickMark = (number: number) => {
    if (blocked) return;
    session.press(number);
    session.release();
    setDragging(null);
  };
  const markLabels = dots.filter((dot) => dot.label);
  return (
    // Like Web: one group named by the label (or ariaLabel).
    <View testID={testID} role="group" accessibilityLabel={label || ariaLabel || m.value} style={[{ minWidth: vertical ? undefined : slider.minimumWidth, width: vertical ? undefined : "100%", alignItems: vertical ? "center" : undefined,
      // A mouse drag must not select the caption: RN Web ends the gesture when the text selection changes.
      ...(Platform.OS === "web" ? ({ userSelect: "none" } as ViewStyle) : null) }, style]}>
      {captioned ? (
        <View style={vertical ? { alignItems: "center" } : { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: tokens.dimension.value12, minWidth: 0 }}>
          {label ? (
            // Same color as field labels in a form, like Web .kjun-slider-label.
            <KText style={{ ...typeStyle(textRole ?? "label"), ...(textRole ? { fontWeight: typeStyle("label").fontWeight } : null), color: blocked ? colors.textDisabled : colors.text, flexShrink: 1, minWidth: 0 }}>{label}</KText>
          ) : null}
          {showValue ? (
            <KText style={{ ...typeStyle(textRole ?? "control"), fontFamily: numericFontFamily ?? fontFamily, fontVariant: ["tabular-nums"], color: blocked ? colors.textDisabled : colors.text, flexShrink: 0, marginLeft: vertical ? undefined : "auto" }}>
              {sliderValueText(values, formatValue, formatRange)}
            </KText>
          ) : null}
        </View>
      ) : null}
      <View style={vertical ? { flexDirection: "row", marginTop: captioned ? slider.captionGap + half : half, marginBottom: half } : undefined}>
        <View
          ref={track}
          onLayout={() => measure()}
          {...responder.panHandlers}
          style={vertical ? { width: targetSize, height: length } : { height: targetSize, marginHorizontal: half, marginTop: captioned ? slider.captionGap - pull : 0 }}
        >
          {/* The rail reaches half a thumb past the track at both ends, so it lines up with the caption. Presses on it go to
              the track's pan responder, which captures every touch: a tap is a press and an immediate release. */}
          <View
            style={vertical
              ? { position: "absolute", left: 0, right: 0, top: -half, bottom: -half, alignItems: "center" }
              : { position: "absolute", top: 0, bottom: 0, start: -half, end: -half, justifyContent: "center" }}
          >
            {/* One empty-rail role for Slider, RangeSlider and Progress, like Web: the switch-track role. */}
            <View style={{ [vertical ? "width" : "height"]: geometry.track, ...(vertical ? { flex: 1 } : null), borderRadius: tokens.radius.radius9999,
              backgroundColor: colors.switchTrack ?? colors.border }} />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              ...(vertical ? { left: (targetSize - geometry.track) / 2, width: geometry.track } : { top: (targetSize - geometry.track) / 2, height: geometry.track }),
              // Like Web: square at the fill origin, where the origin tick sits.
              borderRadius: origin === undefined ? tokens.radius.radius9999 : 0,
              ...fill,
              // One disabled rule, like Button and fields: no fading; the fill takes the disabled-text role.
              backgroundColor: blocked ? colors.textDisabled : colors.brand,
            }}
          />
          {dots.filter((dot) => dot.dot).map((dot) => {
            // The fill origin is a tick across the band, like Web; other marks are dots.
            const [across, along_] = dot.origin ? [slider.originTick.length, slider.originTick.width] : [slider.markSize, slider.markSize];
            return <View key={dot.value} pointerEvents="none" style={{ position: "absolute", ...along(dot.fraction),
              ...(vertical
                ? { left: (targetSize - across) / 2, marginTop: -along_ / 2, width: across, height: along_ }
                : { top: (targetSize - across) / 2, marginStart: -along_ / 2, width: along_, height: across }),
              borderRadius: tokens.radius.radius9999,
              backgroundColor: dot.active && !dot.origin ? colors.switchThumb : colors.textTertiary }} />;
          })}
          {values.map((number, index) => (
            <Pressable
              key={index}
              accessibilityRole="adjustable"
              ref={(node) => { thumbRefs.current[index] = node; }}
              // Like Web (React Aria): a range thumb reads its own label, then the slider's.
              accessibilityLabel={values.length === 2 ? [thumbs[index], label || ariaLabel].filter(Boolean).join(" ") : label || ariaLabel || m.value}
              accessibilityState={{ disabled: blocked }}
              accessibilityValue={{
                min: index === 1 ? values[0] + gap : min,
                max: values.length === 2 && index === 0 ? values[1] - gap : effectiveMax,
                now: number,
                text: formatValue(number),
              }}
              accessibilityActions={[
                { name: "increment", label: m.increase },
                { name: "decrement", label: m.decrease },
              ]}
              onAccessibilityAction={(event) => {
                session.update(index, number + (event.nativeEvent.actionName === "increment" ? step : -step));
                session.commit();
              }}
              disabled={blocked}
              onHoverIn={() => setHovered(index)}
              onHoverOut={() => setHovered(null)}
              onFocus={(event) => {
                if (focusVisible(event.currentTarget)) setFocused(index);
              }}
              onBlur={() => {
                setFocused(null);
                session.commit();
              }}
              {...(Platform.OS === "web"
                ? {
                    "aria-valuenow": number,
                    "aria-valuemin": index === 1 ? values[0] + gap : min,
                    "aria-valuemax": values.length === 2 && index === 0 ? values[1] - gap : effectiveMax,
                    "aria-valuetext": formatValue(number),
                    "aria-orientation": orientation,
                    "aria-disabled": blocked,
                    onKeyDown: (event: any) => {
                      if (session.key(index, event.key, rtl)) event.preventDefault();
                    },
                    onKeyUp: () => session.commit(),
                  }
                : {})}
              style={{
                position: "absolute",
                ...along(fractions[index]),
                width: targetSize,
                height: targetSize,
                ...(vertical ? { left: 0, marginTop: -targetSize / 2 } : { marginStart: -targetSize / 2 }),
                alignItems: "center",
                justifyContent: "center",
                // The focused thumb, else the overlapping thumb that can still move, sits on top. Dragging leaves the order
                // alone: restacking the thumbs under the pointer mid-drag hands the touch to the other thumb on RN Web.
                zIndex: focused === index ? 2 : front === index ? 1 : 0,
                ...(Platform.OS === "web"
                  ? ({ outlineStyle: "solid", outlineWidth: 0, cursor: blocked ? "default" : dragging === index ? "grabbing" : "grab" } as unknown as ViewStyle)
                  : {}),
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  width: !blocked && dragging === index ? geometry.pressedThumb : geometry.thumb,
                  height: !blocked && dragging === index ? geometry.pressedThumb : geometry.thumb,
                  borderRadius: tokens.radius.radius9999,
                  backgroundColor: colors.switchThumb,
                  // Like Web: the lift plus a hairline in the strong border role, so a white thumb reads on a white surface.
                  // Disabled drops the lift and draws the edge in the disabled-text role.
                  borderWidth: tokens.border.defaultWidth,
                  borderColor: blocked ? colors.textDisabled : colors.borderStrong,
                  boxShadow: blocked ? undefined : shadowLayers(tokens.extensions.slider.elevation, colors),
                  ...(Platform.OS === "web" && !blocked && focused === index
                    ? ({ outlineStyle: "solid", outlineWidth: tokens.states.focus.width, outlineOffset: tokens.states.focus.choiceOffset, outlineColor: colors.focusRing } as ViewStyle)
                    : {}),
                }}
              />
              {/* Like Web: pressing adds a brand halo (hover a lighter one) behind the lifted white thumb, which grows to pressedThumb. */}
              {!blocked && (dragging === index || hovered === index) ? (
                <View pointerEvents="none" style={{ position: "absolute", zIndex: -1, width: geometry.thumb + slider.haloSize * 2, height: geometry.thumb + slider.haloSize * 2,
                  borderRadius: tokens.radius.radius9999, backgroundColor: colors.brand,
                  opacity: dragging === index ? tokens.states.opacity.tintActive : tokens.states.opacity.tintControl }} />
              ) : null}
              {/* Like Web .kjun-slider-value-label: the value in a tooltip-styled bubble above the thumb (beside it when vertical). */}
              {valueLabel === "always" || (valueLabel === "drag" && !blocked && (dragging === index || focused === index)) ? (
                <View aria-hidden pointerEvents="none" style={{ position: "absolute",
                  ...(vertical ? { start: targetSize / 2 + geometry.thumb / 2 + slider.valueLabelGap } : { bottom: targetSize / 2 + geometry.thumb / 2 + slider.valueLabelGap }),
                  paddingVertical: tokens.extensions.tooltip.paddingY, paddingHorizontal: tokens.extensions.tooltip.paddingX,
                  borderRadius: tokens.radius.radius6, backgroundColor: colors.chartTooltipBg }}>
                  <KText numberOfLines={1} style={{ ...typeStyle("caption"), fontFamily: numericFontFamily ?? fontFamily, fontVariant: ["tabular-nums"], color: colors.chartTooltipText }}>
                    {formatValue(number)}
                  </KText>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
        {vertical && markLabels.length ? (
          // Vertical labels sit beside the rail, centered on their marks.
          <View aria-hidden style={{ height: length, marginStart: slider.markLabelGap }}>
            {/* A zero-height copy of the labels gives the column the widest label's width, so none of them wraps. */}
            <View style={{ height: 0, overflow: "hidden" }}>
              {markLabels.map((dot) => <KText key={dot.value} style={typeStyle("caption")}>{dot.label}</KText>)}
            </View>
            {markLabels.map((dot) => (
              <KText key={dot.value} onPress={() => pickMark(dot.value)}
                style={{ ...typeStyle("caption"), color: blocked ? colors.textDisabled : colors.textTertiary, position: "absolute", start: 0, ...along(dot.fraction), marginTop: -captionLine / 2 }}>
                {dot.label}
              </KText>
            ))}
          </View>
        ) : null}
      </View>
      {!vertical && markLabels.length ? (
        // Labels center on their mark once measured; the first and last align to the rail ends.
        <View aria-hidden style={{ height: captionLine, marginHorizontal: half, marginTop: slider.markLabelGap - pull }}>
          {markLabels.map((dot) => (
            <KText
              key={dot.value}
              onPress={() => pickMark(dot.value)}
              onLayout={(event) => { const width = event.nativeEvent.layout.width; setLabelWidths((old) => old[dot.value] === width ? old : { ...old, [dot.value]: width }); }}
              style={{ ...typeStyle("caption"), color: blocked ? colors.textDisabled : colors.textTertiary, position: "absolute", top: 0,
                ...(dot.value === effectiveMax ? { end: -half } : dot.value === min ? { start: -half } : { start: pct(dot.fraction * 100),
                  // Centering moves against the start edge: left in left-to-right, right in right-to-left.
                  transform: [{ translateX: (rtl ? 1 : -1) * (labelWidths[dot.value] ?? 0) / 2 }] }) }}
            >
              {dot.label}
            </KText>
          ))}
        </View>
      ) : null}
    </View>
  );
}
export function KjunSlider(props: KjunSliderProps) {
  return <RangeInput {...props} />;
}
export function KjunRangeSlider(props: KjunRangeSliderProps) {
  return <RangeInput {...props} />;
}
