import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { createSegmentTyping, periodLeads, segmentStep, timeSegments, type HourCycle, type TimeSegmentModel } from "../../../shared/package-runtime/time-segments";
import { resolveTimeLayout, resolveTimeTrigger, timeText, timeWheel, wheelPick, wheelStart, type TimeLayout, type TimeTrigger, type WheelColumnKey } from "../../../shared/package-runtime/time-wheel";
import { coarsePointer } from "../../../shared/package-runtime/color-picker";
import { warnPicker } from "../../../shared/package-runtime/calendar";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Platform, Pressable, View } from "react-native";
import { createTimeDomain, tokens, type TimePrecision, type InputSize } from "@kjun-ui/tokens";
import { FieldClear } from "./field-clear";
import { FieldPressable, fieldTarget, useFieldSurface } from "./field-surface";
import { KjunButton, KjunIcon } from "./button";
import { KjunDrawer } from "./drawer";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import { KText } from "./internal";
import { inputTypeStyle } from "./typography";
import { useKjunField } from "./input";
import { TimeWheel } from "./time-wheel";
export type { TimeLayout, TimeTrigger };
export interface KjunTimePickerProps { value: string | null; precision?: TimePrecision; min?: string; max?: string; minuteStep?: number; secondStep?: number; disabled?: boolean; error?: boolean; clearable?: boolean; size?: InputSize; ariaLabel?: string;
  /** 24 (default) shows 00–23; 12 adds an AM/PM column and shows 1–12. The value stays "HH:mm". */
  hourCycle?: HourCycle;
  /** Where the wheel opens: auto (default) takes a bottom sheet on devices and touch screens and a popover under a mouse;
   * inline shows the wheel in place with no field. */
  layout?: TimeLayout;
  /** The field that opens the wheel: segments (typing digits works on the web preview; the popover default) or a one-line button (the sheet default). */
  trigger?: TimeTrigger;
  /** Shows the time without changing it. */
  readOnly?: boolean;
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block?: boolean;
  /** Each change: a confirmed wheel, a typed segment, a cleared field, or a stopped inline column. */
  onValueChange?: (value: string | null) => void; onChangeCommit?: (value: string | null) => void }

const segmentText = (segment: TimeSegmentModel) => segment.value === null ? "" : segment.options.find(option => option.value === segment.value)?.label ?? String(segment.value).padStart(2, "0");

