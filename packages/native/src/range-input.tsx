import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { sliderFormatter, sliderFrontThumb, sliderMarks, sliderPick, sliderValueText, type SliderMarks } from "../../../shared/package-runtime/slider-view";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { alertTint } from "./alert-actions-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Platform, Pressable, View, type ViewStyle } from "react-native";
import { tokens, createSliderDomain, sliderKey } from "@kjun-ui/tokens";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
import { focusVisible } from "./a11y";
export type { KjunSliderMark } from "../../../shared/package-runtime/slider-view";
const slider = tokens.extensions.slider;
const targetSize = tokens.native.minimumTouchTarget;
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
  /** Like Web: true for a dot on every step (up to 24), or values with optional labels under the rail. */
  marks?: SliderMarks;
  /** sm: 12px text, 4px rail, 16px thumb. The touch area stays 44pt. */
  size?: "sm" | "md";
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface KjunRangeSliderProps extends Omit<
  KjunSliderProps,
  "value" | "onValueChange" | "onChangeCommit"
> {
  value: [number, number];
  thumbLabels?: [string, string];
  onValueChange?: (value: [number, number]) => void;
  onChangeCommit?: (value: [number, number]) => void;
}
// Pointer-only track; keyboard focus belongs to the slider thumbs.
// On Native Web, Pressable ignores focusable and reads tabIndex instead.
const trackFocus = { tabIndex: -1 } as object;
function RangeInput({
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  ariaLabel,
  showValue = true,
  formatValue: formatter,
  marks,
  size = "md",
  onValueChange,
  onChangeCommit,
  ...rest
}: KjunSliderProps | KjunRangeSliderProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  const formatValue = sliderFormatter(formatter, scope.intl);
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const geometry = size === "sm" ? slider.small : slider;
  const [labelWidths, setLabelWidths] = useState<Record<number, number>>({});
  const domain = createSliderDomain(min, max, step),
    values = Array.isArray(value) ? value : [value];
  const valid =
    domain.valid &&
    (!Array.isArray(value) || value.length === 2) &&
    values.every(domain.accepts) &&
    (values.length === 1 || values[0] <= values[1]);
  const blocked = disabled || !valid;
  const effectiveMax = valid ? domain.snap(max) : min;
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const track = useRef<View>(null),
    measured = useRef({ x: 0, width: 1 }),
    selected = useRef(0),
    pending = useRef(false),
    dirty = useRef(false);
  const latest = useRef(values);
  latest.current = values;
  const callbacks = useRef({ onValueChange, onChangeCommit });
  callbacks.current = { onValueChange, onChangeCommit };
  useEffect(() => {
    if (!valid) console.warn("KJUN Slider: 범위·step·값을 확인하세요.");
  }, [valid]);
  useEffect(() => {
    if (blocked) {
      setDragging(null);
      setHovered(null);
      setFocused(null);
    }
  }, [blocked]);
  const emit = (index: number, number: number) => {
    if (disabled || !valid) return;
    const next = [...latest.current];
    next[index] = Math.min(
      index === 0 && next.length === 2 ? next[1] : max,
      Math.max(index === 1 ? next[0] : min, domain.snap(number)),
    );
    if (next[index] === latest.current[index]) return;
    dirty.current = true;
    latest.current = next;
    (callbacks.current.onValueChange as (value: number | number[]) => void)?.(
      next.length === 1 ? next[0] : next,
    );
  };
  const commit = () => {
    if (valid && !disabled && dirty.current) {
      dirty.current = false;
      (callbacks.current.onChangeCommit as (value: number | number[]) => void)?.(
        latest.current.length === 1 ? latest.current[0] : latest.current,
      );
    }
  };
  const position = (pageX: number) =>
    min +
    Math.max(0, Math.min(1, (pageX - measured.current.x) / measured.current.width)) *
      (effectiveMax - min);
  const measure = () =>
    track.current?.measure((_x, _y, width, _height, pageX) => {
      measured.current = { x: pageX, width: Math.max(1, width) };
    });
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => !disabled && valid,
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          !disabled &&
          valid &&
          Math.abs(gesture.dx) > 3 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderGrant: (event) => {
          const number = position(event.nativeEvent.pageX);
          // With both thumbs on one value, the first move that changes it picks the thumb that can follow it.
          const pick = sliderPick(latest.current, number, domain.snap(number));
          selected.current = pick.index;
          pending.current = pick.pending;
          setDragging(selected.current);
          emit(selected.current, number);
        },
        onPanResponderMove: (event) => {
          const number = position(event.nativeEvent.pageX);
          if (pending.current) {
            if (domain.snap(number) === latest.current[0]) return;
            selected.current = number > latest.current[0] ? 1 : 0;
            pending.current = false;
            setDragging(selected.current);
          }
          emit(selected.current, number);
        },
        onPanResponderRelease: () => {
          setDragging(null);
          commit();
        },
        onPanResponderTerminate: () => {
          setDragging(null);
          dirty.current = false;
        },
      }),
    [min, max, step, disabled, valid],
  );
  const thumbs =
    "thumbLabels" in rest ? rest.thumbLabels || [m.minimum, m.maximum] : [m.minimum, m.maximum];
  const percent = (n: number) =>
    valid && effectiveMax > min
      ? Math.max(0, Math.min(100, ((n - min) / (effectiveMax - min)) * 100))
      : 0;
  const pct = (n: number): `${number}%` => `${n}%`;
  const front = valid ? sliderFrontThumb(values, min, effectiveMax) : null;
  const dots = valid ? sliderMarks(marks, min, effectiveMax, step, values) : [];
  const half = geometry.thumb / 2, captioned = !!label || showValue;
  // Like Web: the touch area stays 44pt while the visible band sits captionGap under the caption.
  const pull = (targetSize - geometry.trackHeight) / 2;
  const textRole = size === "sm" ? "controlSmall" : undefined;
  return (
    <View style={{ minWidth: slider.minimumWidth, width: "100%", opacity: blocked ? tokens.states.opacity.disabled : 1 }}>
      {captioned ? (
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: tokens.dimension.value12, minWidth: 0 }}>
          {label ? (
            // Same color as field labels in a form, like Web .kjun-slider-label.
            <KText style={{ ...typeStyle(textRole ?? "label"), ...(textRole ? { fontWeight: typeStyle("label").fontWeight } : null), color: colors.text, flexShrink: 1, minWidth: 0 }}>{label}</KText>
          ) : null}
          {showValue ? (
            <KText style={{ ...typeStyle(textRole ?? "control"), fontFamily: numericFontFamily ?? fontFamily, fontVariant: ["tabular-nums"], flexShrink: 0, marginLeft: "auto" }}>
              {sliderValueText(values, formatValue)}
            </KText>
          ) : null}
        </View>
      ) : null}
      <View
        ref={track}
        onLayout={measure}
        onTouchStart={measure}
        {...responder.panHandlers}
        style={{ height: targetSize, marginHorizontal: half, marginTop: captioned ? slider.captionGap - pull : 0 }}
      >
        {/* The rail reaches half a thumb past the track on both sides, so it lines up with the caption. */}
        <Pressable
          accessible={false}
          focusable={false}
          {...trackFocus}
          disabled={blocked}
          onPress={(event) => {
            const number = position(event.nativeEvent.pageX);
            emit(sliderPick(values, number, domain.snap(number)).index, number);
            commit();
          }}
          style={{ position: "absolute", top: 0, bottom: 0, left: -half, right: -half, justifyContent: "center" }}
        >
          <View style={{ height: geometry.track, borderRadius: tokens.radius.radius9999, backgroundColor: alertTint(colors.text, "tintActive", colors.border) }} />
        </Pressable>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: (targetSize - geometry.track) / 2,
            height: geometry.track,
            borderRadius: tokens.radius.radius9999,
            // A single slider fills from the rail's own start; a range fills between its thumbs.
            left: values.length === 2 ? pct(percent(values[0])) : -half,
            right: pct(100 - percent(values[values.length - 1])),
            backgroundColor: colors.brand,
          }}
        />
        {dots.map((dot) => (
          <View key={dot.value} pointerEvents="none" style={{ position: "absolute", top: (targetSize - slider.markSize) / 2, left: pct(dot.fraction * 100),
            marginLeft: -slider.markSize / 2, width: slider.markSize, height: slider.markSize, borderRadius: tokens.radius.radius9999,
            backgroundColor: dot.active ? colors.switchThumb : colors.textTertiary }} />
        ))}
        {values.map((number, index) => (
          <Pressable
            key={index}
            accessibilityRole="adjustable"
            accessibilityLabel={values.length === 2 ? thumbs[index] : ariaLabel || label || m.value}
            accessibilityState={{ disabled: disabled || !valid }}
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
              emit(index, number + (event.nativeEvent.actionName === "increment" ? step : -step));
              commit();
            }}
            disabled={disabled || !valid}
            onHoverIn={() => setHovered(index)}
            onHoverOut={() => setHovered(null)}
            onFocus={(event) => {
              if (focusVisible(event.currentTarget)) setFocused(index);
            }}
            onBlur={() => {
              setFocused(null);
              commit();
            }}
            {...(Platform.OS === "web"
              ? {
                  "aria-valuenow": number,
                  "aria-valuemin": index === 1 ? values[0] : min,
                  "aria-valuemax":
                    values.length === 2 && index === 0 ? values[1] : domain.snap(max),
                  "aria-valuetext": formatValue(number),
                  "aria-disabled": blocked,
                  onKeyDown: (event: any) => {
                    const next = sliderKey(event.key, number, min, max, step);
                    if (next !== null) {
                      event.preventDefault();
                      emit(index, next);
                    }
                  },
                  onKeyUp: commit,
                }
              : {})}
            style={{
              position: "absolute",
              left: pct(percent(number)),
              width: targetSize,
              height: targetSize,
              marginLeft: -targetSize / 2,
              alignItems: "center",
              justifyContent: "center",
              // The focused or dragged thumb, else the overlapping thumb that can still move, sits on top.
              zIndex: focused === index || dragging === index ? 2 : front === index ? 1 : 0,
              ...(Platform.OS === "web"
                ? ({
                    outlineStyle: "solid",
                    outlineWidth: 0,
                    cursor: blocked ? "default" : dragging === index ? "grabbing" : "grab",
                  } as unknown as ViewStyle)
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
                  ? ({
                      outlineStyle: "solid",
                      outlineWidth: tokens.states.focus.width,
                      outlineOffset: tokens.states.focus.choiceOffset,
                      outlineColor: colors.focusRing,
                    } as ViewStyle)
                  : {}),
              }}
            />
            {/* Like Web: pressing adds a brand halo (hover a lighter one) around the lifted white thumb, which grows slightly. */}
            {!blocked && (dragging === index || hovered === index) ? (
              <View pointerEvents="none" style={{ position: "absolute", zIndex: -1, width: geometry.thumb + slider.haloSize * 2, height: geometry.thumb + slider.haloSize * 2,
                borderRadius: tokens.radius.radius9999, backgroundColor: alertTint(colors.brand, dragging === index ? "tintActive" : "tintControl", "transparent") }} />
            ) : null}
          </Pressable>
        ))}
      </View>
      {dots.some((dot) => dot.label) ? (
        // Labels center on their mark once measured; the first and last align to the rail ends.
        <View aria-hidden style={{ height: tokens.typography.caption.lineHeightPx, marginHorizontal: half, marginTop: slider.markLabelGap - pull }}>
          {dots.filter((dot) => dot.label).map((dot) => (
            <KText
              key={dot.value}
              onLayout={(event) => { const width = event.nativeEvent.layout.width; setLabelWidths((old) => old[dot.value] === width ? old : { ...old, [dot.value]: width }); }}
              style={{ ...typeStyle("caption"), color: colors.textTertiary, position: "absolute", top: 0, ...(dot.edge === "end" ? { right: -half } : { left: dot.edge === "start" ? -half : pct(dot.fraction * 100) }),
                ...(dot.edge ? null : { transform: [{ translateX: -(labelWidths[dot.value] ?? 0) / 2 }] }) }}
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
