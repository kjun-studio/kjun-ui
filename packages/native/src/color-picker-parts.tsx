import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PanResponder, Platform, View, type ColorValue, type TextInput, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Pattern, Rect, Stop } from "react-native-svg";
import { tokens } from "@kjun-ui/tokens";
import { formatColor, hsvToRgb, readableInk, type Hsv } from "../../../shared/package-runtime/color";
import { channelKey, colorAreaKey, colorSwatchSize } from "../../../shared/package-runtime/color-picker";
import { alphaFieldLive, colorAreaActionKey, hexFieldCommit, hexFieldLive, hexFieldText } from "../../../shared/package-runtime/color-picker-model";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { AccessiblePressable as Pressable, focusVisible } from "./a11y";
import { FieldTextInput } from "./field-surface";
import { KjunIcon } from "./button";
import { inputTypeStyle, typeStyle } from "./typography";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";

// Mirrors the web parts (packages/react/src/color-picker-parts.tsx); drawing uses react-native-svg and dragging PanResponder.
const picker = tokens.extensions.colorPicker;
const rgb = (hsv: Hsv) => formatColor(hsvToRgb(hsv), false);
const percent = (n: number) => Math.round(n * 100);
const flat = { offsetX: 0, offsetY: 0, blurRadius: 0 };
/** A ring like the web one: a surface gap, then a brand band (box shadow layers, so any ColorValue works). */
export const ringShadow = (surface: ColorValue, brand: ColorValue) =>
  [{ ...flat, spreadDistance: picker.ringGap, color: surface }, { ...flat, spreadDistance: picker.ringGap + picker.ringWidth, color: brand }];
const fraction = (value: number, start: number, length: number) => Math.min(1, Math.max(0, length ? (value - start) / length : 0));

/** Draws the surface/border checkerboard under transparent colors. */
export function Checker({ radius = 0 }: { radius?: number }) {
  const { colors } = useKjunStyles(), id = "kjun-checker-" + useId().replace(/[^\w-]/g, ""), cell = picker.checkerSize / 2;
  return (
    <Svg pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius }} width="100%" height="100%">
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={picker.checkerSize} height={picker.checkerSize}>
          <Rect x={0} y={0} width={picker.checkerSize} height={picker.checkerSize} fill={colors.surface} />
          <Rect x={0} y={0} width={cell} height={cell} fill={colors.border} />
          <Rect x={cell} y={cell} width={cell} height={cell} fill={colors.border} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A faint inner edge so a color equal to the surface still shows; the web uses the same inset shadow. */
export function useChipEdge() {
  const { colors } = useKjunStyles();
  const tint = typeof colors.text === "string" ? tintColor(colors.text, 0.12) : undefined;
  return [{ ...flat, spreadDistance: tokens.border.defaultWidth, color: tint ?? colors.border, inset: true }];
}

/** A color chip on the checkerboard, or the "no color" slash when value is null. */
export function ColorChip({ value, size, opacity = 1 }: { value: string | null; size: number; opacity?: number }) {
  const { colors } = useKjunStyles(), edge = useChipEdge(), radius = picker.swatchRadius;
  return (
    <View pointerEvents="none" style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", backgroundColor: colors.surface }}>
      {value ? <Checker radius={radius} /> : (
        <Svg style={{ position: "absolute", top: 0, left: 0 }} width={size} height={size}>
          <Rect x={0} y={0} width={size} height={size} fill={colors.surface} />
          <Rect x={-size} y={size / 2 - tokens.border.defaultWidth} width={size * 3} height={tokens.border.defaultWidth * 2} fill={colors.danger}
            transform={`rotate(-45 ${size / 2} ${size / 2})`} />
        </Svg>
      )}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius, boxShadow: edge,
        backgroundColor: value ?? "transparent", opacity: value ? opacity : 1 } as ViewStyle} />
    </View>
  );
}

/** PanResponder drag over a measured box: moves report each step, release or termination ends once. */
function useDrag(onMove: (x: number, y: number) => void, onStart: () => void, onEnd: () => void) {
  const target = useRef<View>(null), box = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const latest = useRef({ onMove, onStart, onEnd }), released = useRef(false);
  latest.current = { onMove, onStart, onEnd };
  const at = (pageX: number, pageY: number) => { const b = box.current; if (b) latest.current.onMove(fraction(pageX, b.x, b.width), fraction(pageY, b.y, b.height)); };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => {
      const { pageX, pageY } = event.nativeEvent;
      // measure answers later (bridge, Native Web timers): moves wait for this gesture's box, and a quick tap's release
      // ends the drag once the first point has been reported, so the commit sees the change.
      box.current = null; released.current = false;
      latest.current.onStart();
      target.current?.measure((_x, _y, width, height, x, y) => {
        box.current = { x, y, width, height };
        at(pageX, pageY);
        if (released.current) latest.current.onEnd();
      });
    },
    onPanResponderMove: event => at(event.nativeEvent.pageX, event.nativeEvent.pageY),
    onPanResponderRelease: () => { if (box.current) latest.current.onEnd(); else released.current = true; },
    onPanResponderTerminate: () => { if (box.current) latest.current.onEnd(); else released.current = true; },
  }), []);
  return { ref: target, handlers: responder.panHandlers };
}

