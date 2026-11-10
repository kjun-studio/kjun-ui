import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { normalizeColor } from "./color";
import {
  createPickerWarnings, initialPickerState, normalizeSwatches, selectedSwatchIndex, stateToValue, syncHsv, type ColorSwatchInput, type PickerState,
} from "./color-picker";
import { createCommitSession, eyeDropperSupported, nextRecentColors, pickScreenColor, recentColorItems } from "./color-picker-model";

// KjunColorPicker's state for React and Native (Vue 3 builds the same from the pure helpers): the value, the panel,
// the HSV being moved, when a pick commits, recent colors and the eyedropper. Rendering stays in each package.
export interface ColorPickerModelOptions {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  onChangeCommit?: (value: string | null) => void;
  swatches?: ColorSwatchInput[];
  custom: boolean;
  alpha: boolean;
  input: boolean;
  clearable: boolean;
  open?: boolean;
  defaultOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  recentColors?: ColorSwatchInput[];
  onRecentColorsChange?: (colors: string[]) => void;
  eyeDropper?: boolean;
}

export function useColorPickerModel(o: ColorPickerModelOptions) {
  const controlled = o.value !== undefined;
  const [inner, setInner] = useState(() => normalizeColor(o.defaultValue ?? null, o.alpha));
  const value = controlled ? normalizeColor(o.value, o.alpha) : inner;
  const swatches = normalizeSwatches(o.swatches ?? [], o.alpha);
  const recent = o.recentColors === undefined ? null : recentColorItems(o.recentColors, o.alpha, swatches);
  const nothing = !o.custom && !o.input && !swatches.length && !o.clearable;
  const [warn] = useState(createPickerWarnings);
  useEffect(() => warn({ raw: controlled ? o.value : o.defaultValue, alpha: o.alpha, swatches: o.swatches, nothing }));

  const [openInner, setOpenInner] = useState(o.defaultOpen);
  const open = (o.open ?? openInner) && !o.disabled && !o.readOnly;
  const setOpen = (next: boolean) => { if (o.open === undefined) setOpenInner(next); o.onOpenChange?.(next); };

  const [state, setState] = useState<PickerState>(() => syncHsv(initialPickerState, value, o.alpha));
  useLayoutEffect(() => setState(prev => syncHsv(prev, value, o.alpha)), [value, o.alpha]);
  // The latest value, so moves within one pick compare against what they reported, not against a render behind.
  const latest = useRef(value);
  latest.current = value;
  const [session] = useState(() => createCommitSession(() => latest.current));
  const change = (next: string | null) => {
    if (next === latest.current) return false;
    latest.current = next;
    if (!controlled) setInner(next);
    o.onValueChange?.(next);
    return true;
  };
  /** A whole pick at once: swatch, key, eyedropper. */
  const pick = (next: string | null) => { if (change(next)) o.onChangeCommit?.(next); };
  const endSession = () => { if (session.end()) o.onChangeCommit?.(latest.current); };
  const moveTo = (next: PickerState) => { setState(next); change(stateToValue(next, o.alpha)); };
  const pickState = (next: PickerState) => { setState(next); pick(stateToValue(next, o.alpha)); };
  /** Drags change on every move and commit once on release. */
  const drag = { onStart: () => session.begin(), onEnd: endSession };
  /** The hex and % fields change while typing and commit on Enter or leaving. */
  const field = {
    onEdit: (live: string | null) => { session.begin(); if (live !== null) change(live); },
    onCommit: (next: string | null | "revert") => { if (next !== "revert") change(next); endSession(); },
  };

  const [canPickScreen, setCanPickScreen] = useState(false);
  useEffect(() => setCanPickScreen(!!o.eyeDropper && eyeDropperSupported()), [o.eyeDropper]);
  // The eyedropper answers later: pick with the callbacks of the latest render, and not at all once unmounted.
  const latestPick = useRef(pick), mounted = useRef(true);
  latestPick.current = pick;
  useEffect(() => () => { mounted.current = false; }, []);
  const pickFromScreen = async () => { const next = await pickScreenColor(o.alpha, latest.current); if (next && mounted.current) latestPick.current(next); };

  // Recent colors move when the panel closes on a new value, so the row never reorders under the pointer.
  const openedWith = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (open) { openedWith.current = latest.current; return; }
    // Closing ends an edit a field had not committed yet (Escape while typing): the change commits once, before recent colors move.
    endSession();
    const start = openedWith.current;
    openedWith.current = undefined;
    if (start === undefined || o.recentColors === undefined || latest.current === start) return;
    const next = nextRecentColors(o.recentColors, latest.current, o.alpha);
    if (next) o.onRecentColorsChange?.(next);
  }, [open]);

  return {
    value, open, setOpen, state, swatches, recent, nothing, showInput: o.input || nothing,
    selected: selectedSwatchIndex(value, swatches, o.clearable), recentSelected: recent ? recent.findIndex(item => item.value === value) : -1,
    pick, moveTo, pickState, drag, field, canPickScreen, pickFromScreen,
  };
}
