import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  createSliderSession, sliderFormatter, sliderFractions, sliderFrontThumb, sliderMarks, sliderValueAt, sliderValueText,
  type SliderMarks, type SliderOrientation,
} from "../../../shared/package-runtime/slider-view";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { useEffect, useMemo, useRef, useState } from "react";
import { I18nManager, PanResponder, Platform, Pressable, View, type ViewStyle } from "react-native";
import { tokens, createSliderDomain } from "@kjun-ui/tokens";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
import { focusVisible } from "./a11y";
export type { KjunSliderMark } from "../../../shared/package-runtime/slider-view";
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
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface KjunRangeSliderProps extends Omit<KjunSliderProps, "value" | "onValueChange" | "onChangeCommit"> {
  value: [number, number];
  thumbLabels?: [string, string];
  /** The visible text for the whole range, e.g. "20만~80만 원". Each thumb keeps formatValue. */
  formatRange?: (start: number, end: number) => string;
  onValueChange?: (value: [number, number]) => void;
  onChangeCommit?: (value: [number, number]) => void;
}
// Pointer-only track; keyboard focus belongs to the slider thumbs.
// On Native Web, Pressable ignores focusable and reads tabIndex instead.
const trackFocus = { tabIndex: -1 } as object;
function RangeInput(props: KjunSliderProps | KjunRangeSliderProps) {
  const { value, min = 0, max = 100, step = 1, disabled = false, label, ariaLabel, showValue = true, formatValue: formatter, marks,
    size = "md", orientation = "horizontal" } = props;
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
  const current = useRef({ props, min, effectiveMax, step, domain, blocked, rtl, vertical });
  current.current = { props, min, effectiveMax, step, domain, blocked, rtl, vertical };
  const session = useMemo(() => createSliderSession(values, {
    min: () => current.current.min, max: () => current.current.effectiveMax, step: () => current.current.step,
    snap: (number) => current.current.domain.snap(number), blocked: () => current.current.blocked,
    emit: (next) => (current.current.props.onValueChange as ((value: number | number[]) => void) | undefined)?.(next.length === 1 ? next[0] : next),
    commit: (next) => (current.current.props.onChangeCommit as ((value: number | number[]) => void) | undefined)?.(next.length === 1 ? next[0] : next),
    focus: (index) => setDragging(index),
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
  const dots = valid ? sliderMarks(marks, min, effectiveMax, step, values, { vertical }) : [];
  const half = geometry.thumb / 2, captioned = !!label || showValue;
  const pct = (n: number): `${number}%` => `${n}%`;
  // Logical positions: horizontal from the start edge (mirrored in right-to-left), vertical from the top (max).
  const along = (fraction: number) => vertical ? { top: pct((1 - fraction) * 100) } : { start: pct(fraction * 100) };
  const fill = values.length === 2
    ? vertical ? { top: pct((1 - fractions[1]) * 100), bottom: pct(fractions[0] * 100) } : { start: pct(fractions[0] * 100), end: pct((1 - fractions[1]) * 100) }
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
    <View style={{ minWidth: vertical ? undefined : slider.minimumWidth, width: vertical ? undefined : "100%", alignItems: vertical ? "center" : undefined,
      opacity: blocked ? tokens.states.opacity.disabled : 1,
      // A mouse drag must not select the caption: RN Web ends the gesture when the text selection changes.
      ...(Platform.OS === "web" ? ({ userSelect: "none" } as ViewStyle) : null) }}>
      {captioned ? (
        <View style={vertical ? { alignItems: "center" } : { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: tokens.dimension.value12, minWidth: 0 }}>
          {label ? (
            // Same color as field labels in a form, like Web .kjun-slider-label.
            <KText style={{ ...typeStyle(textRole ?? "label"), ...(textRole ? { fontWeight: typeStyle("label").fontWeight } : null), color: colors.text, flexShrink: 1, minWidth: 0 }}>{label}</KText>
          ) : null}
          {showValue ? (
            <KText style={{ ...typeStyle(textRole ?? "control"), fontFamily: numericFontFamily ?? fontFamily, fontVariant: ["tabular-nums"], flexShrink: 0, marginLeft: vertical ? undefined : "auto" }}>
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
          {/* The rail reaches half a thumb past the track at both ends, so it lines up with the caption. */}
          <Pressable
            accessible={false}
            focusable={false}
            {...trackFocus}
            disabled={blocked}
            onPress={(event) => {
              const { pageX, pageY } = event.nativeEvent;
              withBox(pageX, pageY, (number) => { session.press(number); session.release(); setDragging(null); });
            }}
            style={vertical
              ? { position: "absolute", left: 0, right: 0, top: -half, bottom: -half, alignItems: "center" }
              : { position: "absolute", top: 0, bottom: 0, start: -half, end: -half, justifyContent: "center" }}
          >
            {/* Text at 16% like Web's color-mix; opacity works for any color format the app passes. */}
            <View style={{ [vertical ? "width" : "height"]: geometry.track, ...(vertical ? { flex: 1 } : null), borderRadius: tokens.radius.radius9999,
              backgroundColor: colors.text, opacity: tokens.states.opacity.tintActive }} />
          </Pressable>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              ...(vertical ? { left: (targetSize - geometry.track) / 2, width: geometry.track } : { top: (targetSize - geometry.track) / 2, height: geometry.track }),
              borderRadius: tokens.radius.radius9999,
              ...fill,
              backgroundColor: colors.brand,
            }}
          />
          {dots.filter((dot) => dot.dot).map((dot) => (
            <View key={dot.value} pointerEvents="none" style={{ position: "absolute", ...along(dot.fraction),
              ...(vertical ? { left: (targetSize - slider.markSize) / 2, marginTop: -slider.markSize / 2 } : { top: (targetSize - slider.markSize) / 2, marginStart: -slider.markSize / 2 }),
              width: slider.markSize, height: slider.markSize, borderRadius: tokens.radius.radius9999,
              backgroundColor: dot.active ? colors.switchThumb : colors.textTertiary }} />
          ))}
          {values.map((number, index) => (
            <Pressable
              key={index}
              accessibilityRole="adjustable"
              accessibilityLabel={values.length === 2 ? thumbs[index] : ariaLabel || label || m.value}
              accessibilityState={{ disabled: blocked }}
              accessibilityValue={{
                min: index === 1 ? values[0] : min,
                max: values.length === 2 && index === 0 ? values[1] : max,
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
                    "aria-valuemin": index === 1 ? values[0] : min,
                    "aria-valuemax": values.length === 2 && index === 0 ? values[1] : effectiveMax,
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
                  // Like Web: the lift plus a hairline in the border role, so a white thumb reads on a white surface.
                  borderWidth: tokens.border.defaultWidth,
                  borderColor: colors.border,
                  boxShadow: shadowLayers(tokens.extensions.slider.elevation, colors),
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
                style={{ ...typeStyle("caption"), color: colors.textTertiary, position: "absolute", start: 0, ...along(dot.fraction), marginTop: -captionLine / 2 }}>
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
              style={{ ...typeStyle("caption"), color: colors.textTertiary, position: "absolute", top: 0,
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