function Thumb({ color, left, top, focused, children }: { color?: string; left: `${number}%`; top: `${number}%` | number; focused: boolean; children?: ReactNode }) {
  const { colors } = useKjunStyles(), size = picker.thumbSize, inner = size - 2 * (picker.ringWidth + picker.ringGap);
  const ring = focused ? ringShadow(colors.surface, colors.brand) : undefined;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left, top, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
      borderRadius: size / 2, backgroundColor: colors.switchThumb, alignItems: "center", justifyContent: "center",
      boxShadow: [...(ring ?? []), ...shadowLayers(tokens.extensions.slider.elevation, colors)] } as ViewStyle}>
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: "hidden", backgroundColor: children ? undefined : color }}>{children}</View>
    </View>
  );
}

export interface DragHandlers<T> { onMove: (value: T) => void; onPick: (value: T) => void; onStart: () => void; onEnd: () => void }
type Adjust = { label: string; valueText: string; now: number; max: number; keys: (key: string, shift: boolean) => boolean; actions: { name: string; label: string }[]; onAction: (name: string) => void };

/** The adjustable surface shared by the area and the channels: screen reader actions, and Native Web keys. */
function Adjustable({ adjust, focusRef, onFocusChange, style, drag, children }: {
  adjust: Adjust; focusRef?: (el: View | null) => void; onFocusChange: (focused: boolean) => void; style: ViewStyle;
  drag: ReturnType<typeof useDrag>; children: ReactNode;
}) {
  return (
    <View ref={el => { (drag.ref as { current: View | null }).current = el; focusRef?.(el); }} {...drag.handlers} focusable
      accessible accessibilityRole="adjustable" accessibilityLabel={adjust.label}
      accessibilityValue={{ min: 0, max: adjust.max, now: adjust.now, text: adjust.valueText }}
      accessibilityActions={adjust.actions} onAccessibilityAction={event => adjust.onAction(event.nativeEvent.actionName)}
      {...(Platform.OS === "web" ? {
        tabIndex: 0, "aria-valuenow": adjust.now, "aria-valuemin": 0, "aria-valuemax": adjust.max, "aria-valuetext": adjust.valueText,
        onKeyDown: (event: any) => adjust.keys(event.nativeEvent?.key ?? event.key, !!(event.nativeEvent?.shiftKey ?? event.shiftKey)) && event.preventDefault?.(),
        onFocus: (event: any) => onFocusChange(focusVisible(event.currentTarget ?? event.target)),
        onBlur: () => onFocusChange(false),
      } as object : null)}
      style={{ ...style, ...(Platform.OS === "web" ? ({ outlineStyle: "none", touchAction: "none", userSelect: "none", cursor: "pointer" } as unknown as ViewStyle) : null) }}>
      {children}
    </View>
  );
}

export function ColorArea({ hsv, label, valueText, actions, areaRef, onMove, onPick, onStart, onEnd }: {
  hsv: Hsv; label: string; valueText: string; actions: { name: string; label: string }[]; areaRef: (el: View | null) => void;
} & DragHandlers<Hsv>) {
  const [focused, setFocused] = useState(false), id = "kjun-area-" + useId().replace(/[^\w-]/g, "");
  const drag = useDrag((x, y) => onMove({ ...hsv, s: x, v: 1 - y }), onStart, onEnd);
  const key = (k: string, shift: boolean) => { const next = colorAreaKey(k, shift, hsv); if (next) onPick(next); return !!next; };
  return (
    <Adjustable drag={drag} focusRef={areaRef} onFocusChange={setFocused}
      // Swipe up/down moves saturation; the named actions move brightness, which a device screen reader has no other way to reach.
      adjust={{ label, valueText, now: percent(hsv.s), max: 100, keys: key, actions,
        onAction: name => { const k = colorAreaActionKey(name); if (k) key(k, false); } }}
      style={{ height: picker.areaHeight, borderRadius: picker.areaRadius, backgroundColor: rgb({ h: hsv.h, s: 1, v: 1 }) }}>
      <Svg pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
        <Defs>
          <LinearGradient id={id + "w"} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="white" stopOpacity={1} /><Stop offset="1" stopColor="white" stopOpacity={0} /></LinearGradient>
          <LinearGradient id={id + "b"} x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor="black" stopOpacity={1} /><Stop offset="1" stopColor="black" stopOpacity={0} /></LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={picker.areaRadius} fill={`url(#${id}w)`} />
        <Rect x={0} y={0} width="100%" height="100%" rx={picker.areaRadius} fill={`url(#${id}b)`} />
      </Svg>
      <Thumb color={rgb(hsv)} left={`${percent(hsv.s)}%`} top={`${100 - percent(hsv.v)}%`} focused={focused} />
    </Adjustable>
  );
}

