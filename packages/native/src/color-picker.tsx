import { useEffect, useRef, useState, type ReactNode } from "react";
import { Platform, View, type StyleProp, type TextInput, type ViewStyle } from "react-native";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { colorName, initialFocusTarget, pickerSummary, stateToValue, swatchItems, type ColorSwatchInput } from "../../../shared/package-runtime/color-picker";
import { colorAreaActions } from "../../../shared/package-runtime/color-picker-model";
import { useColorPickerModel } from "../../../shared/package-runtime/use-color-picker";
import { FieldPressable, fieldTarget, useFieldSurface } from "./field-surface";
import { inputTypeStyle } from "./typography";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";
import { ColorArea, ColorChannel, ColorChip, ColorInputs, SwatchGrid, SwatchGroup } from "./color-picker-parts";

export type KjunColorSwatch = ColorSwatchInput;
export interface KjunColorPickerProps {
  /** Uppercase #RRGGBB (#RRGGBBAA with alpha), or null for no color. */
  value?: string | null;
  defaultValue?: string | null;
  /** Every change, also while dragging. */
  onValueChange?: (value: string | null) => void;
  /** Once per finished pick: drag released, swatch, key or eyedropper, hex or % field submitted or left. */
  onChangeCommit?: (value: string | null) => void;
  /** Colors the app offers; strings or { value, label }. A label names the color on the trigger. */
  swatches?: KjunColorSwatch[];
  /** Saturation/brightness area and hue slider. */
  custom?: boolean;
  /** Opacity slider and % field; the value always carries AA. */
  alpha?: boolean;
  /** Hex field. */
  input?: boolean;
  /** A "no color" swatch that sets the value to null. */
  clearable?: boolean;
  /** Recent colors the app keeps (strings or { value, label }); giving it shows a "recent" row of up to 8 under the swatches,
   * leaving out colors the swatches already offer. */
  recentColors?: KjunColorSwatch[];
  /** The next recent colors, once the panel closes on a new value: that value first, at most 8. Store it to keep the row. */
  onRecentColorsChange?: (colors: string[]) => void;
  /** A button that picks a color from the screen. Only Native Web in a browser with an EyeDropper (Chromium desktop) draws it; devices have none. */
  eyeDropper?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: InputSize;
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Draws the panel in the page flow, without a trigger: a filled 240px block for settings screens. open, size, placeholder,
   * variant and renderTrigger do not apply. Recent colors move after each finished pick that did not come from the recent row. */
  inline?: boolean;
  /** "swatch" draws a square color button as tall as the field (for toolbars) instead of the field trigger. */
  variant?: "field" | "swatch";
  /** With variant="swatch": an icon over a bar of the color, on a clear button (a text-color tool). */
  icon?: string;
  /** Draws the trigger's content; the trigger and its accessibility stay KJUN's. */
  renderTrigger?: (state: { value: string | null; open: boolean }) => ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const pct = (a: number) => Math.round(a * 100);
const picker = tokens.extensions.colorPicker;

export function KjunColorPicker({
  value, defaultValue = null, onValueChange, onChangeCommit, swatches: rawSwatches, custom = false, alpha = false, input = false,
  clearable = false, recentColors, onRecentColorsChange, eyeDropper = false, open: openGiven, defaultOpen = false, onOpenChange, size = "md",
  placeholder, ariaLabel, error, disabled = false, readOnly = false, inline = false, variant = "field", icon, renderTrigger, style, testID,
}: KjunColorPickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages, { colors } = useKjunStyles(), field = useKjunField(), spec = tokens.input[size];
  const model = useColorPickerModel({
    value, defaultValue, onValueChange, onChangeCommit, swatches: rawSwatches, custom, alpha, input, clearable,
    open: openGiven, defaultOpen, onOpenChange, disabled, readOnly, recentColors, onRecentColorsChange, eyeDropper, inline,
  });
  const { value: current, open, setOpen, state, selected } = model;
  const summary = pickerSummary(current, alpha, m, colorName(current, [model.swatches, model.recent ?? []])), spoken = summary.spoken;
  // Native is touch: the panel follows the trigger width (up to the touch maximum) so swatches and tracks grow under a finger.
  const [triggerWidth, setTriggerWidth] = useState(0);
  const panelWidth = Math.min(Math.max(picker.width, triggerWidth), picker.touchMaxWidth);
  const detail = summary.percent !== undefined && summary.percent < 100 ? summary.percent + "%" : "";
  const grid = (model.swatches.length > 0 || clearable) && { items: swatchItems(model.swatches, clearable, m.colorNone), selected, label: m.swatches, onPick: model.pick, ground: inline ? colors.inputBg : undefined,
    swatchRef: (index: number, el: View | null) => { targets.current.swatches[index] = el; } };
  const recent = model.recent && model.recent.length > 0 && { items: model.recent, selected: model.recentSelected, label: m.recentColors, onPick: model.pickRecent, ground: inline ? colors.inputBg : undefined };
  const label = ariaLabel || field?.label || placeholder || m.colorPlaceholder;

  const ref = useRef<View>(null);
  const surface = useFieldSurface(size, { disabled, invalid: !!error || !!field?.error, open });
  const targets = useRef<{ swatches: (View | null)[]; area: View | null; hex: TextInput | null }>({ swatches: [], area: null, hex: null });
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    // Native Web moves keyboard focus into the panel like the web packages; devices leave focus to the screen reader.
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      // Someone already put focus on a control (clicked a field in the panel): leave it there.
      if (typeof document !== "undefined" && document.activeElement?.matches('input, textarea, [role="slider"], [role="radio"]')) return;
      const target = initialFocusTarget(targets.current, { selected, custom, input: model.showInput });
      (target as unknown as { focus?: () => void } | null)?.focus?.();
    }));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const request = (next: boolean) => { if (!readOnly || !next) setOpen(next); };
  const body = (width: number) => (
    // Like Web: the panel border sits inside the width, so the content keeps width - 2 × padding.
    <View style={{ width: width - 2 * tokens.border.defaultWidth, padding: picker.padding - tokens.border.defaultWidth, gap: picker.gap }}>
      {custom && <ColorArea hsv={state.hsv} label={m.colorArea} valueText={m.colorAreaValue(pct(state.hsv.s), pct(state.hsv.v))} empty={current === null} hint={m.colorAreaHint}
        actions={colorAreaActions(m)} areaRef={el => { targets.current.area = el; }}
        onMove={hsv => model.moveTo({ ...state, hsv })} onPick={hsv => model.pickState({ ...state, hsv })} {...model.drag} />}
      {custom && <ColorChannel channel="hue" value={state.hsv.h} max={360} label={m.hue} valueText={m.hueValue(Math.round(state.hsv.h))}
        color={stateToValue({ hsv: { h: state.hsv.h, s: 1, v: 1 }, a: 1 }, false)} increase={m.increase} decrease={m.decrease}
        onMove={h => model.moveTo({ ...state, hsv: { ...state.hsv, h } })} onPick={h => model.pickState({ ...state, hsv: { ...state.hsv, h } })} {...model.drag} />}
      {alpha && <ColorChannel channel="alpha" value={pct(state.a)} max={100} label={m.alpha} valueText={pct(state.a) + "%"} color={stateToValue(state, false)}
        increase={m.increase} decrease={m.decrease} spaced={custom}
        onMove={a => model.moveTo({ ...state, a: a / 100 })} onPick={a => model.pickState({ ...state, a: a / 100 })} {...model.drag} />}
      {(model.showInput || model.canPickScreen) && <ColorInputs fields={model.showInput} value={current} alpha={alpha} alphaPercent={pct(state.a)} clearable={clearable}
        hexLabel={m.hex} alphaLabel={m.alpha} eyeDropper={model.canPickScreen ? { label: m.eyeDropper, onPick: model.pickFromScreen } : null}
        onEdit={model.field.onEdit} onCommit={model.field.onCommit} hexRef={el => { targets.current.hex = el; }} surface={inline} />}
      {(grid || recent) && <View style={{ gap: picker.gap, marginTop: custom || alpha || model.showInput || model.canPickScreen ? picker.sectionGap - picker.gap : 0 }}>
        {grid && (recent ? <SwatchGroup caption={m.swatches} {...grid} /> : <SwatchGrid {...grid} />)}
        {recent && <SwatchGroup caption={m.recentColors} {...recent} />}
      </View>}
    </View>
  );

  // inline: the panel sits in the page as a filled block; no border or shadow, which belong to floating layers.
  if (inline) return (
    <View testID={testID} role="group" accessibilityLabel={ariaLabel || field?.label || m.colorPlaceholder} accessibilityHint={field?.error || field?.hint}
      {...(Platform.OS === "web" ? { "aria-describedby": field?.describedBy, "aria-disabled": disabled || undefined } : {})}
     
      style={[{ pointerEvents: disabled || readOnly ? "none" : "auto" }, { alignSelf: "flex-start", maxWidth: "100%", backgroundColor: colors.inputBg, borderRadius: tokens.input.md.radius, opacity: disabled ? tokens.states.opacity.disabled : 1 }, style]}>
      {/* The panel padding without a border: body() takes the border back out of the width. */}
      <View style={{ margin: tokens.border.defaultWidth }}>{body(picker.width)}</View>
    </View>
  );

  const swatch = variant === "swatch", tool = swatch && !!icon;
  const content = renderTrigger ? renderTrigger({ value: current, open })
    : tool ? <View style={{ alignItems: "center", gap: picker.indicatorGap, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>
        <KjunIcon name={icon!} size={spec.iconSize} color={colors.text} />
        <View style={{ width: picker.indicatorWidth, height: picker.indicatorHeight, borderRadius: picker.indicatorRadius, overflow: "hidden",
          backgroundColor: current ? summary.hex : colors.textTertiary, opacity: current ? summary.opacity : tokens.states.opacity.disabled }} />
      </View>
    : swatch ? <View style={{ opacity: disabled ? tokens.states.opacity.disabled : 1 }}><ColorChip value={current ? summary.hex : null} size={tokens.extensions.colorPicker.triggerSwatch[size]} opacity={summary.opacity} /></View>
    : <>
      <ColorChip value={current ? summary.hex : null} size={tokens.extensions.colorPicker.triggerSwatch[size]} opacity={summary.opacity} />
      <KText numberOfLines={1} style={{ flex: 1, ...inputTypeStyle(size), fontVariant: ["tabular-nums"], color: disabled ? colors.textDisabled : current ? colors.text : colors.inputPlaceholder }}>
        {current ? summary.name ?? summary.hex : placeholder ?? m.colorPlaceholder}
        {current && (summary.name || detail) ? <KText style={{ color: colors.textSecondary }}>{" " + (summary.name ? summary.hex + (detail && " " + detail) : detail)}</KText> : null}
      </KText>
      <KjunIcon name="chevron-down" size={spec.iconSize} color={surface.icon} />
    </>;
  // A tool button is clear until hovered or open; a swatch button keeps the field fill. Both are as wide as they are tall.
  const shape = swatch ? { width: spec.height, paddingHorizontal: 0, justifyContent: "center" as const,
    ...(tool ? { backgroundColor: open ? colors.active : surface.hovered && !disabled ? colors.hover : "transparent", borderColor: "transparent" } : {}) }
    : { paddingHorizontal: spec.padding - tokens.border.controlWidth, gap: spec.affixGap };
  return (
    <>
      <View ref={ref} testID={testID} collapsable={false} {...fieldTarget(() => request(true), disabled)} onLayout={event => setTriggerWidth(event.nativeEvent.layout.width)}
        style={[{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center", ...(swatch ? { alignSelf: "flex-start" as const } : {}) }, style]}>
        <FieldPressable
          {...surface.hover}
          onFocus={() => surface.setFocused(true)}
          onBlur={() => surface.setFocused(false)}
          hitSlop={{ top: surface.hit, bottom: surface.hit, left: swatch ? surface.hit : 0, right: swatch ? surface.hit : 0 }}
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
          style={{ ...surface.style, flexDirection: "row", alignItems: "center", ...shape }}
        >
          {content}
        </FieldPressable>
      </View>
      <FloatingPanel open={open} onOpenChange={setOpen} triggerRef={ref} placement="bottom-start" minimumWidth={swatch ? picker.width : panelWidth} ariaLabel={label}>
        {body(swatch ? picker.width : panelWidth)}
      </FloatingPanel>
    </>
  );
}
