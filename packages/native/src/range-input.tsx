import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Platform, Pressable, View, type ViewStyle } from "react-native";
import { tokens, createSliderDomain, sliderKey } from "@kjun/tokens";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
import { focusVisible } from "./a11y";
const geometry = tokens.extensions.slider;
const targetSize = tokens.native.minimumTouchTarget;
export interface DsSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface DsRangeSliderProps extends Omit<
  DsSliderProps,
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
  onValueChange,
  onChangeCommit,
  ...rest
}: DsSliderProps | DsRangeSliderProps) {
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
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
          selected.current =
            latest.current.length === 2 &&
            Math.abs(number - latest.current[1]) < Math.abs(number - latest.current[0])
              ? 1
              : 0;
          setDragging(selected.current);
          emit(selected.current, number);
        },
        onPanResponderMove: (event) => emit(selected.current, position(event.nativeEvent.pageX)),
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
    "thumbLabels" in rest ? rest.thumbLabels || ["최솟값", "최댓값"] : ["최솟값", "최댓값"];
  const percent = (n: number) =>
    valid && effectiveMax > min
      ? Math.max(0, Math.min(100, ((n - min) / (effectiveMax - min)) * 100))
      : 0;
  const pct = (n: number): `${number}%` => `${n}%`;
  return (
    <View
      style={{
        minWidth: tokens.extensions.slider.minimumWidth,
        width: "100%",
        gap: tokens.dimension.value4,
        opacity: blocked ? tokens.states.opacity.disabled : 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: tokens.dimension.value12,
          minWidth: 0,
        }}
      >
        {label && (
          <KText
            style={{
              ...typeStyle("label"),
              // Same color as field labels in a form, like Web .kjun-slider-label.
              color: colors.text,
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            {label}
          </KText>
        )}
        <KText
          style={{
            ...typeStyle("control"),
            fontFamily: numericFontFamily ?? fontFamily,
            fontVariant: ["tabular-nums"],
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          {values.join(" – ")}
        </KText>
      </View>
      <View
        ref={track}
        onLayout={measure}
        onTouchStart={measure}
        {...responder.panHandlers}
        style={{ height: targetSize, marginHorizontal: geometry.thumb / 2 }}
      >
        <Pressable
          accessible={false}
          focusable={false}
          {...trackFocus}
          disabled={blocked}
          onPress={(event) => {
            const number = position(event.nativeEvent.pageX);
            const index =
              values.length === 2 && Math.abs(number - values[1]) < Math.abs(number - values[0])
                ? 1
                : 0;
            emit(index, number);
            commit();
          }}
          style={{ position: "absolute", inset: 0, justifyContent: "center" }}
        >
          <View
            style={{
              height: geometry.track,
              borderRadius: tokens.radius.radius9999,
              backgroundColor: colors.border,
            }}
          />
        </Pressable>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: (targetSize - geometry.track) / 2,
            height: geometry.track,
            borderRadius: tokens.radius.radius9999,
            left: pct(values.length === 2 ? percent(values[0]) : 0),
            width: pct(
              percent(values[values.length - 1]) - (values.length === 2 ? percent(values[0]) : 0),
            ),
            backgroundColor: colors.brand,
          }}
        />
        {values.map((number, index) => (
          <Pressable
            key={index}
            accessibilityRole="adjustable"
            accessibilityLabel={values.length === 2 ? thumbs[index] : ariaLabel || label || "값"}
            accessibilityState={{ disabled: disabled || !valid }}
            accessibilityValue={{
              min: index === 1 ? values[0] : min,
              max: values.length === 2 && index === 0 ? values[1] : max,
              now: number,
              text: String(number),
            }}
            accessibilityActions={[
              { name: "increment", label: "늘리기" },
              { name: "decrement", label: "줄이기" },
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
                  "aria-valuetext": String(number),
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
              zIndex: focused === index || dragging === index ? 1 : 0,
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
                width: geometry.thumb,
                height: geometry.thumb,
                borderRadius: tokens.radius.radius9999,
                borderWidth: tokens.border.controlWidth,
                borderColor:
                  !blocked && dragging === index
                    ? colors.brandActive
                    : !blocked && hovered === index
                      ? colors.brandHover
                      : colors.brand,
                backgroundColor: colors.surface,
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
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function DsSlider(props: DsSliderProps) {
  return <RangeInput {...props} />;
}
export function DsRangeSlider(props: DsRangeSliderProps) {
  return <RangeInput {...props} />;
}