const hueStops = [0, 60, 120, 180, 240, 300, 360];
export function ColorChannel({ channel, value, max, label, valueText, color, increase, decrease, onMove, onPick, onStart, onEnd }: {
  channel: "hue" | "alpha"; value: number; max: number; label: string; valueText: string; color: string; increase: string; decrease: string;
} & DragHandlers<number>) {
  const [focused, setFocused] = useState(false), id = "kjun-channel-" + useId().replace(/[^\w-]/g, ""), alpha = channel === "alpha";
  const drag = useDrag(x => onMove(Math.round(x * max)), onStart, onEnd);
  const key = (k: string, shift: boolean) => { const next = channelKey(k, shift, value, max); if (next !== null) onPick(next); return next !== null; };
  return (
    <View style={{ marginHorizontal: picker.thumbSize / 2 }}>
      <Adjustable drag={drag} onFocusChange={setFocused}
        adjust={{ label, valueText, now: Math.round(value), max, keys: key,
          actions: [{ name: "increment", label: increase }, { name: "decrement", label: decrease }],
          onAction: name => key(name === "increment" ? "ArrowRight" : "ArrowLeft", false) }}
        style={{ height: picker.channelHeight, borderRadius: picker.channelRadius }}>
        {alpha && <Checker radius={picker.channelRadius} />}
        <Svg pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              {alpha ? [<Stop key="0" offset="0" stopColor={color} stopOpacity={0} />, <Stop key="1" offset="1" stopColor={color} stopOpacity={1} />]
                : hueStops.map(h => <Stop key={h} offset={String(h / 360)} stopColor={rgb({ h: h % 360, s: 1, v: 1 })} />)}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" rx={picker.channelRadius} fill={`url(#${id})`} />
        </Svg>
        <Thumb left={`${(value / max) * 100}%`} top="50%" focused={focused}>
          {alpha ? <><Checker /><View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color, opacity: value / max }} /></>
            : <View style={{ flex: 1, backgroundColor: color }} />}
        </Thumb>
      </Adjustable>
    </View>
  );
}

