import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Platform, View, type StyleProp, type TextInput, type ViewStyle } from "react-native";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { normalizeColor, parseColor } from "../../../shared/package-runtime/color";
import {
  initialFocus, initialPickerState, invalidSwatchCount, normalizeSwatches, stateToValue, syncHsv, warnColorPicker, type ColorSwatchInput, type PickerState,
} from "../../../shared/package-runtime/color-picker";
import { FieldPressable, fieldTarget, useFieldSurface } from "./field-surface";
import { inputTypeStyle } from "./typography";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";
import { ColorArea, ColorChannel, ColorChip, HexInputs, SwatchGrid } from "./color-picker-parts";

export type KjunColorSwatch = ColorSwatchInput;
export interface KjunColorPickerProps {
  /** Uppercase #RRGGBB (#RRGGBBAA with alpha), or null for no color. */
  value?: string | null;
  defaultValue?: string | null;
  /** Every change, also while dragging. */
  onValueChange?: (value: string | null) => void;
  /** Once per finished pick: drag released, swatch or key pressed, hex entered. */
  onChangeCommit?: (value: string | null) => void;
  /** Colors the app offers; strings or { value, label }. */
  swatches?: KjunColorSwatch[];
  /** Saturation/brightness area and hue slider. */
  custom?: boolean;
  /** Opacity slider and % field; the value always carries AA. */
  alpha?: boolean;
  /** Hex field. */
  input?: boolean;
  /** A "no color" swatch that sets the value to null. */
  clearable?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: InputSize;
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Draws the trigger's content; the trigger and its accessibility stay KJUN's. */
  renderTrigger?: (state: { value: string | null; open: boolean }) => ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const pct = (a: number) => Math.round(a * 100);

export function KjunColorPicker({
  value: given, defaultValue = null, onValueChange, onChangeCommit, swatches: rawSwatches, custom = false, alpha = false, input = false,
  clearable = false, open: openGiven, defaultOpen = false, onOpenChange, size = "md", placeholder, ariaLabel, error, disabled = false, readOnly = false,
  renderTrigger, style, testID,
}: KjunColorPickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages, { colors } = useKjunStyles(), field = useKjunField(), spec = tokens.input[size];
  const [inner, setInner] = useState(() => normalizeColor(defaultValue, alpha));
  const value = given !== undefined ? normalizeColor(given, alpha) : inner;
  const raw = given !== undefined ? given : defaultValue;
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || alpha || typeof raw !== "string") return;
    if (parseColor(raw) && /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(raw.trim())) { warned.current = true; warnColorPicker("the value has alpha but alpha is off; it is drawn and reported without it."); }
  }, [raw, alpha]);
  const swatches = normalizeSwatches(rawSwatches ?? [], alpha), invalid = invalidSwatchCount(rawSwatches ?? []) > 0, warnedSwatches = useRef(false);
  useEffect(() => { if (invalid && !warnedSwatches.current) { warnedSwatches.current = true; warnColorPicker("swatches has entries that are not hex colors; they are left out."); } }, [invalid]);
  const nothing = !custom && !input && !swatches.length && !clearable;
  useEffect(() => { if (nothing) warnColorPicker("turn on custom, input or clearable, or give swatches; showing the hex field."); }, [nothing]);
  const showInput = input || nothing;

  const [openInner, setOpenInner] = useState(defaultOpen);
  const open = (openGiven ?? openInner) && !disabled && !readOnly;
  const setOpen = (next: boolean) => { if (openGiven === undefined) setOpenInner(next); onOpenChange?.(next); };

  const [state, setState] = useState<PickerState>(() => syncHsv(initialPickerState, value, alpha));
  useLayoutEffect(() => setState(prev => syncHsv(prev, value, alpha)), [value, alpha]);
  const latest = useRef(value), dragStart = useRef<string | null>(null);
  latest.current = value;
  const change = (next: string | null) => {
    if (next === latest.current) return false;
    latest.current = next;
    if (given === undefined) setInner(next);
    onValueChange?.(next);
    return true;
  };
  const pick = (next: string | null) => { if (change(next)) onChangeCommit?.(next); };
  const moveTo = (next: PickerState) => { setState(next); change(stateToValue(next, alpha)); };
  const pickState = (next: PickerState) => { setState(next); pick(stateToValue(next, alpha)); };
  const drag = {
    onStart: () => { dragStart.current = latest.current; },
    onEnd: () => { if (latest.current !== dragStart.current) onChangeCommit?.(latest.current); },
  };
  const selected = (() => {
    const at = value === null ? -1 : swatches.findIndex(s => s.value === value);
    return clearable ? (value === null ? 0 : at < 0 ? -1 : at + 1) : at;
  })();
  const shownHex = value ? value.slice(0, 7) : "", shownAlpha = value && alpha ? pct(parseColor(value)!.a) : undefined;
  const spoken = value ? m.colorValue(shownHex, shownAlpha) : m.colorNone;
  const label = ariaLabel || field?.label || placeholder || m.colorPlaceholder;

  const ref = useRef<View>(null);
  const surface = useFieldSurface(size, { disabled, invalid: !!error || !!field?.error, open });
  const targets = useRef<{ swatches: (View | null)[]; area: View | null; hex: TextInput | null }>({ swatches: [], area: null, hex: null });
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    // Native Web moves keyboard focus into the panel like the web packages; devices leave focus to the screen reader.
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      const t = targets.current, where = initialFocus({ selectedSwatch: selected >= 0, custom, input: showInput });
      const target = where === "swatch" ? t.swatches[selected] : where === "area" ? t.area : where === "hex" ? t.hex : t.swatches[0];
      (target as unknown as { focus?: () => void } | null)?.focus?.();
    }));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const request = (next: boolean) => { if (!readOnly || !next) setOpen(next); };
  return (
    <>
      <View ref={ref} testID={testID} collapsable={false} {...fieldTarget(() => request(true), disabled)} style={[{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }, style]}>
        <FieldPressable
          {...surface.hover}
          onFocus={() => surface.setFocused(true)}
          onBlur={() => surface.setFocused(false)}
          hitSlop={{ top: surface.hit, bottom: surface.hit, left: 0, right: 0 }}
          nativeID={field?.id}
          accessibilityRole="button"
          // Like the web trigger, the name carries the value so a list of pickers reads their colors.
          accessibilityLabel={label + ", " + spoken}
          accessibilityHint={field?.error || field?.hint}
          accessibilityState={{ disabled, expanded: open }}
          {...(Platform.OS === "web" ? {
            "aria-haspopup": "dialog",
            "aria-invalid": error || !!field?.error || undefined,
            "aria-describedby": field?.describedBy,
            "aria-required": field?.required || undefined,
            "aria-readonly": readOnly || undefined,
          } : {})}
          disabled={disabled}
          onPress={() => request(!open)}
          style={{ ...surface.style, paddingHorizontal: spec.padding - tokens.border.controlWidth, flexDirection: "row", alignItems: "center", gap: spec.affixGap }}
        >
          {renderTrigger ? renderTrigger({ value, open }) : <>
            <ColorChip value={value ? value.slice(0, 7) : null} size={tokens.extensions.colorPicker.triggerSwatch[size]} opacity={value && alpha ? parseColor(value)!.a : 1} />
            <KText numberOfLines={1} style={{ flex: 1, ...inputTypeStyle(size), fontVariant: ["tabular-nums"], color: disabled ? colors.textDisabled : value ? colors.text : colors.inputPlaceholder }}>
              {value ? shownHex : placeholder ?? m.colorPlaceholder}
              {shownAlpha !== undefined && shownAlpha < 100 ? <KText style={{ color: colors.textSecondary }}>{" " + shownAlpha + "%"}</KText> : null}
            </KText>
            <KjunIcon name="chevron-down" size={spec.iconSize} color={surface.icon} />
          </>}
        </FieldPressable>
      </View>
      <FloatingPanel open={open} onOpenChange={setOpen} triggerRef={ref} placement="bottom-start" minimumWidth={tokens.extensions.colorPicker.width} ariaLabel={label}>
        {/* Like Web: the panel border sits inside the width, so the content keeps width - 2 × padding. */}
        <View style={{ width: tokens.extensions.colorPicker.width - 2 * tokens.border.defaultWidth, padding: tokens.extensions.colorPicker.padding - tokens.border.defaultWidth,
          gap: tokens.extensions.colorPicker.gap }}>
          {custom && <ColorArea hsv={state.hsv} label={m.colorArea} valueText={m.colorAreaValue(pct(state.hsv.s), pct(state.hsv.v))}
            increase={m.increaseSaturation} decrease={m.decreaseSaturation} areaRef={el => { targets.current.area = el; }}
            onMove={hsv => moveTo({ ...state, hsv })} onPick={hsv => pickState({ ...state, hsv })} {...drag} />}
          {custom && <ColorChannel channel="hue" value={state.hsv.h} max={360} label={m.hue} valueText={m.hueValue(Math.round(state.hsv.h))}
            color={stateToValue({ hsv: { h: state.hsv.h, s: 1, v: 1 }, a: 1 }, false)} increase={m.increase} decrease={m.decrease}
            onMove={h => moveTo({ ...state, hsv: { ...state.hsv, h } })} onPick={h => pickState({ ...state, hsv: { ...state.hsv, h } })} {...drag} />}
          {alpha && <ColorChannel channel="alpha" value={pct(state.a)} max={100} label={m.alpha} valueText={pct(state.a) + "%"} color={stateToValue(state, false)}
            increase={m.increase} decrease={m.decrease}
            onMove={a => moveTo({ ...state, a: a / 100 })} onPick={a => pickState({ ...state, a: a / 100 })} {...drag} />}
          {showInput && <HexInputs value={value} alpha={alpha} alphaPercent={pct(state.a)} clearable={clearable} hexLabel={m.hex} alphaLabel={m.alpha}
            onPick={pick} hexRef={el => { targets.current.hex = el; }} />}
          {(swatches.length > 0 || clearable) && <SwatchGrid swatches={swatches} clearable={clearable} selected={selected} label={m.swatches} noneLabel={m.colorNone}
            onPick={pick} swatchRef={(index, el) => { targets.current.swatches[index] = el; }} />}
        </View>
      </FloatingPanel>
    </>
  );
}