export function KjunTimePicker({ value, precision = "minute", min, max, minuteStep = 1, secondStep = 1, disabled = false, error = false, clearable = true, size = "md", ariaLabel,
  hourCycle = 24, layout: layoutProp = "auto", trigger: triggerProp, readOnly = false, block = false, onValueChange, onChangeCommit }: KjunTimePickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  ariaLabel ??= m.time;
  const geometry = tokens.extensions.timePicker, spec = tokens.input[size];
  const { colors } = useKjunStyles();
  const root = useRef<View>(null), segmentViews = useRef<(View | null)[]>([]), opener = useRef<View | null>(null);
  const [typing] = useState(createSegmentTyping);
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState<number | null>(null);
  const field = useKjunField(), uid = useId();
  const fieldId = field?.id || `kjun-time-${uid}`;
  // Devices and touch screens take the sheet; the web preview under a mouse takes the popover, like the web packages.
  const [coarse] = useState(() => Platform.OS !== "web" || coarsePointer());
  const layout = resolveTimeLayout(layoutProp, coarse), trigger = resolveTimeTrigger(triggerProp, layout === "inline" ? "popover" : layout);
  const domain = useMemo(() => createTimeDomain({ precision, min, max, minuteStep, secondStep }), [precision, min, max, minuteStep, secondStep]);
  // Only a broken domain locks the field; a value off the step or bounds stays editable and snaps on the next choice.
  const accepted = domain.accepts(value);
  useEffect(() => { if (!domain.valid) warnPicker("TimePicker: check min, max, minuteStep and secondStep."); else if (!accepted) warnPicker(`TimePicker: ${value} is outside the step or bounds.`); }, [domain, accepted, value]);
  const blocked = disabled || !domain.valid, invalid = error || !!field?.error;
  const change = (next: string | null) => { if (!blocked && !readOnly && next !== value) { onValueChange?.(next); onChangeCommit?.(next); } };
  const shape = { precision, hourCycle, minuteStep, secondStep, messages: m, periodFirst: periodLeads(scope.language) };
  // Segments and the button are named like the web ones: the field's label (or ariaLabel).
  const name = field?.label || ariaLabel;

  // popover and sheet turn a draft and commit it with the confirm button; inline commits each stop.
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(() => wheelStart(domain, value)), [focusColumn, setFocusColumn] = useState<number | null>(null);
  const openAt = (column: number, from: View | null) => {
    if (blocked || readOnly) return;
    opener.current = from;
    setDraft(wheelStart(domain, value)); setFocusColumn(column); setOpen(true);
  };
  const close = () => { setOpen(false); if (Platform.OS === "web") opener.current?.focus?.(); };
  const confirm = () => { change(draft); close(); };
  const shown = layout === "inline" && value !== null && accepted ? value : draft;
  const pick = (key: WheelColumnKey, next: number) => {
    const time = wheelPick(domain, shown, key, next, shape);
    setDraft(time);
    if (layout === "inline") change(time);
  };
  const wheel = (inline: boolean) => <TimeWheel columns={timeWheel(domain, shown, shape)} label={name} inline={inline} disabled={blocked} readOnly={readOnly}
    focusColumn={inline ? null : focusColumn} onPick={pick} onEnter={inline ? undefined : confirm} />;
  const buttonSize = layout === "sheet" ? "md" : "sm";
  const now = <KjunButton size={buttonSize} variant="ghost" onPress={() => setDraft(wheelStart(domain, null))}>{m.now}</KjunButton>;
  const buttons = <>
    <KjunButton size={buttonSize} variant="secondary" onPress={close}>{m.cancel}</KjunButton>
    <KjunButton size={buttonSize} variant="primary" onPress={confirm}>{m.confirm}</KjunButton>
  </>;

  if (layout === "inline") return <View nativeID={fieldId} style={{ alignSelf: block ? "stretch" : "flex-start", maxWidth: "100%", padding: geometry.panelPadding, borderRadius: tokens.radius.radius12,
    backgroundColor: colors.inputBg, borderWidth: invalid ? tokens.border.controlWidth : 0, borderColor: colors.danger }}>{wheel(true)}</View>;

  const panel = layout === "sheet"
    ? <KjunDrawer open={open && !blocked} onOpenChange={next => { if (!next) close(); }} position="bottom" title={name} closable={false} handle headerActions={now} footer={buttons}>
        {wheel(false)}
      </KjunDrawer>
    : <FloatingPanel open={open && !blocked} onOpenChange={next => { if (!next) close(); }} triggerRef={root} placement="bottom-start" ariaLabel={name}>
        <View style={{ padding: geometry.panelPadding, gap: geometry.panelGap }}>
          {wheel(false)}
          <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value8 }}>{now}<View style={{ flex: 1 }} />{buttons}</View>
        </View>
      </FloatingPanel>;

  if (trigger === "button") return <ButtonField size={size} name={name} text={timeText(domain, value, shape)} placeholder={m.selectTime} fieldId={fieldId} disabled={blocked} readOnly={readOnly}
    invalid={invalid} open={open} block={block} rootRef={root} clearLabel={clearable && value !== null && !blocked && !readOnly ? m.clearValue(ariaLabel) : undefined}
    onOpen={from => openAt(0, from)} onClear={() => change(null)}>{panel}</ButtonField>;

  const segments = timeSegments(domain, value, shape);
  // A time is a short fixed-length value, so the field hugs it; block stretches it like Input.
  return <>
    <View ref={root} collapsable={false} role="group" accessibilityLabel={name} accessibilityHint={field?.error || field?.hint}
      {...(Platform.OS === "web" ? { "aria-describedby": field?.describedBy } : {})}
      style={{ flexDirection: "row", alignItems: "center", alignSelf: block ? "stretch" : "flex-start", maxWidth: "100%", minWidth: 0, backgroundColor: colors.inputBg, borderRadius: spec.radius }}>
      <View style={{ ...(block ? { flex: 1 } : {}), flexDirection: "row", alignItems: "center", minWidth: 0 }}
        {...(Platform.OS === "web" ? { onKeyDown: (event: { key: string; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; target: unknown; preventDefault: () => void }) => {
          // Native Web types like the web packages: digits (and a/p on AM/PM) pick a segment's value and a full segment moves on; ↑ and ↓ step it.
          if (blocked || readOnly || event.altKey || event.ctrlKey || event.metaKey) return;
          const index = segments.findIndex((_, i) => (segmentViews.current[i] as unknown) === event.target);
          if (index < 0) return;
          const stepped = segmentStep(segments[index], event.key);
          if (stepped !== null) { event.preventDefault(); change(segments[index].pick(stepped)); return; }
          const typed = typing.key(segments[index], index, event.key);
          if (!typed) return;
          event.preventDefault();
          if (typed.value !== null) change(segments[index].pick(typed.value));
          if (typed.advance) segmentViews.current[index + 1]?.focus?.();
        } } : {})}>
        {segments.map((segment, index) => {
          // The AM/PM segment reads as a word, so it carries no ":" before or after it.
          const separated = index > 0 && segment.key !== "period" && segments[index - 1].key !== "period";
          const text = segmentText(segment), leading = index === 0;
          return <Fragment key={segment.key}>{separated ? <KText aria-hidden={true} style={{ ...inputTypeStyle(size), width: geometry.separatorWidth, textAlign: "center", color: blocked ? colors.textDisabled : colors.textSecondary }}>:</KText> : null}
            <Pressable ref={view => { segmentViews.current[index] = view; }} nativeID={leading ? fieldId : `${fieldId}-${index}`} disabled={blocked}
              accessibilityRole="button" accessibilityLabel={name + " " + segment.label} accessibilityValue={{ text: text || m.timePlaceholder }}
              accessibilityState={{ disabled: blocked, expanded: open }}
              {...(Platform.OS === "web" ? { "aria-invalid": invalid || undefined, "aria-readonly": readOnly || undefined, "aria-haspopup": "dialog" } : {})}
              hitSlop={{ top: Math.max(0, (tokens.native.minimumTouchTarget - spec.height) / 2), bottom: Math.max(0, (tokens.native.minimumTouchTarget - spec.height) / 2) }}
              onHoverIn={() => setHovered(index)} onHoverOut={() => setHovered(current => current === index ? null : current)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onPress={() => openAt(index, segmentViews.current[index])}
              style={({ pressed }) => ({ height: spec.height, minWidth: geometry.segmentMinimumWidth, justifyContent: "center", alignItems: leading ? "flex-start" : "center",
                marginLeft: index > 0 && !separated ? geometry.separatorWidth : 0, borderRadius: spec.radius,
                paddingLeft: leading ? spec.padding : geometry.segmentPadding, paddingRight: geometry.segmentPadding,
                backgroundColor: !blocked && !readOnly && (pressed || hovered === index) ? colors.hover : "transparent",
                ...(Platform.OS === "web" ? { outlineStyle: "none", cursor: readOnly ? "default" : undefined } as object : {}) })}>
              <KText style={{ ...inputTypeStyle(size), fontVariant: ["tabular-nums"], color: blocked ? colors.textDisabled : text ? colors.text : colors.inputPlaceholder }}>{text || m.timePlaceholder}</KText>
            </Pressable></Fragment>;
        })}
      </View>
      {/* The 44px clear target overflows the row so the field keeps its size height. Without a value to clear (or while disabled) the slot shows a clock. */}
      {clearable && value !== null && !blocked && !readOnly
        ? <View style={{ marginVertical: Math.min(0, (spec.height - tokens.native.minimumTouchTarget) / 2) }}><FieldClear size={size} label={m.clearValue(ariaLabel)} onPress={() => { change(null); segmentViews.current[0]?.focus?.(); }} /></View>
        : <View aria-hidden={true} importantForAccessibility="no-hide-descendants" {...fieldTarget(() => openAt(0, segmentViews.current[0]), blocked || readOnly)}
            style={{ width: tokens.native.minimumTouchTarget, alignSelf: "stretch", alignItems: "center", justifyContent: "center" }}>
            <View pointerEvents="none"><KjunIcon name="clock" size={spec.iconSize} color={blocked ? colors.textDisabled : colors.textTertiary} /></View></View>}
      {/* Focus and an open wheel draw Input's inner border; an error keeps the danger border. */}
      {!!(invalid || ((focused || open) && !blocked)) && <View pointerEvents="none" aria-hidden={true} style={{ position: "absolute", inset: 0, borderRadius: spec.radius,
        borderWidth: tokens.border.controlWidth, borderColor: invalid ? colors.danger : colors.inputBorderFocus }} />}
    </View>
    {panel}
  </>;
}