/** One radio group of color items; "no color" is the item whose value is null. */
export function SwatchGrid({ items, selected, label, onPick, swatchRef }: {
  items: { value: string | null; label: string }[]; selected: number; label: string;
  onPick: (value: string | null) => void; swatchRef?: (index: number, el: View | null) => void;
}) {
  const { colors } = useKjunStyles();
  const [group, setGroup] = useState<View | null>(null), [focused, setFocused] = useState(-1);
  useLayoutEffect(() => Platform.OS === "web" && group ? bindRadioKeyboard(group as unknown as HTMLElement) : undefined, [group]);
  // Eight fixed columns: start from the panel's content width, then follow the measured row (a narrow screen shrinks the panel).
  const [width, setWidth] = useState(picker.width - 2 * picker.padding);
  const size = colorSwatchSize(width, picker.swatchGap), ring = ringShadow(colors.surface, colors.brand);
  return (
    <View ref={setGroup} accessibilityRole="radiogroup" accessibilityLabel={label}
      onLayout={event => { const next = event.nativeEvent.layout.width; if (next > 0 && Math.abs(next - width) > 0.5) setWidth(next); }}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: picker.swatchGap }}>
      {items.map((item, index) => {
        const checked = index === selected;
        return (
          <Pressable key={index} ref={el => swatchRef?.(index, el)} focusRing={false} accessibilityRole="radio" accessibilityLabel={item.label}
            accessibilityState={{ checked }} {...(Platform.OS === "web" ? { "aria-checked": checked } : null)}
            onFocus={event => setFocused(focusVisible(event.currentTarget) ? index : -1)} onBlur={() => setFocused(-1)}
            onPress={() => onPick(item.value)}
            style={{ width: size, height: size, borderRadius: picker.swatchRadius, alignItems: "center", justifyContent: "center",
              boxShadow: checked || focused === index ? ring : undefined } as ViewStyle}>
            <View style={{ position: "absolute", top: 0, left: 0 }}><ColorChip value={item.value} size={size} /></View>
            {checked && item.value && <KjunIcon name="check" size={picker.swatchIconSize} color={readableInk(item.value) === "light" ? "white" : "black"} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Recent colors under the swatches: a caption and one more radio group. */
export function RecentColors({ items, selected, label, onPick }: { items: { value: string; label: string }[]; selected: number; label: string; onPick: (value: string | null) => void }) {
  const { colors } = useKjunStyles();
  return (
    <View style={{ gap: tokens.dimension.value4 }}>
      <KText accessible={false} importantForAccessibility="no" {...(Platform.OS === "web" ? { "aria-hidden": true } : null)}
        style={{ ...typeStyle("caption"), color: colors.textTertiary }}>{label}</KText>
      <SwatchGrid items={items} selected={selected} label={label} onPick={onPick} />
    </View>
  );
}

/** The eyedropper button (Native Web only) and the hex and % fields. Typing changes the value once a code is complete;
 * submitting or leaving a field commits it (a short code expands, a bad one reverts). */
export function ColorInputs({ fields, value, alpha, alphaPercent, clearable, hexLabel, alphaLabel, eyeDropper, onEdit, onCommit, hexRef }: {
  fields: boolean; value: string | null; alpha: boolean; alphaPercent: number; clearable: boolean; hexLabel: string; alphaLabel: string;
  eyeDropper: { label: string; onPick: () => void } | null;
  onEdit: (live: string | null) => void; onCommit: (next: string | null | "revert") => void; hexRef: (el: TextInput | null) => void;
}) {
  const { colors } = useKjunStyles();
  const shown = hexFieldText(value);
  const [text, setText] = useState(shown), [pct, setPct] = useState(String(alphaPercent));
  // editing: the field being typed in; reported: the last value the fields changed. A value from anywhere else (a swatch,
  // a drag, the app) ends the edit: a tap on a device does not blur the field, so a late blur must not write stale text over it.
  const editing = useRef<"hex" | "alpha" | null>(null), reported = useRef(value);
  useLayoutEffect(() => {
    if (value !== reported.current) { editing.current = null; reported.current = value; }
    if (editing.current !== "hex") setText(shown);
    if (editing.current !== "alpha") setPct(String(alphaPercent));
  }, [value, alphaPercent]);
  const edit = (field: "hex" | "alpha", live: string | null) => { editing.current = field; if (live !== null) reported.current = live; onEdit(live); };
  const commitHex = () => {
    // Nothing typed (or already committed by submitting): leaving the field changes nothing.
    if (editing.current !== "hex") return;
    editing.current = null;
    const next = hexFieldCommit(text, alpha, value, clearable);
    setText(next === "revert" ? shown : hexFieldText(next));
    if (next !== "revert") reported.current = next;
    onCommit(next);
  };
  const commitPct = () => {
    if (editing.current !== "alpha") return;
    editing.current = null;
    const next = alphaFieldLive(pct, value);
    if (next === null) setPct(String(alphaPercent)); else reported.current = next;
    onCommit(next ?? "revert");
  };
  const field = tokens.input.sm;
  const style = { height: field.height, borderRadius: field.radius, paddingHorizontal: field.padding - tokens.border.controlWidth, backgroundColor: colors.inputBg,
    color: colors.text, ...inputTypeStyle("sm"), fontVariant: ["tabular-nums" as const],
    ...(Platform.OS === "web" ? ({ outlineStyle: "none", textTransform: "uppercase" } as object) : null) };
  return (
    <View style={{ flexDirection: "row", gap: picker.swatchGap }}>
      {eyeDropper && (
        <Pressable accessibilityRole="button" accessibilityLabel={eyeDropper.label} onPress={eyeDropper.onPick}
          style={{ width: field.height, height: field.height, borderRadius: field.radius, backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" }}>
          <KjunIcon name="color-picker" size={field.iconSize} color={colors.textSecondary} />
        </Pressable>
      )}
      {fields && (
        <FieldTextInput ref={hexRef} accessibilityLabel={hexLabel} value={text} maxLength={alpha ? 9 : 7} autoCapitalize="characters" autoCorrect={false} spellCheck={false}
          style={{ ...style, flex: 1, minWidth: 0 }}
          onChangeText={next => {
            const clean = next.replace(/^#/, "");
            setText(clean);
            edit("hex", hexFieldLive(clean, alpha, value));
          }}
          onSubmitEditing={commitHex} onBlur={commitHex} />
      )}
      {fields && alpha && (
        <FieldTextInput accessibilityLabel={alphaLabel} value={pct} maxLength={3} keyboardType="number-pad" style={{ ...style, width: picker.alphaInputWidth }}
          onChangeText={next => {
            setPct(next);
            edit("alpha", alphaFieldLive(next, value));
          }}
          onSubmitEditing={commitPct} onBlur={commitPct} />
      )}
    </View>
  );
}
