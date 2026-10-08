import { FieldTextInput, fieldTarget, useFieldSurface } from "./field-surface";
import { typeStyle, inputTypeStyle } from "./typography";
import { useEffect, useRef, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { createNumberDomain, quantityKeyAction, tokens, type InputSize, type InputKeyEvent } from "@kjun/tokens";
import { DsButton } from "./button";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { CompoundTarget } from "./compound-control";
import { finePointer } from "./internal";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";
export interface DsQuantityStepperProps { value: number; min?: number; max?: number; step?: number; precision?: number; disabled?: boolean; error?: boolean; size?: InputSize; block?: boolean; id?: string; ariaLabel?: string; onValueChange?: (value: number) => void; onChangeCommit?: (value: number) => void; onInvalidInput?: (draft: string) => void }
export function DsQuantityStepper({ value, min = 0, max, step = 1, precision = 0, disabled = false, error = false, size = "md", block = false, id, ariaLabel, onValueChange, onChangeCommit, onInvalidInput }: DsQuantityStepperProps) {
  const { colors, fontFamily } = useKjunStyles();
  const field = useKjunField();
  const invalid = error || !!field?.error;
  const labelledBy = !ariaLabel && field?.label ? field.id + "-label" : undefined;
  const geometry = tokens.extensions.compound;
  const buttonStyle = { width: tokens.input[size].height, paddingHorizontal: 0 };
  // Inner edges stay square; only the outer corners follow the field radius, like Web.
  const outer = tokens.input[size].radius;
  const decreaseStyle = { ...buttonStyle, borderRadius: 0, borderTopLeftRadius: outer, borderBottomLeftRadius: outer };
  const increaseStyle = { ...buttonStyle, borderRadius: 0, borderTopRightRadius: outer, borderBottomRightRadius: outer };
  const domain = createNumberDomain({ min, max, step, precision }), valid = domain.valid && domain.accepts(value), blocked = disabled || !valid;
  const surface = useFieldSurface(size, { disabled: blocked, invalid });
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<TextInput>(null);
  const composing = useRef(false), dirty = useRef(false), accepted = useRef(value);
  const cancelledEscape = useRef(false);
  useEffect(() => { setDraft(String(value)); accepted.current = value; dirty.current = false; }, [value, precision, min, max, step]);
  useEffect(() => { if (!valid) console.warn("KJUN QuantityStepper: 범위·step·정밀도·값을 확인하세요."); }, [valid]);
  const emit = (next: number) => { setDraft(String(value)); dirty.current = false; if (value !== next) { onValueChange?.(next); onChangeCommit?.(next); } };
  const commit = () => { if (blocked || composing.current || !dirty.current) return; const next = domain.fromDraft(draft); if (next === null) { onInvalidInput?.(draft); setDraft(String(accepted.current)); dirty.current = false; } else emit(next); };
  const move = (direction: number) => { if (!blocked) emit(domain.move(accepted.current, direction)); };
  const key = (event: InputKeyEvent & { preventDefault?: () => void; stopPropagation?: () => void }) => {
    if (blocked) return;
    const action = quantityKeyAction(event, composing.current, dirty.current);
    if (!action) return;
    event.preventDefault?.();
    if (action === "cancel") {
      event.stopPropagation?.();
      cancelledEscape.current = true;
      dirty.current = false;
      setDraft(String(accepted.current));
    } else if (action === "commit") commit();
    else move(action === "increment" ? 1 : -1);
  };
  const handlers = useRef({ key, edit: (text: string) => { dirty.current = true; setDraft(text); } });
  handlers.current = { key, edit: (text: string) => { dirty.current = true; setDraft(text); } };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const input = inputRef.current as unknown as HTMLInputElement;
    const keydown = (event: KeyboardEvent) => handlers.current.key(event);
    // React Native Web's Modal dismisses on keyup, after our keydown cancellation.
    const keyup = (event: KeyboardEvent) => {
      if (event.key === "Escape" && cancelledEscape.current) {
        cancelledEscape.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const start = () => { composing.current = true; };
    const end = () => { composing.current = false; handlers.current.edit(input.value); };
    input.addEventListener("keydown", keydown); input.addEventListener("keyup", keyup); input.addEventListener("compositionstart", start); input.addEventListener("compositionend", end);
    return () => { input.removeEventListener("keydown", keydown); input.removeEventListener("keyup", keyup); input.removeEventListener("compositionstart", start); input.removeEventListener("compositionend", end); };
  }, []);
  // The filled surface and its ring keep the input height of the size, centred in the row, so sm/md read as
  // different sizes even where touch layouts grow the row to the 44px target.
  const surfaceBox = { position: "absolute" as const, left: 0, right: 0, top: "50%" as const, height: tokens.input[size].height, marginTop: -tokens.input[size].height / 2, borderRadius: surface.spec.radius };
  return <IconFallbacks icons={componentIcons}><View style={{ flexDirection: "row", alignItems: "center", alignSelf: block ? "stretch" : "flex-start", maxWidth: "100%" }}>
    <View pointerEvents="none" aria-hidden={true} style={{ ...surfaceBox, backgroundColor: colors.inputBg }} />
    <CompoundTarget square><DsButton size={size} style={decreaseStyle} variant="ghost" ariaLabel="수량 줄이기" disabled={blocked || value <= min} onPress={() => move(-1)} prefixIcon="minus" /></CompoundTarget>
    <View style={{ flex: block ? 1 : undefined, width: block ? undefined : geometry.valueWidth, minWidth: 0, minHeight: finePointer() ? undefined : tokens.native.minimumTouchTarget, justifyContent: "center" }} {...fieldTarget(() => inputRef.current?.focus(), blocked)}>
    <FieldTextInput {...surface.webHover} onFocus={() => surface.setFocused(true)} ref={inputRef} nativeID={id || field?.id} accessibilityLabel={ariaLabel || field?.label || "수량"} accessibilityLabelledBy={labelledBy} accessibilityHint={field?.error || field?.hint} role="spinbutton" accessibilityValue={{ min, max, now: value }} accessibilityState={{ disabled: blocked }} value={draft} editable={!blocked} inputMode={precision ? "decimal" : "numeric"} onChangeText={text => { dirty.current = true; setDraft(text); }} onBlur={() => { surface.setFocused(false); commit(); }} onSubmitEditing={Platform.OS === "web" ? undefined : commit}
      {...(Platform.OS === "web" ? { "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": value, "aria-labelledby": labelledBy, "aria-describedby": field?.describedBy, "aria-invalid": invalid || undefined, "aria-required": field?.required || undefined } : { onKeyPress: key })}
      style={{ width: "100%", minWidth: 0, ...surface.style, borderRadius: 0, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent", borderRightColor: "transparent", backgroundColor: !blocked && (surface.active || surface.hovered) ? colors.hover : "transparent", outlineWidth: 0, color: surface.ink, fontFamily, ...inputTypeStyle(size), textAlign: "center", paddingHorizontal: surface.spec.padding - tokens.border.controlWidth, paddingVertical: 0 }} />
    </View>
    <CompoundTarget square><DsButton size={size} style={increaseStyle} variant="ghost" ariaLabel="수량 늘리기" disabled={blocked || (max !== undefined && value >= max)} onPress={() => move(1)} prefixIcon="plus" /></CompoundTarget>
    {(invalid || surface.active) && <View pointerEvents="none" aria-hidden={true} style={{ ...surfaceBox, borderWidth: invalid ? tokens.border.controlWidth : tokens.states.focus.width, borderColor: invalid ? colors.danger : colors.focusRing }} />}
  </View></IconFallbacks>;
}