/** The one-line field that reads the time and opens the wheel, like DatePicker's field. */
function ButtonField({ size, name, text, placeholder, fieldId, disabled, readOnly, invalid, open, block, rootRef, clearLabel, onOpen, onClear, children }: {
  size: InputSize; name: string; text: string; placeholder: string; fieldId: string; disabled: boolean; readOnly: boolean; invalid: boolean; open: boolean; block: boolean;
  rootRef: RefObject<View | null>; clearLabel?: string; onOpen: (from: View | null) => void; onClear: () => void; children: ReactNode }) {
  const { colors } = useKjunStyles(), field = useKjunField(), spec = tokens.input[size];
  const button = useRef<View>(null);
  const surface = useFieldSurface(size, { disabled, readOnly, invalid, open });
  return <>
    <View ref={rootRef} collapsable={false} {...fieldTarget(() => onOpen(button.current), disabled || readOnly)}
      style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center", alignSelf: block ? "stretch" : "flex-start", maxWidth: "100%" }}>
      <FieldPressable ref={button} {...surface.hover} onFocus={() => surface.setFocused(true)} onBlur={() => surface.setFocused(false)}
        hitSlop={{ top: surface.hit, bottom: surface.hit, left: 0, right: 0 }} nativeID={fieldId}
        accessibilityRole="button" accessibilityLabel={name} accessibilityValue={{ text }} accessibilityHint={field?.error || field?.hint}
        accessibilityState={{ disabled, expanded: open && !disabled }}
        {...(Platform.OS === "web" ? { "aria-invalid": invalid || undefined, "aria-describedby": field?.describedBy, "aria-required": field?.required || undefined,
          "aria-readonly": readOnly || undefined, "aria-haspopup": "dialog" } : {})}
        disabled={disabled} onPress={() => { if (!readOnly) onOpen(button.current); }}
        style={{ ...surface.style, paddingHorizontal: spec.padding - tokens.border.controlWidth, flexDirection: "row", alignItems: "center", gap: spec.affixGap }}>
        <KText numberOfLines={1} style={{ ...(block ? { flex: 1 } : { flexShrink: 1 }), marginRight: clearLabel ? spec.clearSize + spec.affixGap : 0, ...inputTypeStyle(size), fontVariant: ["tabular-nums"],
          color: disabled ? colors.textDisabled : text ? colors.text : colors.inputPlaceholder }}>{text || placeholder}</KText>
        <KjunIcon name="clock" size={spec.iconSize} color={surface.icon} />
      </FieldPressable>
      {!!clearLabel && <View style={{ position: "absolute", right: spec.padding + spec.iconSize + spec.affixGap, top: 0, bottom: 0, justifyContent: "center" }}>
        <FieldClear mark size={size} label={clearLabel} onPress={() => { onClear(); button.current?.focus?.(); }} />
      </View>}
    </View>
    {children}
  </>;
}
